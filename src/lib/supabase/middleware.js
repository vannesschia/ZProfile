import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { getServerClient } from '../supabaseServer';

export async function updateSession(request) {
  const { pathname, searchParams } = request.nextUrl;
  const method = request.method;

  // 1. Always pass through non-GET/HEAD requests without any checks.
  // This is crucial for handling POST requests to API routes.
  if (method !== 'GET' && method !== 'HEAD') {
    return NextResponse.next({ request });
  }

  // 2. Auth routes should also be left untouched to handle sign-in/out logic.
  if (pathname.startsWith('/auth') || pathname.startsWith('/error')) {
    return NextResponse.next({ request });
  }

  // From this point on, the middleware only handles GET/HEAD requests
  // and routes that are not part of the /auth path.

  const res = NextResponse.next({ request });

  const supabase = await getServerClient();

  const { data: { user } } = await supabase.auth.getUser();

  // 3. Redirect unauthenticated users to the home page.
  if (!user && pathname !== '/' && !pathname.startsWith('/auth/sign-in')) {
    const url = new URL('/', request.url);
    return NextResponse.redirect(url);
  }

  // 4. Redirect authenticated users from the home page to the dashboard.
  if (user && pathname === '/') {
    const url = new URL('/dashboard', request.url);
    return NextResponse.redirect(url);
  }

  if (user && pathname.startsWith('/admin')) {
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
  
  // Check rush directory access: pledges never; non-admins only if attended one rush event this semester
  if (user && pathname === "/rush-directory") {
    const uniqname = user.email.split("@")[0];
    const { getRushDirectoryAccess } = await import('@/app/(with-sidebar)/rush-directory/_lib/rush-access');
    const { allowed } = await getRushDirectoryAccess(supabase, uniqname);
    if (!allowed) {
      const url = new URL('/dashboard', request.url);
      return NextResponse.redirect(url);
    }
  }

  // Archive: only hardcoded allowlist (admins do not get access unless listed)
  if (user && pathname === "/archive") {
    const uniqname = user.email.split("@")[0];
    const { canAccessArchive } = await import('@/app/(with-sidebar)/archive/_lib/allowlist');
    if (!canAccessArchive(uniqname)) {
      const url = new URL('/dashboard', request.url);
      return NextResponse.redirect(url);
    }
  }

  return res;
}