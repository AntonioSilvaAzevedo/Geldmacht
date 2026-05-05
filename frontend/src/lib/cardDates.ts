export function getOpeningDay(closingDay: number) {
  return closingDay >= 31 ? 1 : closingDay + 1;
}

export function formatReferenceMonth(value: string) {
  const labels: Record<string, string> = {
    '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
    '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
    '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro',
  };
  const [year, month] = value.split('-');
  return `${labels[month] ?? month}/${year}`;
}

export function getInvoiceCycle(referenceMonth: string, closingDay: number, dueDay: number) {
  const [year, month] = referenceMonth.split('-').map(Number);
  const closing = new Date(Date.UTC(year, month - 1, Math.min(closingDay, 28)));
  const opening = new Date(Date.UTC(year, month - 2, Math.min(getOpeningDay(closingDay), 28)));
  const due = new Date(Date.UTC(year, month, Math.min(dueDay, 28)));
  return {
    opening: opening.toISOString().slice(0, 10),
    closing: closing.toISOString().slice(0, 10),
    due: due.toISOString().slice(0, 10),
  };
}
