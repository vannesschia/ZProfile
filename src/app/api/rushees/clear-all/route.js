import { getServerClient } from "@/lib/supabaseServer";
import { NextResponse } from "next/server";
import { canAccessArchive } from "@/app/(with-sidebar)/archive/_lib/allowlist";

// POST: Clear all rushees and related data. Allowed for admins or archive allowlist.
export async function POST(req) {
  try {
    const supabase = await getServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const uniqname = user.email?.split("@")[0];
    const { data: member } = await supabase
      .from("members")
      .select("admin")
      .eq("uniqname", uniqname)
      .single();

    const isAdmin = member?.admin === true;
    if (!isAdmin && !canAccessArchive(uniqname)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: rushees, error: fetchError } = await supabase
      .from("rushees")
      .select("id");

    if (fetchError) {
      console.error("Error fetching rushees:", fetchError);
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      );
    }

    const rusheeIds = (rushees || []).map((r) => r.id);

    if (rusheeIds.length > 0) {
      await supabase.from("rushee_reactions").delete().in("rushee_id", rusheeIds);
      await supabase.from("rushee_stars").delete().in("rushee_id", rusheeIds);
      await supabase.from("rushee_comments").delete().in("rushee_id", rusheeIds);
      await supabase.from("rushee_notes").delete().in("rushee_id", rusheeIds);
    }

    const { error: delErr } = await supabase.from("rushees").delete().gte("id", 0);
    if (delErr && rusheeIds.length > 0) {
      const { error: delErr2 } = await supabase
        .from("rushees")
        .delete()
        .in("id", rusheeIds);
      if (delErr2) {
        console.error("rushees delete:", delErr2);
        return NextResponse.json(
          { error: delErr2.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Clear rushees error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to clear rush directory" },
      { status: 500 }
    );
  }
}
