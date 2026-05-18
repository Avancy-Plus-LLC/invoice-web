'use client';

import { usePDF } from '@react-pdf/renderer';
import { useMemo, useState, useEffect } from 'react';
import type { InvoiceData, TemplateId, DocType } from '@/lib/types';
import { buildFileName } from '@/lib/calculations';
import { ClassicTemplate } from './pdf-templates/ClassicTemplate';
import { EstimateTemplate } from './pdf-templates/EstimateTemplate';
import { ReceiptTemplate } from './pdf-templates/ReceiptTemplate';
import { ModernTemplate } from './pdf-templates/ModernTemplate';
import { MinimalTemplate } from './pdf-templates/MinimalTemplate';
import { ElegantTemplate } from './pdf-templates/ElegantTemplate';
import { WagyuTemplate } from './pdf-templates/WagyuTemplate';
import { OceanTemplate } from './pdf-templates/OceanTemplate';
import { NightTemplate } from './pdf-templates/NightTemplate';
import { SakuraTemplate } from './pdf-templates/SakuraTemplate';
import { AutumnTemplate } from './pdf-templates/AutumnTemplate';
import { SlateTemplate } from './pdf-templates/SlateTemplate';
import { VioletTemplate } from './pdf-templates/VioletTemplate';
import { RetroTemplate } from './pdf-templates/RetroTemplate';

type Props = {
  data: InvoiceData;
  template: TemplateId;
  docType: DocType;
  stampDataUrl: string | null;
  stampSize: number;
  onDownload?: () => void;
  clientEmail?: string;
  invoiceNumber?: string;
};

function getDocument(data: InvoiceData, template: TemplateId, docType: DocType, stampDataUrl: string | null, stampSize: number) {
  const props = { data, stampDataUrl, stampSize };
  if (docType === '見積書') return <EstimateTemplate {...props} />;
  if (docType === '領収書') return <ReceiptTemplate {...props} />;
  if (template === 'modern') return <ModernTemplate {...props} />;
  if (template === 'minimal') return <MinimalTemplate {...props} />;
  if (template === 'elegant') return <ElegantTemplate {...props} />;
  if (template === 'wagyu') return <WagyuTemplate {...props} />;
  if (template === 'ocean') return <OceanTemplate {...props} />;
  if (template === 'night') return <NightTemplate {...props} />;
  if (template === 'sakura') return <SakuraTemplate {...props} />;
  if (template === 'autumn') return <AutumnTemplate {...props} />;
  if (template === 'slate') return <SlateTemplate {...props} />;
  if (template === 'violet') return <VioletTemplate {...props} />;
  if (template === 'retro') return <RetroTemplate {...props} />;
  return <ClassicTemplate {...props} />;
}

const btnBase = 'w-full text-sm font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2';

type DriveState = 'idle' | 'saving' | 'saved' | 'error';
type EmailState = 'idle' | 'sending' | 'sent' | 'error';

export default function PDFActionsInner({ data, template, docType, stampDataUrl, stampSize, onDownload, clientEmail, invoiceNumber }: Props) {
  const doc = useMemo(
    () => getDocument(data, template, docType, stampDataUrl, stampSize),
    [data, template, docType, stampDataUrl, stampSize]
  );
  const [instance, updateInstance] = usePDF();
  useEffect(() => {
    const timer = setTimeout(() => updateInstance(doc), 300);
    return () => clearTimeout(timer);
  }, [doc]);
  const [showPreview, setShowPreview] = useState(false);
  const [driveState, setDriveState] = useState<DriveState>('idle');
  const [driveUrl, setDriveUrl] = useState<string | null>(null);
  const [emailState, setEmailState] = useState<EmailState>('idle');
  const fileName = buildFileName(data);

  async function getPdfBase64(): Promise<string> {
    const arrayBuffer = await instance.blob!.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) binary += String.fromCharCode(uint8Array[i]);
    return btoa(binary);
  }

  async function sendEmail() {
    if (!instance.blob || !clientEmail) return;
    setEmailState('sending');
    try {
      const pdfBase64 = await getPdfBase64();
      const subject = `${docType} ${invoiceNumber ?? fileName}`;
      const bodyText = `お世話になっております。\n請求書をお送りいたします。ご確認のほどよろしくお願いいたします。`;
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfBase64, fileName, to: clientEmail, subject, bodyText }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? 'Send failed');
      if (json.driveUrl) { setDriveUrl(json.driveUrl); setDriveState('saved'); }
      setEmailState('sent');
    } catch (e) {
      console.error('Email error:', e);
      setEmailState('error');
    }
  }

  async function saveToDrive() {
    if (!instance.blob) return;
    setDriveState('saving');
    try {
      const pdfBase64 = await getPdfBase64();

      const res = await fetch('/api/drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfBase64, fileName }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? 'Drive save failed');
      setDriveUrl(json.driveUrl);
      setDriveState('saved');
    } catch (e) {
      console.error('Drive save error:', e);
      setDriveState('error');
    }
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {!instance.url ? (
          <button type="button" disabled className={`${btnBase} bg-blue-300 text-white`}>
            <span className="animate-spin text-base">⟳</span> 生成中...
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className={`${btnBase} ${instance.loading ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
          >
            {instance.loading && <span className="animate-spin text-base">⟳</span>}
            {instance.loading ? '更新中...' : 'プレビューを確認'}
          </button>
        )}
      </div>

      {showPreview && instance.url && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/70" onClick={() => setShowPreview(false)}>
          <div
            className="flex items-center justify-between bg-gray-900 px-4 py-2.5 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-sm font-semibold text-white">{fileName}</span>
            <div className="flex items-center gap-3">
              <a
                href={instance.url}
                download={`${fileName}.pdf`}
                className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 transition-colors"
                onClick={(e) => { e.stopPropagation(); onDownload?.(); }}
              >
                ↓ ダウンロード
              </a>
              {driveState === 'saved' && driveUrl ? (
                <a
                  href={driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-1.5 transition-colors"
                >
                  ☁ Driveで開く
                </a>
              ) : (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); saveToDrive(); }}
                  disabled={driveState === 'saving'}
                  className="rounded-lg bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-1.5 transition-colors"
                >
                  {driveState === 'saving' ? '保存中...' : driveState === 'error' ? '⚠ 再試行' : '☁ Driveに保存'}
                </button>
              )}
              {clientEmail && (
                emailState === 'sent' ? (
                  <span className="text-green-400 text-sm font-medium px-2">✓ 送信済み</span>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); sendEmail(); }}
                    disabled={emailState === 'sending'}
                    className="rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-1.5 transition-colors"
                  >
                    {emailState === 'sending' ? '送信中...' : emailState === 'error' ? '⚠ 再試行' : `✉ メール送信`}
                  </button>
                )
              )}
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-white text-xl leading-none px-1"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <iframe src={instance.url} className="w-full h-full border-0" title="PDF プレビュー" />
          </div>
        </div>
      )}
    </>
  );
}
