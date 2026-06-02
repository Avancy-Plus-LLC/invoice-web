'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useSession, signIn, signOut } from 'next-auth/react';
import { InvoiceForm } from '@/components/InvoiceForm';
import { TemplateSelector } from '@/components/TemplateSelector';
import { InvoiceSummary } from '@/components/InvoiceSummary';
import { PDFActions } from '@/components/PDFActions';
import type { InvoiceData, InvoiceItem, TemplateId, DocType, SavedIssuer } from '@/lib/types';
import { computeTotals } from '@/lib/calculations';

const today = new Date().toISOString().slice(0, 10);
const due = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

const DOC_PREFIX: Record<string, string> = { '見積書': 'QT', '請求書': 'INV', '領収書': 'RCPT' };

const DEFAULT_NOTES: Record<string, string> = {
  '請求書': 'いつもお世話になっております。\n大変恐れ入りますが振込手数料はご負担頂きますようお願いいたします。',
  '見積書': 'いつもお世話になっております。何卒ご検討のほどよろしくお願いいたします。\nご不明点等ございましたらお気軽にお問い合わせください。',
  '領収書': 'この度はお支払いいただき誠にありがとうございました。\n確かに領収いたしました。今後ともよろしくお願いいたします。',
};

function switchDocPrefix(current: string, newType: string): string {
  const prefix = DOC_PREFIX[newType] ?? 'INV';
  const stripped = current.replace(/^(QT|INV|RCPT)-/, '');
  return `${prefix}-${stripped}`;
}

const DEFAULT_VALUES: InvoiceData = {
  invoiceNumber: `INV-${new Date().getFullYear()}-0001`,
  issueDate: today,
  dueDate: due,
  subject: '',
  clientName: '',
  clientPostal: '',
  clientAddress: '',
  clientDept: '',
  clientContact: '',
  clientTel: '',
  clientEmail: '',
  issuerName: '',
  issuerPostal: '',
  issuerAddress: '',
  issuerTel: '',
  issuerEmail: '',
  issuerInvoiceNumber: '',
  items: [{ description: '', quantity: 1, unit: '式', unitPrice: 0, amount: 0 }],
  notes: DEFAULT_NOTES['請求書'],
  bankName: '',
  bankBranch: '',
  accountType: '普通',
  accountNumber: '',
  accountHolder: '',
};

type SavedClient = {
  clientName: string;
  clientPostal: string;
  clientAddress: string;
  clientDept: string;
  clientContact: string;
  clientTel: string;
  clientEmail: string;
};

export default function Home() {
  const { data: session, status } = useSession();
  const [template, setTemplate] = useState<TemplateId>('classic');
  const [docType, setDocType] = useState<DocType>('請求書');
  const [pdfData, setPdfData] = useState<InvoiceData | null>(null);
  const [pdfDocType, setPdfDocType] = useState<DocType>('請求書');
  const [pdfTemplate, setPdfTemplate] = useState<TemplateId>('classic');
  const [stampDataUrl, setStampDataUrl] = useState<string | null>(null);
  const [stampSize, setStampSize] = useState(45);

  useEffect(() => {
    const saved = localStorage.getItem('stamp_data_url');
    const savedSize = localStorage.getItem('stamp_size');
    if (saved) setStampDataUrl(saved);
    if (savedSize) setStampSize(Number(savedSize));
  }, []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [savedIssuers, setSavedIssuers] = useState<SavedIssuer[]>([]);
  const [savedClients, setSavedClients] = useState<SavedClient[]>([]);
  const [notesTemplates, setNotesTemplates] = useState<Record<string, string>>(DEFAULT_NOTES);
  const [itemTemplates, setItemTemplates] = useState<Record<string, InvoiceItem[]>>({});
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [sheetMsg, setSheetMsg] = useState('');
  const [savingIssuer, setSavingIssuer] = useState(false);
  const [savingIssuerNew, setSavingIssuerNew] = useState(false);
  const [savingClient, setSavingClient] = useState(false);
  const [savingNotesTemplate, setSavingNotesTemplate] = useState(false);
  const [savingItemTemplate, setSavingItemTemplate] = useState(false);

  const form = useForm<InvoiceData>({ defaultValues: DEFAULT_VALUES, mode: 'onChange' });
  const data = form.watch();

  const loadFromSheets = useCallback(async () => {
    setSheetMsg('読み込み中...');
    try {
      const res = await fetch('/api/sheets');
      if (!res.ok) throw new Error();
      const json = await res.json();
      if (json.issuer) {
        const fields = ['issuerName','issuerPostal','issuerAddress','issuerTel','issuerEmail','issuerInvoiceNumber','bankName','bankBranch','accountType','accountNumber','accountHolder'] as const;
        fields.forEach((f) => form.setValue(f, json.issuer[f] ?? ''));
        if (json.issuer.webhookUrl) setWebhookUrl(json.issuer.webhookUrl);
      }
      setSavedIssuers(json.issuers ?? []);
      setSavedClients(json.clients ?? []);
      if (json.notesTemplates && Object.keys(json.notesTemplates).length > 0) {
        setNotesTemplates((prev) => ({ ...prev, ...json.notesTemplates }));
      }
      if (json.itemTemplates) setItemTemplates(json.itemTemplates);
      setSheetMsg('');
    } catch {
      setSheetMsg('読み込みエラー');
    }
  }, [form]);

  useEffect(() => {
    if (status === 'authenticated') loadFromSheets();
  }, [status, loadFromSheets]);

  const saveIssuer = async () => {
    setSavingIssuer(true);
    setSheetMsg('');
    try {
      const vals = form.getValues();
      const res = await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveIssuer',
          data: {
            issuerName: vals.issuerName,
            issuerPostal: vals.issuerPostal,
            issuerAddress: vals.issuerAddress,
            issuerTel: vals.issuerTel,
            issuerEmail: vals.issuerEmail,
            issuerInvoiceNumber: vals.issuerInvoiceNumber,
            bankName: vals.bankName,
            bankBranch: vals.bankBranch,
            accountType: vals.accountType,
            accountNumber: vals.accountNumber,
            accountHolder: vals.accountHolder,
            webhookUrl,
          },
        }),
      });
      if (!res.ok) throw new Error();
      setSheetMsg('自社情報を保存しました');
    } catch {
      setSheetMsg('保存エラー');
    } finally {
      setSavingIssuer(false);
    }
  };

  const selectIssuer = (issuer: SavedIssuer) => {
    form.setValue('issuerName', issuer.issuerName);
    form.setValue('issuerPostal', issuer.issuerPostal);
    form.setValue('issuerAddress', issuer.issuerAddress);
    form.setValue('issuerTel', issuer.issuerTel);
    form.setValue('issuerEmail', issuer.issuerEmail);
    form.setValue('issuerInvoiceNumber', issuer.issuerInvoiceNumber);
    if (issuer.bankName) {
      form.setValue('bankName', issuer.bankName);
      form.setValue('bankBranch', issuer.bankBranch);
      form.setValue('accountType', issuer.accountType);
      form.setValue('accountNumber', issuer.accountNumber);
      form.setValue('accountHolder', issuer.accountHolder);
    }
  };

  const saveIssuerNew = async () => {
    setSavingIssuerNew(true);
    setSheetMsg('');
    try {
      const vals = form.getValues();
      const issuerData: SavedIssuer = {
        issuerName: vals.issuerName,
        issuerPostal: vals.issuerPostal,
        issuerAddress: vals.issuerAddress,
        issuerTel: vals.issuerTel,
        issuerEmail: vals.issuerEmail,
        issuerInvoiceNumber: vals.issuerInvoiceNumber,
        bankName: vals.bankName,
        bankBranch: vals.bankBranch,
        accountType: vals.accountType,
        accountNumber: vals.accountNumber,
        accountHolder: vals.accountHolder,
      };
      const res = await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveIssuerNew', data: issuerData }),
      });
      if (!res.ok) throw new Error();
      setSavedIssuers((prev) => [...prev, issuerData]);
      setSheetMsg('発行者を保存しました');
    } catch {
      setSheetMsg('保存エラー');
    } finally {
      setSavingIssuerNew(false);
    }
  };

  const saveClient = async () => {
    setSavingClient(true);
    setSheetMsg('');
    try {
      const vals = form.getValues();
      const clientData = {
        clientName: vals.clientName,
        clientPostal: vals.clientPostal,
        clientAddress: vals.clientAddress,
        clientDept: vals.clientDept,
        clientContact: vals.clientContact,
        clientTel: vals.clientTel,
        clientEmail: vals.clientEmail,
      };
      const res = await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveClient', data: clientData }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? '保存エラー');
      setSavedClients((prev) => [...prev, clientData]);
      setSheetMsg('取引先を保存しました');
    } catch (e) {
      setSheetMsg(e instanceof Error ? e.message : '保存エラー');
    } finally {
      setSavingClient(false);
    }
  };

  const applyNotesTemplate = () => {
    const template = notesTemplates[docType];
    if (template !== undefined) form.setValue('notes', template);
  };

  const saveNotesTemplate = async () => {
    setSavingNotesTemplate(true);
    const notes = form.getValues('notes');
    setNotesTemplates((prev) => ({ ...prev, [docType]: notes }));
    try {
      await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveNotesTemplate', data: { docType, notes } }),
      });
      setSheetMsg('備考マスタを更新しました');
      setTimeout(() => setSheetMsg(''), 2000);
    } catch {
      setSheetMsg('保存エラー');
    } finally {
      setSavingNotesTemplate(false);
    }
  };

  const saveItemTemplate = async () => {
    setSavingItemTemplate(true);
    setSheetMsg('');
    try {
      const vals = form.getValues();
      const clientName = vals.clientName;
      if (!clientName) throw new Error('取引先名を入力してください');
      const res = await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveItemTemplate', data: { clientName, items: vals.items } }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? '保存エラー');
      setItemTemplates((prev) => ({ ...prev, [clientName]: vals.items }));
      setSheetMsg('品目を保存しました');
      setTimeout(() => setSheetMsg(''), 2000);
    } catch (e) {
      setSheetMsg(e instanceof Error ? e.message : '保存エラー');
    } finally {
      setSavingItemTemplate(false);
    }
  };

  const selectClient = (client: SavedClient) => {
    form.setValue('clientName', client.clientName);
    form.setValue('clientPostal', client.clientPostal);
    form.setValue('clientAddress', client.clientAddress);
    form.setValue('clientDept', client.clientDept);
    form.setValue('clientContact', client.clientContact);
    form.setValue('clientTel', client.clientTel ?? '');
    form.setValue('clientEmail', client.clientEmail ?? '');
    const savedItems = itemTemplates[client.clientName];
    if (savedItems && savedItems.length > 0) form.setValue('items', savedItems);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPdfData({ ...form.getValues() });
    setPdfDocType(docType);
    setPdfTemplate(template);
  };

  const handleDownload = useCallback(() => {
    const vals = form.getValues();
    const current = vals.invoiceNumber;
    const match = current.match(/^(.*?)(\d+)$/);
    if (match) {
      const [, prefix, num] = match;
      form.setValue('invoiceNumber', prefix + String(Number(num) + 1).padStart(num.length, '0'));
    }
    if (webhookUrl) {
      const { total } = computeTotals(vals);
      fetch('/api/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceDate: vals.issueDate.replace(/-/g, '/'),
          invoiceNo: vals.invoiceNumber,
          clientName: vals.clientName,
          total,
          secret: webhookSecret,
        }),
      }).catch(() => {});
    }
  }, [form, webhookUrl, webhookSecret]);

  function handleStampUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setStampDataUrl(url);
      localStorage.setItem('stamp_data_url', url);
    };
    reader.readAsDataURL(file);
  }

  function handleStampSizeChange(size: number) {
    setStampSize(size);
    localStorage.setItem('stamp_size', String(size));
  }

  function handleStampRemove() {
    setStampDataUrl(null);
    localStorage.removeItem('stamp_data_url');
  }

  const isLoggedIn = status === 'authenticated';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-base font-bold text-gray-900">請求書PDF生成</h1>
          <div className="flex items-center gap-3">
            {sheetMsg && <span className="text-xs text-blue-600">{sheetMsg}</span>}
            <span className="text-xs text-gray-400">消費税10%（インボイス対応）</span>
            {status === 'loading' ? null : isLoggedIn ? (
              <div className="flex items-center gap-2">
                {session.user?.image && (
                  <img src={session.user.image} alt="" className="w-7 h-7 rounded-full" />
                )}
                <span className="text-xs text-gray-600 hidden sm:block">{session.user?.name}</span>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="text-xs text-gray-500 hover:text-gray-700 border border-gray-300 rounded px-2 py-1"
                >
                  ログアウト
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => signIn('google')}
                className="text-xs bg-white border border-gray-300 rounded px-3 py-1.5 text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Googleでログイン
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <form onSubmit={onSubmit}>
          <div className="grid grid-cols-3 gap-6">
            {/* 左: フォーム */}
            <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <InvoiceForm
                form={form}
                isLoggedIn={isLoggedIn}
                savedIssuers={savedIssuers}
                onSelectIssuer={selectIssuer}
                onSaveIssuerNew={saveIssuerNew}
                savingIssuerNew={savingIssuerNew}
                savedClients={savedClients}
                onSelectClient={selectClient}
                onSaveClient={saveClient}
                savingClient={savingClient}
                onSaveIssuer={saveIssuer}
                savingIssuer={savingIssuer}

                notesTemplate={notesTemplates[docType]}
                onApplyNotesTemplate={applyNotesTemplate}
                onSaveNotesTemplate={saveNotesTemplate}
                savingNotesTemplate={savingNotesTemplate}
                onSaveItemTemplate={saveItemTemplate}
                savingItemTemplate={savingItemTemplate}
              />
            </div>

            {/* 右: テンプレート・金額・アクション */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">書類の種類</h2>
                <div className="flex gap-1">
                  {(['見積書', '請求書', '領収書'] as DocType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setDocType(t);
                        setPdfData(null);
                        const vals = form.getValues();
                        form.setValue('invoiceNumber', switchDocPrefix(vals.invoiceNumber, t));
                        // いずれかのマスタと一致する場合のみ自動切替（カスタム入力は維持）
                        const allMasterNotes = Object.values(notesTemplates);
                        const isDefault = allMasterNotes.includes(vals.notes) || Object.values(DEFAULT_NOTES).includes(vals.notes);
                        if (isDefault) form.setValue('notes', notesTemplates[t] ?? DEFAULT_NOTES[t] ?? '');
                      }}
                      className={`flex-1 text-xs font-medium py-1.5 rounded border transition-colors ${docType === t ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {docType === '請求書' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <TemplateSelector selected={template} onChange={(t) => { setTemplate(t); setPdfData(null); }} />
              </div>
              )}

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">金額</h2>
                <InvoiceSummary data={data} />
              </div>

              {/* 電子印鑑 */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">電子印鑑</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {stampDataUrl ? (
                      <img src={stampDataUrl} alt="印鑑" style={{ width: stampSize, height: stampSize, objectFit: 'contain' }} className="rounded border border-gray-200" />
                    ) : (
                      <div className="w-16 h-16 rounded border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs">印鑑</div>
                    )}
                    <div className="flex-1 space-y-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 hover:bg-gray-50 text-gray-700"
                      >
                        {stampDataUrl ? '画像を変更' : '画像をアップロード'}
                      </button>
                      {stampDataUrl && (
                        <button
                          type="button"
                          onClick={handleStampRemove}
                          className="w-full text-xs border border-red-200 rounded px-2 py-1.5 hover:bg-red-50 text-red-500"
                        >
                          削除
                        </button>
                      )}
                    </div>
                  </div>
                  {stampDataUrl && (
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">サイズ: {stampSize}pt</label>
                      <input
                        type="range"
                        min={30}
                        max={120}
                        value={stampSize}
                        onChange={(e) => handleStampSizeChange(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleStampUpload} />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
                <button
                  type="submit"
                  className="w-full bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors"
                >
                  PDFを生成
                </button>

                {pdfData && (
                  <PDFActions
                    data={pdfData}
                    template={pdfTemplate}
                    docType={pdfDocType}
                    stampDataUrl={stampDataUrl}
                    stampSize={stampSize}
                    onDownload={handleDownload}
                    isLoggedIn={isLoggedIn}
                  />
                )}

                {!pdfData && (
                  <p className="text-xs text-gray-400 text-center">
                    「PDFを生成」後にプレビューできます
                  </p>
                )}
              </div>

              {isLoggedIn && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-2">
                  <h2 className="text-sm font-semibold text-gray-700">外部連携（Webhook）</h2>
                  <p className="text-xs text-gray-400">ダウンロード時に請求データを外部システムへ送信します</p>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://script.google.com/..."
                    className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                  <input
                    type="password"
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    placeholder="シークレットキー（任意）"
                    className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                  <button
                    type="button"
                    onClick={saveIssuer}
                    disabled={savingIssuer}
                    className="w-full text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded transition-colors"
                  >
                    {savingIssuer ? '保存中...' : 'Webhook設定を保存'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
