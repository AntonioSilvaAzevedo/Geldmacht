/**
 * Ponto único de leitura de variáveis de ambiente.
 * NENHUM outro arquivo deve ler process.env.NEXT_PUBLIC_API_URL diretamente.
 *
 * Next.js carrega automaticamente:
 *   npm run dev   → .env.local       (NEXT_PUBLIC_API_URL=http://localhost:8000)
 *   npm run build → .env.production  (NEXT_PUBLIC_API_URL=https://geldmacht.com)
 */

import pkg from '../../package.json';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
// Versão do app vinda do package.json (build-time). Pode ser sobrescrita por
// NEXT_PUBLIC_APP_VERSION quando publicada por CI/CD.
const APP_VERSION =
  process.env.NEXT_PUBLIC_APP_VERSION ?? (pkg as { version?: string }).version ?? '0.0.0';

if (!API_URL && typeof window !== 'undefined') {
  console.warn(
    '[config] NEXT_PUBLIC_API_URL não definida — ' +
    'usando string vazia. Verifique .env.local',
  );
}

export const config = {
  apiUrl: API_URL,
  appVersion: APP_VERSION,
  isDev:  process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
} as const;
