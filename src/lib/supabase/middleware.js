import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  const { pathname, searchParams } = request.nextUrl;
  const method = request.method;

  // 1. Always pass through non-GET/HEAD requests without any checks.
  // This is crucial for handling POST requests to API routes.
  if (method !== 'GET' && method !== 'HEAD') {
    return NextResponse.next({ request });
  }

  // 2. Auth routes should also be left untouched to handle sign-in/out logic.
  if (pathname.startsWith('/auth')) {
    return NextResponse.next({ request });
  }

  // From this point on, the middleware only handles GET/HEAD requests
  // and routes that are not part of the /auth path.

  const res = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // 3. Redirect unauthenticated users to the home page.
  if (!user && pathname !== '/' && pathname !== '/auth/sign-in') {
    const url = new URL('/', request.url);
    return NextResponse.redirect(url);
  }

  // 4. Redirect authenticated users from the home page to the dashboard.
  if (user && pathname === '/') {
    const url = new URL('/dashboard', request.url);
    return NextResponse.redirect(url);
  }

  if (user && pathname.startsWith('/admin')) {
    const supabase = await getServerClient();
    const uniqname = user.email.split("@")[0];
    const { data: member } = await supabase
      .from('members')
      .select('admin')
      .eq('uniqname', uniqname)
      .single()

    if (!member?.admin) {
      const url = new URL('/dashboard', request.url)
      return NextResponse.redirect(url)
    }
  }

  return res;
}