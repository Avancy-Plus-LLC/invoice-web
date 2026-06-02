'use client';

import dynamic from 'next/dynamic';
import type { InvoiceData, TemplateId, DocType } from '@/lib/types';

const PDFActionsInner = dynamic(() => import('./PDFActionsInner'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col gap-2">
      <button type="button" disabled className="w-full bg-blue-300 text-white text-sm font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2">
        <span className="animate-spin text-base">⟳</span> 生成中...
      </button>
      <button type="button" disabled className="w-full bg-white opacity-50 border border-gray-300 text-gray-700 text-sm font-medium py-2.5 px-4 rounded-lg flex items-center justify-center">
        ☁ Google Driveに保存
      </button>
    </div>
  ),
});

type Props = {
  data: InvoiceData;
  template: TemplateId;
  docType: DocType;
  stampDataUrl: string | null;
  stampSize: number;
  onDownload?: () => void;
  isLoggedIn?: boolean;
};

export function PDFActions({ data, template, docType, stampDataUrl, stampSize, onDownload, isLoggedIn }: Props) {
  return <PDFActionsInner data={data} template={template} docType={docType} stampDataUrl={stampDataUrl} stampSize={stampSize} onDownload={onDownload} clientEmail={data.clientEmail} invoiceNumber={data.invoiceNumber} isLoggedIn={isLoggedIn} />;
}
