// app/auth/sign-out/route.js
import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabaseServer";

// Set in env: dev -> http://localhost:3000, prod -> https://your.domain
const BASE_URL = process.env.PUBLIC_SITE_URL ?? "http://localhost:3000";

function safeNext(next) {
  let path = next || "/login";
  if (!path.startsWith("/")) path = "/login";
  return new URL(path, BASE_URL).toString();
}

function isSameOrigin(request) {
  // Basic CSRF guard: ensure Origin/Referer matches our BASE_URL
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  try {
    if (origin && new URL(origin).origin === new URL(BASE_URL).origin) return true;
    if (referer && new URL(referer).origin === new URL(BASE_URL).origin) return true;
  } catch {}
  return false;
}

export async function POST(request) {
  if (!isSameOrigin(request)) {
    return NextResponse.redirect(new URL("/login", BASE_URL));
  }

  const { searchParams } = new URL(request.url);
  const next = safeNext(searchParams.get("next"));
  const scopeParam = (searchParams.get("scope") || "local").toLowerCase();
  const scope =
    scopeParam === "others" || scopeParam === "global" ? scopeParam : "local";

  const supabase = await getServerClient();

  // Optional: audit logging before sign-out
  // const { data: { user } } = await supabase.auth.getUser();
  // await supabase.from("auth_signout_events").insert({
  //   user_id: user?.id ?? null,
  //   ip: request.headers.get("x-forwarded-for") ?? null,
  //   user_agent: request.headers.get("user-agent") ?? null,
  //   scope,
  // });

  // Clears auth cookies; "global" revokes all sessions
  await supabase.auth.signOut({ scope });

  return NextResponse.redirect(next, { status: 303 });
}
