import type { InvoiceData, ComputedTotals } from './types';

export function computeTotals(data: InvoiceData): ComputedTotals {
  const subtotal = data.items.reduce((sum, item) => {
    return sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
  }, 0);
  if (data.taxType === 'inclusive' || data.taxType === 'exempt') {
    const taxAmount = Math.round(subtotal / 11);
    return { subtotal, taxAmount, total: subtotal };
  }
  const taxAmount = Math.round(subtotal * 0.1);
  return { subtotal, taxAmount, total: subtotal + taxAmount };
}

export function taxLabel(taxType: InvoiceData['taxType']): string {
  if (taxType === 'inclusive') return 'うち消費税（10%）';
  if (taxType === 'exempt') return '消費税相当額（10%）';
  return '消費税（10%）';
}

export function subtotalLabel(taxType: InvoiceData['taxType']): string {
  return (taxType === 'inclusive' || taxType === 'exempt') ? '小計（税込）' : '小計';
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
