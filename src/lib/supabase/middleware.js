import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { getServerClient } from '../supabaseServer'

export async function updateSession(request) {
  const { pathname } = request.nextUrl
  const method = request.method

  // 1) Never meddle with auth endpoints (sign-in/out, callback, etc.)
  if (pathname.startsWith('/auth')) {
    return NextResponse.next({ request })
  }

  // 2) Only do redirects on navigations; don't 307 POST/PUT/DELETE
  if (method !== 'GET' && method !== 'HEAD') {
    return NextResponse.next({ request })
  }

  let res = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // keep Next in sync by writing to the response
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // 3) Gate protected pages
  if (!user && pathname !== '/' && pathname !== '/auth/sign-in') {
    const url = new URL('/', request.url)
    return NextResponse.redirect(url) // 307 is fine here (GET)
  }

  // 4) Home → Dashboard only for GET when logged in
  if (user && pathname === '/') {
    const url = new URL('/dashboard', request.url)
    return NextResponse.redirect(url)
  }

  // 5) Admin guard (only if logged in)
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

  return res
}
