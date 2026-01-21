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

  // Find if user has attended a rush event
  const { data: rushEventIds} = await supabase
    .from('rush_events')
    .select('id');

  let uniqname = '';
  if (user) {
    uniqname = user.email.split("@")[0];
  }

  const { data: eventsAttended } = await supabase
    .from('event_attendance')
    .select('event_id')
    .eq('uniqname', uniqname);

  const listRushEventsIds = rushEventIds.map(obj => obj.id);
  let hasAttendedRushEvent = false;

  eventsAttended.forEach(obj => {
    if (listRushEventsIds.includes(obj.event_id)) {
      hasAttendedRushEvent = true;
    }
  })

  // Redirect brothers who have not attended a rush event 
  if (user && !hasAttendedRushEvent && pathname === "/rush-directory") {
    const url = new URL('/dashboard', request.url);
    return NextResponse.redirect(url);
  }

  return res;
}