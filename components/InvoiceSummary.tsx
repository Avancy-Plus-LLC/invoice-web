'use client';

import { computeTotals } from '@/lib/calculations';
import type { InvoiceData } from '@/lib/types';

export function InvoiceSummary({ data }: { data: InvoiceData }) {
  const { subtotal, taxAmount, total } = computeTotals(data);
  const fmt = (n: number) => `¥${n.toLocaleString('ja-JP')}`;

  return (
    <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1.5">
      <div className="flex justify-between text-gray-500">
        <span>小計</span><span>{fmt(subtotal)}</span>
      </div>
      <div className="flex justify-between text-gray-500">
        <span>消費税（10%）</span><span>{fmt(taxAmount)}</span>
      </div>
      <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2 mt-2">
        <span>合計（税込）</span><span className="text-blue-600">{fmt(total)}</span>
      </div>
    </div>
  );
}
