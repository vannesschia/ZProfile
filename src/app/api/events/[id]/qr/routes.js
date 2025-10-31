import { getServerClient } from "@/lib/supabaseServer";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const id = params.id;
  const supabase = await getServerClient();
  const { data, error } = await supabase
    .from("event_qr_tokens")
    .select("token, created_at, expires_at")
    .eq("event_id", id)
    .limit(1)
    .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ token: data?.token, created_at: data?.created_at, expires_at: data?.expires_at }, { status: 200 });
}

export async function POST(req, { params }) {
  const id = params.id;
  const supabase = await getServerClient();
  const { data: active, error } = await supabase
    .from("event_qr_tokens")
    .select("token")
    .eq("event_id", id)
    .limit(1)
    .maybeSingle();
  if (active?.token) {
    return NextResponse.json({ token: active.token }, { status: 200 });
  }

  const token = crypto.randomBytes(24).toString("base64url");
  const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours from now

  const { error: insertError } = await supabase
    .from("event_qr_tokens")
    .insert({ event_id: id, token, expires_at });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  return NextResponse.json({ token }, { status: 201 });
}