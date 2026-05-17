/**
 * Formata uma string de dígitos brutos como moeda BRL (modelo cents-based).
 * "0"      → "0,00"
 * "5"      → "0,05"
 * "500"    → "5,00"
 * "123456" → "1.234,56"
 *
 * Use em conjunto com AmountInput: o estado armazena apenas dígitos,
 * o componente exibe o valor formatado.
 */
export function formatCurrencyInput(digits: string): string {
  if (!digits) return '';
  const num = parseInt(digits, 10);
  if (isNaN(num)) return '';
  return (num / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Converte string de dígitos brutos para float BRL.
 * "123456" → 1234.56
 */
export function parseCurrencyDigits(digits: string): number {
  if (!digits) return 0;
  const num = parseInt(digits, 10);
  return isNaN(num) ? 0 : num / 100;
}

export function formatCurrency(value: number, compact = false): string {
  if (compact && Math.abs(value) >= 1000) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

export function classifyValue(value: number) {
  if (value > 0) return 'value-positive';
  if (value < 0) return 'value-negative';
  return 'value-neutral';
}
