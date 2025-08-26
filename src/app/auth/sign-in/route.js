// app/callback/route.js
import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabaseServer";

const BASE_URL = process.env.PUBLIC_SITE_URL ?? "https://www.zprofile.tech";
console.log("BASE_URL", BASE_URL);
const REQUIRED_DOMAIN = "umich.edu";

function safeRedirect(next) {
  let path = next || "/dashboard";
  if (!path.startsWith("/")) path = "/dashboard";
  return new URL(path, BASE_URL).toString();
}

function redirectToLogin(message = "") {
  const url = new URL("/", BASE_URL);
  if (message) url.searchParams.set("error", message);
  // Add a 'reauth=1' hint if you want to tweak login UX
  url.searchParams.set("reauth", "1");
  return url;
}

export async function GET(request) {
  const supabase = await getServerClient();
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const oauthErr = url.searchParams.get("error");
  const next = url.searchParams.get("next");

  if (oauthErr || !code) {
    // No need to signOut: no session was set
    return NextResponse.redirect(new URL("/auth/auth-code-error", BASE_URL));
  }

  // 1) Exchange code → session cookies
  const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeErr) {
    return NextResponse.redirect(new URL("/auth/auth-code-error", BASE_URL));
  }

  // 2) Get user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    // Session exists but unusable → sign out defensively
    await supabase.auth.signOut({ scope: "local" });
    return NextResponse.redirect(redirectToLogin("no-email"));
  }

  // 3) Verify domain
  const email = user.email.toLowerCase();
  const [localPart, domain] = email.split("@");
  const emailVerified = user.user_metadata?.email_verified === true;

  if (!emailVerified || domain !== REQUIRED_DOMAIN) {
    await supabase.auth.signOut({ scope: "local" });
    return NextResponse.redirect(redirectToLogin("bad-domain"));
  }

  const uniqname = localPart.toLowerCase();

  // 4) Fetch pre-provisioned row
  const { data: member, error: readErr } = await supabase
    .from("members")
    .select("email_address, user_id, onboarding_completed")
    .eq("uniqname", uniqname)
    .maybeSingle();

  if (readErr) {
    console.error("Member read error");
    return NextResponse.redirect(new URL("/auth/auth-code-error", BASE_URL));
  }

  // Not invited
  if (!member) {
    return NextResponse.redirect(new URL("/auth/not-invited", BASE_URL));
  }

  // If email was pre-populated, it must match; if it was NULL, allow first bind to set it
  const storedEmail = (member.email_address ?? "").toLowerCase();
  if (storedEmail && storedEmail !== email) {
    // Email mismatch against roster
    return NextResponse.redirect(new URL("/auth/auth-code-error", BASE_URL));
  }

  // 5) First login bind:
  //    - If user_id is NULL, bind this auth user
  //    - Also fill email if it was NULL (handles legacy rows)
  if (member.user_id == null) {
    const { data: bound, error: bindErr } = await supabase
      .from("members")
      .update({
        user_id: user.id,
        email_address: storedEmail || email, // only sets email if it wasn't set
      })
      .eq("uniqname", uniqname)
      .is("user_id", null) // atomic guard
      .select("onboarding_completed, email_address, user_id")
      .maybeSingle();

    if (bindErr || !bound) {
      // Another session may have claimed it, or a race/error occurred
      return NextResponse.redirect(new URL("/auth/auth-code-error", BASE_URL));
    }

    // Newly bound: send to setup (you can choose to send to `next` if already completed)
    if (bound.onboarding_completed) {
      return NextResponse.redirect(safeRedirect(next));
    }
    return NextResponse.redirect(new URL("/profile/setup", BASE_URL));
  }

  // 6) Returning user: ensure this auth user owns the row
  if (member.user_id !== user.id) {
    // Row already bound to a different auth user -> block
    return NextResponse.redirect(new URL("/auth/auth-code-error", BASE_URL));
  }

  // Route based on onboarding
  if (member.onboarding_completed) {
    return NextResponse.redirect(safeRedirect(next));
  }
  return NextResponse.redirect(new URL("/profile/setup", BASE_URL));
}
