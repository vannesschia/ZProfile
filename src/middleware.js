import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse } from 'next/server'
import { getServerClient } from './lib/supabaseServer';

export async function middleware(request) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const supabase = await getServerClient();
    const { data: { user } } = await supabase.auth.getUser()

    const uniqname = user.email.split("@")[0];

    const { data: member } = await supabase
      .from('members')
      .select('admin')
      .eq('uniqname', uniqname)
      .single()

    if (!member?.admin) {
      const url = new URL('/dashboard', request.url)
      return NextResponse.rewrite(url)
    }
  }
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
