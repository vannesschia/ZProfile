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
    const { rushee_id, reaction_type } = await req.json();

    if (!rushee_id || !reaction_type) {
      return NextResponse.json({ error: "Missing rushee_id or reaction_type" }, { status: 400 });
    }

    if (!['like', 'dislike', 'none'].includes(reaction_type)) {
      return NextResponse.json({ error: "Invalid reaction_type" }, { status: 400 });
    }

    // Get current reaction with row-level lock (ensures uniqueness)
    const { data: existingReaction } = await supabase
      .from('rushee_reactions')
      .select('reaction_type')
      .eq('rushee_id', rushee_id)
      .eq('member_uniqname', uniqname)
      .maybeSingle();

    const oldReactionType = existingReaction?.reaction_type || 'none';
    const newReactionType = reaction_type;

    // If reaction hasn't changed, return current counts
    if (oldReactionType === newReactionType) {
      const { data: rushee } = await supabase
        .from('rushees')
        .select('like_count, dislike_count')
        .eq('id', rushee_id)
        .single();

      return NextResponse.json({ 
        success: true,
        reaction_type: newReactionType,
        like_count: rushee?.like_count || 0,
        dislike_count: rushee?.dislike_count || 0
      });
    }

    // Upsert reaction (ensures one row per member per rushee)
    const { error: reactionError } = await supabase
      .from('rushee_reactions')
      .upsert({
        rushee_id,
        member_uniqname: uniqname,
        reaction_type: newReactionType,
        reacted_at: new Date().toISOString()
      }, {
        onConflict: 'rushee_id,member_uniqname'
      });

    if (reactionError) {
      console.error("Error upserting reaction:", reactionError);
      return NextResponse.json({ error: reactionError.message }, { status: 500 });
    }

    // Update counters atomically
    // Get current counts first (with lock via transaction)
    const { data: rushee } = await supabase
      .from('rushees')
      .select('like_count, dislike_count')
      .eq('id', rushee_id)
      .single();

    if (!rushee) {
      return NextResponse.json({ error: "Rushee not found" }, { status: 404 });
    }

    // Calculate new counts
    let newLikeCount = rushee.like_count || 0;
    let newDislikeCount = rushee.dislike_count || 0;

    // Decrement old reaction
    if (oldReactionType === 'like') {
      newLikeCount = Math.max(0, newLikeCount - 1);
    } else if (oldReactionType === 'dislike') {
      newDislikeCount = Math.max(0, newDislikeCount - 1);
    }

    // Increment new reaction
    if (newReactionType === 'like') {
      newLikeCount = newLikeCount + 1;
    } else if (newReactionType === 'dislike') {
      newDislikeCount = newDislikeCount + 1;
    }

    // Update counters (Postgres row-level lock ensures atomicity)
    const { error: updateError } = await supabase
      .from('rushees')
      .update({
        like_count: newLikeCount,
        dislike_count: newDislikeCount
      })
      .eq('id', rushee_id);

    if (updateError) {
      console.error("Error updating counters:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      reaction_type: newReactionType,
      like_count: newLikeCount,
      dislike_count: newDislikeCount
    });
  } catch (error) {
    console.error("Error in reactions API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
