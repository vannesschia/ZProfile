import { getServerClient } from "@/lib/supabaseServer";
import { NextResponse } from "next/server";
import { canAccessArchive } from "@/app/(with-sidebar)/archive/_lib/allowlist";

const ARCHIVE_KEY = "classes";

// GET: Return archive classes for allowlist users. Synced for everyone on the allowlist.
export async function GET() {
  try {
    const supabase = await getServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const uniqname = user.email?.split("@")[0];
    if (!canAccessArchive(uniqname)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: row, error } = await supabase
      .from("archive_store")
      .select("value")
      .eq("key", ARCHIVE_KEY)
      .maybeSingle();

    if (error) {
      console.error("Archive GET error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const classes = row?.value && typeof row.value === "object" ? row.value : {};
    return NextResponse.json({ classes });
  } catch (err) {
    console.error("Archive GET error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load archive" },
      { status: 500 }
    );
  }
}

// POST: Set archive classes (full replace). Allowlist only. Synced for everyone.
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
    if (!canAccessArchive(uniqname)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const classes = body?.classes;
    if (classes === undefined || typeof classes !== "object" || Array.isArray(classes)) {
      return NextResponse.json(
        { error: "Body must include { classes: object }" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("archive_store")
      .upsert({ key: ARCHIVE_KEY, value: classes }, { onConflict: "key" });

    if (error) {
      console.error("Archive POST error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ classes });
  } catch (err) {
    console.error("Archive POST error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to save archive" },
      { status: 500 }
    );
  }
}
