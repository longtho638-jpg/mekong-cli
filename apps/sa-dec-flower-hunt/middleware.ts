import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh Session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Protect Admin Routes (Except IPO and Leadership which have mixed access or dev testing)
  if (request.nextUrl.pathname.startsWith('/admin') &&
    !request.nextUrl.pathname.startsWith('/admin/ipo') &&
    !request.nextUrl.pathname.startsWith('/admin/leadership')) {
    if (!user) {
      // If not logged in, redirect to home or login
      // We can also redirect to a dedicated /login page if it exists
      return NextResponse.redirect(new URL('/', request.url));
    }
    // Note: Role check ('admin') is better done in Layout/Page for UX (showing 403),
    // or here if we want to be strict. For now, strict Auth is a good baseline.
  }

  // 2. Protect Farmer Routes
  if (request.nextUrl.pathname.startsWith('/farmer')) {
    if (!user) {
        return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
