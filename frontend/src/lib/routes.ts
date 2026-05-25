/** Prefixo das rotas autenticadas da aplicação. */
export const APP_BASE = '/home';

/** Monta path dentro do app (ex.: appRoute('/carteira') → '/home/carteira'). */
export function appRoute(path = ''): string {
  if (!path || path === '/') return APP_BASE;
  return `${APP_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}
