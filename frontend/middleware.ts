import { NextRequest, NextResponse } from 'next/server';

const locales = ['en', 'vi', 'zh'];
const defaultLocale = 'vi';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if pathname starts with a locale
    const pathnameHasLocale = locales.some(
        (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    if (pathnameHasLocale) {
        return NextResponse.next();
    }

    // Redirect to default locale for root path
    if (pathname === '/') {
        return NextResponse.redirect(new URL(`/${defaultLocale}`, request.url));
    }

    // For other paths, add default locale prefix
    return NextResponse.redirect(new URL(`/${defaultLocale}${pathname}`, request.url));
}

export const config = {
    matcher: [
        // Match all pathnames except:
        // - api routes
        // - _next (Next.js internals)
        // - static files
        '/((?!api|_next|.*\\..*).*)'
    ]
};
