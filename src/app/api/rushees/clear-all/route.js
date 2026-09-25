import { getServerClient } from "@/lib/supabaseServer";
import { NextResponse } from "next/server";
import { canAccessArchive } from "@/app/(with-sidebar)/archive/_lib/allowlist";
import { clearRushDirectory } from "@/lib/rush-directory";

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

    const error = await clearRushDirectory(supabase);
    if (error) {
      console.error("Clear rushees error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
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
