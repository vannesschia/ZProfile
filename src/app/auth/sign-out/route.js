import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const BASE_URL = process.env.PUBLIC_SITE_URL;

function safeNext(next) {
  let path = next || "/";
  if (!path.startsWith("/")) path = "/";
  return new URL(path, BASE_URL).toString();
}

function sameOrigin(req) {
  const base = new URL(BASE_URL).origin;
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  try {
    if (origin && new URL(origin).origin === base) return true;
    if (referer && new URL(referer).origin === base) return true;
  } catch {}
  return false;
}

export async function POST(request) {
  if (!sameOrigin(request)) {
    return NextResponse.redirect(new URL("/", BASE_URL));
  }

  const url = new URL(request.url);
  const nextUrl = safeNext(url.searchParams.get("next"));
  const scopeParam = (url.searchParams.get("scope") || "local").toLowerCase();
  const scope = scopeParam === "global" || scopeParam === "others" ? scopeParam : "local";

  const res = NextResponse.redirect(nextUrl, { status: 303 });

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  await supabase.auth.signOut({ scope }).catch(() => {});

  return res; // includes cleared cookies
}
