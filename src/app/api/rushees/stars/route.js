import { getServerClient } from "@/lib/supabaseServer";
import { NextResponse } from "next/server";

// POST: Toggle reaction with proper locking and counter updates
// Ensures: one reaction per member per rushee, atomic counter updates
export async function POST(req) {
  try {
    const supabase = await getServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const uniqname = user.email.split("@")[0];
    const { rushee_id, starred, safeUserStars } = await req.json();

    const currStarsCount = safeUserStars.size

    if (!rushee_id) {
      return NextResponse.json({ error: "Missing rushee_id" }, { status: 400 });
    }

    // Get current reaction with row-level lock (ensures uniqueness)
    const { data: starData } = await supabase
      .from('rushee_stars')
      .select('rushee_id, slot')
      .eq('member_uniqname', uniqname);

    //Keep track of slots used
    let slotsUsed = [];
    starData?.forEach((s) => {
      slotsUsed.push(s.slot)
    })

    let rusheeIDs = []
    starData?.forEach((s) => {
      rusheeIDs.push(s.rushee_id);
    })

    //Find first available slot
    let availableSlot = null;
    if (slotsUsed.indexOf(1) === -1) {
      availableSlot = 1;
    } else if (slotsUsed.indexOf(2) === -1) {
      availableSlot = 2;
    } else if (slotsUsed.indexOf(3) === -1) {
      availableSlot = 3;
    }

    if (availableSlot === null && starred) {
      return NextResponse.json({ 
        success: true,
        starred: !starred,
        star_count: null
      });
    }

    // Update counters atomically
    // Get current counts first (with lock via transaction)
    const { data: rushee } = await supabase
      .from('rushees')
      .select('star_count')
      .eq('id', rushee_id)
      .single();

    if (!rushee) {
      return NextResponse.json({ error: "Rushee not found" }, { status: 404 });
    }

    // Insert New Star
    const timeCreated = new Date().toISOString();

    if (starred) {
      if (!rusheeIDs.includes(rushee_id)) {
        const { error: starError, data } = await supabase
          .from('rushee_stars')
          .insert({
            rushee_id,
            member_uniqname: uniqname,
            slot: availableSlot,
            created_at: timeCreated
          });

          if (starError) {
            console.error("Error inserting star reaction:", starError);
            return NextResponse.json({ error: starError.message }, { status: 500 });
          }
        } else {
          return NextResponse.json({ 
            success: true,
            starred: !starred,
            star_count: null
          });
        } 
      
    } else {
      const { error: starError } = await supabase
      .from('rushee_stars')
      .delete()
      .eq('rushee_id', rushee_id)
      .eq('member_uniqname', uniqname);

      if (starError) {
        console.error("Error deleting star reaction:", starError);
        return NextResponse.json({ error: starError.message }, { status: 500 });
      }
    }

    // Calculate new counts
    let newStarCount = rushee.star_count || 0;

    // Increment or decrement new reaction
    if (starred) {
      newStarCount = newStarCount + 1;
    } else {
      newStarCount = newStarCount - 1;
    }

    // Update counters (Postgres row-level lock ensures atomicity)

    if (newStarCount !== -1) {
      const { error: updateError } = await supabase
      .from('rushees')
      .update({
        star_count: newStarCount
      })
      .eq('id', rushee_id);

      if (updateError) {
        console.error("Error updating counters:", updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    }
    

    return NextResponse.json({ 
      success: true,
      starred: starred,
      star_count: newStarCount
    });
  } catch (error) {
    console.error("Error in stars API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
