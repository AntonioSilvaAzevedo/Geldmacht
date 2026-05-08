/**
 * Controle client-side de "versão da sessão autenticada".
 *
 * Estratégia (Opção B do prompt): após cada login bem-sucedido, gravamos em
 * `localStorage` a versão atual do app. Quando uma nova versão exigir relogin,
 * basta o build expor `NEXT_PUBLIC_MIN_AUTH_VERSION = nova_versao` — a próxima
 * sessão restaurada será detectada como abaixo do mínimo e forçada a relogar.
 *
 * Este mecanismo é puramente client-side. Para uma versão futura, podemos
 * mover a regra para o backend (assinar a versão no JWT e rejeitar tokens
 * abaixo do mínimo).
 */
import { config } from '@/config/env';
import { isVersionBelow } from './version';

const STORAGE_KEY = 'geldmacht_auth_version';

/** Lê a versão da sessão registrada no localStorage. Null se ausente. */
export function getStoredAuthVersion(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Grava a versão atual do app como sessão autenticada. */
export function markAuthVersionCurrent(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, config.appVersion);
  } catch {
    // localStorage indisponível (Safari privado, etc.) — ignora silenciosamente.
  }
}

/** Limpa o registro local. Usado ao forçar logout. */
export function clearStoredAuthVersion(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Decide se a sessão atual precisa ser invalidada.
 *
 * Retorna true quando:
 *   - `minAuthVersion` está configurado (não vazio); E
 *   - existe valor armazenado de versão da sessão; E
 *   - esse valor é estritamente menor que `minAuthVersion`.
 *
 * Importante: quando o storage está vazio (primeiro login pós-deploy), NÃO
 * forçamos logout — o usuário acabou de logar e marcaremos a versão atual.
 * Isso evita loops após login.
 */
export function shouldForceRelogin(): boolean {
  const min = config.minAuthVersion;
  if (!min) return false;
  const stored = getStoredAuthVersion();
  if (!stored) return false; // primeiro login após deploy — não forçar
  return isVersionBelow(stored, min);
}
