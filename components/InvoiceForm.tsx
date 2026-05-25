'use client';

import { useState } from 'react';
import { useFieldArray, type UseFormReturn } from 'react-hook-form';
import type { InvoiceData, SavedIssuer } from '@/lib/types';

type SavedClient = {
  clientName: string;
  clientPostal: string;
  clientAddress: string;
  clientDept: string;
  clientContact: string;
  clientTel: string;
  clientEmail: string;
};

type Props = {
  form: UseFormReturn<InvoiceData>;
  isLoggedIn?: boolean;
  savedIssuers?: SavedIssuer[];
  onSelectIssuer?: (issuer: SavedIssuer) => void;
  onSaveIssuerNew?: () => void;
  savingIssuerNew?: boolean;
  savedClients?: SavedClient[];
  onSelectClient?: (client: SavedClient) => void;
  onSaveClient?: () => void;
  savingClient?: boolean;
  onSaveIssuer?: () => void;
  savingIssuer?: boolean;
  notesTemplate?: string;
  onApplyNotesTemplate?: () => void;
  onSaveNotesTemplate?: () => void;
  savingNotesTemplate?: boolean;
};

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

const inputCls = 'w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';

type PostalTarget = {
  postalField: 'clientPostal' | 'issuerPostal';
  addressField: 'clientAddress' | 'issuerAddress';
};

function PostalInput({
  postalField,
  addressField,
  form,
  placeholder = '100-0001',
}: PostalTarget & { form: UseFormReturn<InvoiceData>; placeholder?: string }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const { register, setValue, getValues } = form;

  async function lookup() {
    const raw = getValues(postalField).replace(/[-ー]/g, '');
    if (raw.length !== 7) { setMsg('7桁で入力してください'); return; }
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${raw}`);
      const data = await res.json();
      if (data.results?.[0]) {
        const { address1, address2, address3 } = data.results[0];
        setValue(addressField, `${address1}${address2}${address3}`, { shouldDirty: true });
        setMsg('');
      } else {
        setMsg('住所が見つかりません');
      }
    } catch {
      setMsg('通信エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    register(postalField).onChange(e);
    const val = e.target.value.replace(/[-ー]/g, '');
    if (val.length === 7) lookup();
  }

  return (
    <div>
      <div className="flex gap-1.5">
        <input
          {...register(postalField)}
          onChange={handleChange}
          className={inputCls}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={lookup}
          disabled={loading}
          className="shrink-0 rounded border border-gray-300 bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          {loading ? '...' : '検索'}
        </button>
      </div>
      {msg && <p className="mt-0.5 text-xs text-red-500">{msg}</p>}
    </div>
  );
}

export function InvoiceForm({
  form,
  isLoggedIn,
  savedIssuers = [],
  onSelectIssuer,
  onSaveIssuerNew,
  savingIssuerNew,
  savedClients = [],
  onSelectClient,
  onSaveClient,
  savingClient,
  onSaveIssuer,
  savingIssuer,
  notesTemplate,
  onApplyNotesTemplate,
  onSaveNotesTemplate,
  savingNotesTemplate,
}: Props) {
  const { register, control, formState: { errors }, watch } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const items = watch('items');

  return (
    <div className="space-y-6">
      {/* 基本情報 */}
      <section>
        <h3 className="text-sm font-bold text-gray-800 border-b pb-1 mb-3">基本情報</h3>
        <div className="grid grid-cols-3 gap-3">
          <Field label="番号" error={errors.invoiceNumber?.message}>
            <input {...register('invoiceNumber', { required: '必須です' })} className={inputCls} placeholder="INV-2024-0001" />
          </Field>
          <Field label="発行日" error={errors.issueDate?.message}>
            <input type="date" {...register('issueDate', { required: '必須です' })} className={inputCls} />
          </Field>
          <Field label="支払期限 / 有効期限">
            <input type="date" {...register('dueDate')} className={inputCls} />
          </Field>
        </div>
        <Field label="件名（任意）">
          <input {...register('subject')} className={inputCls} placeholder="例：2026年5月分システム保守業務" />
        </Field>
      </section>

      {/* 取引先情報 */}
      <section>
        <div className="flex items-center justify-between border-b pb-1 mb-3">
          <h3 className="text-sm font-bold text-gray-800">取引先情報</h3>
          {isLoggedIn && (
            <button
              type="button"
              onClick={onSaveClient}
              disabled={savingClient}
              className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              {savingClient ? '保存中...' : '+ この取引先を保存'}
            </button>
          )}
        </div>
        {isLoggedIn && savedClients.length > 0 && (
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">保存済み取引先から選択</label>
            <select
              className={inputCls}
              onChange={(e) => {
                const idx = Number(e.target.value);
                if (!isNaN(idx) && savedClients[idx]) onSelectClient?.(savedClients[idx]);
                e.target.value = '';
              }}
              defaultValue=""
            >
              <option value="" disabled>選択してください</option>
              {savedClients.map((c, i) => (
                <option key={i} value={i}>{c.clientName}</option>
              ))}
            </select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="取引先名 *" error={errors.clientName?.message}>
            <input {...register('clientName', { required: '必須です' })} className={inputCls} placeholder="○○株式会社" />
          </Field>
          <Field label="担当者名">
            <input {...register('clientContact')} className={inputCls} placeholder="山田 太郎" />
          </Field>
          <Field label="郵便番号">
            <PostalInput postalField="clientPostal" addressField="clientAddress" form={form} />
          </Field>
          <Field label="担当部署">
            <input {...register('clientDept')} className={inputCls} placeholder="経理部" />
          </Field>
          <Field label="住所" error={errors.clientAddress?.message}>
            <input {...register('clientAddress')} className={`${inputCls} col-span-2`} placeholder="東京都千代田区..." />
          </Field>
          <Field label="電話番号">
            <input {...register('clientTel')} className={inputCls} placeholder="03-0000-0000" />
          </Field>
          <Field label="メールアドレス">
            <input {...register('clientEmail')} className={inputCls} placeholder="info@example.com" />
          </Field>
        </div>
      </section>

      {/* 発行者情報 */}
      <section>
        <div className="flex items-center justify-between border-b pb-1 mb-3">
          <h3 className="text-sm font-bold text-gray-800">発行者情報</h3>
          {isLoggedIn && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onSaveIssuerNew}
                disabled={savingIssuerNew}
                className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
              >
                {savingIssuerNew ? '保存中...' : '+ この発行者を保存'}
              </button>
              <button
                type="button"
                onClick={onSaveIssuer}
                disabled={savingIssuer}
                className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                {savingIssuer ? '保存中...' : '保存'}
              </button>
            </div>
          )}
        </div>
        {isLoggedIn && savedIssuers.length > 0 && (
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">保存済み発行者から選択</label>
            <select
              className={inputCls}
              onChange={(e) => {
                const idx = Number(e.target.value);
                if (!isNaN(idx) && savedIssuers[idx]) onSelectIssuer?.(savedIssuers[idx]);
                e.target.value = '';
              }}
              defaultValue=""
            >
              <option value="" disabled>選択してください</option>
              {savedIssuers.map((s, i) => (
                <option key={i} value={i}>{s.issuerName}</option>
              ))}
            </select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="会社名 *" error={errors.issuerName?.message}>
            <input {...register('issuerName', { required: '必須です' })} className={inputCls} placeholder="自社名" />
          </Field>
          <Field label="電話番号">
            <input {...register('issuerTel')} className={inputCls} placeholder="03-0000-0000" />
          </Field>
          <Field label="郵便番号">
            <PostalInput postalField="issuerPostal" addressField="issuerAddress" form={form} placeholder="150-0001" />
          </Field>
          <Field label="メールアドレス">
            <input {...register('issuerEmail')} className={inputCls} placeholder="info@example.com" />
          </Field>
          <Field label="住所">
            <input {...register('issuerAddress')} className={inputCls} placeholder="東京都渋谷区..." />
          </Field>
          <Field label="インボイス登録番号">
            <input {...register('issuerInvoiceNumber')} className={inputCls} placeholder="T1234567890123" />
          </Field>
        </div>
      </section>

      {/* 明細 */}
      <section>
        <h3 className="text-sm font-bold text-gray-800 border-b pb-1 mb-3">明細</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-600">
                <th className="text-left px-2 py-2 font-medium w-[38%]">品目・内容</th>
                <th className="text-right px-2 py-2 font-medium w-[10%]">数量</th>
                <th className="text-left px-2 py-2 font-medium w-[8%]">単位</th>
                <th className="text-right px-2 py-2 font-medium w-[15%]">単価</th>
                <th className="text-right px-2 py-2 font-medium w-[18%]">金額</th>
                <th className="w-[11%]" />
              </tr>
            </thead>
            <tbody>
              {fields.map((field, i) => {
                const qty = Number(items?.[i]?.quantity) || 0;
                const price = Number(items?.[i]?.unitPrice) || 0;
                const amount = qty * price;
                return (
                  <tr key={field.id} className="border-b border-gray-100">
                    <td className="px-1 py-1">
                      <input {...register(`items.${i}.description`)} className={inputCls} placeholder="デザイン制作費" />
                    </td>
                    <td className="px-1 py-1">
                      <input type="number" {...register(`items.${i}.quantity`, { valueAsNumber: true })} className={`${inputCls} text-right`} min={0} />
                    </td>
                    <td className="px-1 py-1">
                      <input {...register(`items.${i}.unit`)} className={inputCls} placeholder="式" />
                    </td>
                    <td className="px-1 py-1">
                      <input type="number" {...register(`items.${i}.unitPrice`, { valueAsNumber: true })} className={`${inputCls} text-right`} min={0} />
                    </td>
                    <td className="px-2 py-1 text-right font-medium text-gray-700">
                      ¥{amount.toLocaleString('ja-JP')}
                    </td>
                    <td className="px-1 py-1 text-center">
                      <button
                        type="button"
                        onClick={() => remove(i)}
                        disabled={fields.length === 1}
                        className="text-red-400 hover:text-red-600 disabled:opacity-30 px-2"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          onClick={() => append({ description: '', quantity: 1, unit: '式', unitPrice: 0, amount: 0 })}
          className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <span className="text-base leading-none">+</span> 明細を追加
        </button>
      </section>

      {/* 振込先 */}
      <section>
        <h3 className="text-sm font-bold text-gray-800 border-b pb-1 mb-3">振込先</h3>

        <div className="grid grid-cols-3 gap-3">
          <Field label="銀行名">
            <input {...register('bankName')} className={inputCls} placeholder="○○銀行" />
          </Field>
          <Field label="支店名">
            <input {...register('bankBranch')} className={inputCls} placeholder="渋谷支店" />
          </Field>
          <Field label="口座種別">
            <select {...register('accountType')} className={inputCls}>
              <option value="普通">普通</option>
              <option value="当座">当座</option>
            </select>
          </Field>
          <Field label="口座番号">
            <input {...register('accountNumber')} className={inputCls} placeholder="1234567" />
          </Field>
          <Field label="口座名義">
            <input {...register('accountHolder')} className={inputCls} placeholder="ユウゲンカイシャ マルマル" />
          </Field>
        </div>

      </section>

      {/* 備考 */}
      <section>
        <div className="flex items-center justify-between border-b pb-1 mb-3">
          <h3 className="text-sm font-bold text-gray-800">備考</h3>
          {isLoggedIn && (
            <div className="flex gap-2">
              {onApplyNotesTemplate && notesTemplate !== undefined && (
                <button
                  type="button"
                  onClick={onApplyNotesTemplate}
                  className="text-xs text-gray-500 hover:text-gray-700 border border-gray-300 rounded px-2 py-0.5"
                >
                  マスタを反映
                </button>
              )}
              {onSaveNotesTemplate && (
                <button
                  type="button"
                  onClick={onSaveNotesTemplate}
                  disabled={savingNotesTemplate}
                  className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  {savingNotesTemplate ? '保存中...' : 'マスタを更新'}
                </button>
              )}
            </div>
          )}
        </div>
        <textarea
          {...register('notes')}
          rows={3}
          className={inputCls}
          placeholder="振込手数料はご負担ください。"
        />
      </section>
    </div>
  );
}
