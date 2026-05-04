/**
 * Ponto único de leitura de variáveis de ambiente.
 * NENHUM outro arquivo deve ler process.env.NEXT_PUBLIC_API_URL diretamente.
 *
 * Next.js carrega automaticamente:
 *   npm run dev   → .env.local       (NEXT_PUBLIC_API_URL=http://localhost:8000)
 *   npm run build → .env.production  (NEXT_PUBLIC_API_URL=https://geldmacht.com)
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

if (!API_URL && typeof window !== 'undefined') {
  console.warn(
    '[config] NEXT_PUBLIC_API_URL não definida — ' +
    'usando string vazia. Verifique .env.local',
  );
}

export const config = {
  apiUrl: API_URL,
  isDev:  process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
} as const;
