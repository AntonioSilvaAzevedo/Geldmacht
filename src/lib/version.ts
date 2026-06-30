/**
 * Comparador de versões semver-style ("major.minor.patch") suficiente para
 * o controle de logout obrigatório por versão.
 *
 * compareVersions("0.3.0", "0.4.0") < 0
 * compareVersions("0.10.0", "0.9.0") > 0
 * compareVersions("0.4.0", "0.4.0") === 0
 *
 * Aceita prefixo "v" e ignora segmentos não numéricos. Versões inválidas/vazias
 * são tratadas como `0.0.0`.
 */
export function compareVersions(a: string, b: string): number {
  const parse = (v: string): number[] => {
    if (!v) return [0, 0, 0];
    return v
      .replace(/^v/i, '')
      .split('.')
      .map(part => {
        const n = parseInt(part, 10);
        return Number.isNaN(n) ? 0 : n;
      });
  };
  const partsA = parse(a);
  const partsB = parse(b);
  const len = Math.max(partsA.length, partsB.length, 3);
  for (let i = 0; i < len; i++) {
    const va = partsA[i] ?? 0;
    const vb = partsB[i] ?? 0;
    if (va > vb) return 1;
    if (va < vb) return -1;
  }
  return 0;
}

/** True se `current` for menor que `min`. */
export function isVersionBelow(current: string, min: string): boolean {
  return compareVersions(current, min) < 0;
}
