import { getServerClient } from "@/lib/supabaseServer";
import { NextResponse } from "next/server";

// POST: Update cut_status for multiple rushees
// Requires admin privileges
export async function POST(req) {
  try {
    const supabase = await getServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const uniqname = user.email.split("@")[0];
    
    // Check if user is admin
    const { data: member } = await supabase
      .from('members')
      .select('admin')
      .eq('uniqname', uniqname)
      .single();

    if (!member?.admin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { rushee_ids, cut_status } = await req.json();

    if (!rushee_ids || !Array.isArray(rushee_ids) || rushee_ids.length === 0) {
      return NextResponse.json({ error: "Missing or invalid rushee_ids" }, { status: 400 });
    }

    if (!['active', 'cut'].includes(cut_status)) {
      return NextResponse.json({ error: "Invalid cut_status. Must be 'active' or 'cut'" }, { status: 400 });
    }

    // Update cut_status for all specified rushees
    const { error: updateError } = await supabase
      .from('rushees')
      .update({ cut_status })
      .in('id', rushee_ids);

    if (updateError) {
      console.error("Error updating cut_status:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      updated_count: rushee_ids.length,
      cut_status
    });
  } catch (error) {
    console.error("Error in cut-status API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
