import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request) {
  const requestUrl = new URL(request.url);
  const cookieStore = await cookies();

  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // Sign out the user.
  await supabase.auth.signOut();

  // Redirect to the home page after signing out.
  return NextResponse.redirect(`${requestUrl.origin}/`, {
    status: 302,
  });
}