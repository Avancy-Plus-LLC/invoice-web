import type { InvoiceData, ComputedTotals } from './types';

export function computeTotals(data: InvoiceData): ComputedTotals {
  const subtotal = data.items.reduce((sum, item) => {
    return sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
  }, 0);
  const taxAmount = Math.round(subtotal * 0.1);
  const total = subtotal + taxAmount;
  return { subtotal, taxAmount, total };
}

export function formatCurrency(value: number): string {
  return value.toLocaleString('ja-JP');
}

export function formatDateJa(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export function formatPostal(postal: string): string {
  const digits = postal.replace(/[^0-9]/g, '');
  if (digits.length === 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return postal;
}

export function buildFileName(data: InvoiceData): string {
  const safe = (data.clientName || '').replace(/[\\/:*?"<>|\s]/g, '_');
  return safe ? `${data.invoiceNumber}_${safe}` : data.invoiceNumber;
}
