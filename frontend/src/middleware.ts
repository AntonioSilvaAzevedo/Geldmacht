import { auth } from '@/auth';
import { NextResponse } from 'next/server';

const LEGACY_APP_PREFIXES = [
  '/carteira',
  '/cartao',
  '/categorias',
  '/configuracoes',
  '/lancamentos',
  '/upload',
  '/proventos',
  '/perfil',
  '/mes',
  '/mais',
];

function isLegacyAppPath(pathname: string) {
  return LEGACY_APP_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname, search } = req.nextUrl;

  const isAuthRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register');

  if (isLoggedIn && !pathname.startsWith('/home') && !isAuthRoute && !pathname.startsWith('/api')) {
    if (pathname === '/' || isLegacyAppPath(pathname)) {
      const target = pathname === '/' ? '/home' : `/home${pathname}`;
      return NextResponse.redirect(new URL(`${target}${search}`, req.url));
    }
  }

  if (!isLoggedIn && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL('/home', req.url));
  }
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
};
