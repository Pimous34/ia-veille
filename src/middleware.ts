import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Check for environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Middleware: Supabase environment variables are missing. Skipping auth check.');
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && !request.nextUrl.pathname.startsWith('/auth')) {
    // Redirect to login page if not logged in
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    return NextResponse.redirect(url)
  }

  // AUTHORIZATION CHECK
  // check if user is allowed (must be in 'students' or 'admins' table)
  // Skip this check on /auth pages to avoid infinite redirects if the user is logged in but unauthorized
  if (user && user.email && !request.nextUrl.pathname.startsWith('/auth')) {
    // Check 'students' table
    const { count: studentCount } = await supabase
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('email', user.email);

    // Check 'admins' table
    const { count: adminCount } = await supabase
      .from('admins')
      .select('id', { count: 'exact', head: true })
      .eq('email', user.email);

    const isAllowed = (studentCount && studentCount > 0) || (adminCount && adminCount > 0);

    if (!isAllowed) {
      console.warn(`Unauthorized access attempt by ${user.email}`);
      // Force signout (optional but safer to clear session)
      await supabase.auth.signOut();
      
      const url = request.nextUrl.clone()
      url.pathname = '/auth'
      url.searchParams.set('error', 'unauthorized')
      return NextResponse.redirect(url)
    }

    // ADMIN ROUTE PROTECTION
    // Only allow users in 'admins' table to access /admin routes
    if (request.nextUrl.pathname.startsWith('/admin')) {
      const isAdmin = adminCount && adminCount > 0;
      if (!isAdmin) {
        console.warn(`Non-admin user ${user.email} attempted to access admin area`);
        const url = request.nextUrl.clone();
        url.pathname = '/'; // Redirect to home page
        return NextResponse.redirect(url);
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
