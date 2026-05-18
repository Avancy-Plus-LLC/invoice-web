'use client';

import { useState } from 'react';
import { TEMPLATE_META, type TemplateId } from '@/lib/types';

type Props = {
  selected: TemplateId;
  onChange: (id: TemplateId) => void;
};

const ACCENT_PREVIEWS: Record<TemplateId, React.ReactNode> = {
  classic: (
    <div className="bg-white p-2 border border-gray-300 text-[7px] h-28 overflow-hidden">
      <div className="text-center font-bold text-sm border-b border-gray-800 pb-1 mb-1">請 求 書</div>
      <div className="flex gap-2 mb-1">
        <div className="flex-1 text-[6px]"><div className="font-bold border-b border-gray-800">○○株式会社</div></div>
        <div className="flex-1 text-right text-[6px] font-bold">発行者名</div>
      </div>
      <div className="border border-gray-800 p-1 text-[6px] flex justify-between mb-1">
        <span>ご請求金額 ¥XXX,XXX</span><span>期限：XX月XX日</span>
      </div>
      <div className="flex bg-gray-800 text-white text-[5px] px-0.5"><span className="flex-1"># 品目</span><span>金額</span></div>
    </div>
  ),
  modern: (
    <div className="bg-white text-[7px] h-28 overflow-hidden">
      <div className="bg-blue-700 text-white p-2 flex justify-between items-end">
        <span className="text-sm font-bold tracking-widest">INVOICE</span>
        <div className="text-right text-[6px]"><div>発行日: XXXX年X月X日</div></div>
      </div>
      <div className="p-2">
        <div className="border-l-2 border-blue-700 pl-1 text-[6px] mb-1"><div className="font-bold">○○株式会社</div></div>
        <div className="bg-blue-50 border-l-4 border-blue-700 p-1 text-[6px]">
          <div className="text-gray-500">ご請求金額</div><div className="font-bold text-blue-700">¥XXX,XXX</div>
        </div>
      </div>
    </div>
  ),
  minimal: (
    <div className="bg-white p-2 text-[7px] h-28 overflow-hidden">
      <div className="flex justify-between items-end mb-2">
        <div className="text-xl font-bold tracking-[6px]">INVOICE</div>
        <div className="text-right text-[6px] text-gray-400">DATE<br /><span className="text-gray-700">XXXX年X月X日</span></div>
      </div>
      <div className="border-t border-gray-800 pt-1 mb-1"><div className="font-bold">○○株式会社</div></div>
      <div className="border-t border-gray-200 pt-1"><div className="text-[6px] text-gray-400">TOTAL</div><div className="font-bold text-lg">¥XXX,XXX</div></div>
    </div>
  ),
  elegant: (
    <div className="bg-white text-[7px] h-28 overflow-hidden flex">
      <div className="bg-emerald-900 w-10 p-1.5 flex-shrink-0">
        <div className="text-white font-bold text-[8px]">INV</div>
        <div className="text-emerald-300 text-[5px] mb-2">請求書</div>
        <div className="text-white text-[5px] font-bold">自社名</div>
      </div>
      <div className="flex-1 p-2">
        <div className="font-bold text-[8px] border-b-2 border-emerald-800 pb-0.5 mb-1">○○株式会社</div>
        <div className="bg-emerald-50 border-l-2 border-emerald-800 px-1 py-0.5 text-[6px]">
          <div className="text-emerald-700">ご請求金額</div><div className="font-bold">¥XXX,XXX</div>
        </div>
      </div>
    </div>
  ),
  wagyu: (
    <div className="bg-white p-2 text-[7px] h-28 overflow-hidden">
      <div className="text-center mb-1">
        <div className="text-sm font-bold tracking-[6px]">請 求 書</div>
        <div className="text-[5px] text-red-800">INVOICE</div>
      </div>
      <div className="border-t-2 border-red-800 pt-1 mb-1 flex justify-between">
        <div className="text-[6px] font-bold">○○株式会社</div>
        <div className="text-[6px] font-bold">発行者名</div>
      </div>
      <div className="bg-red-50 border-l-2 border-red-800 px-1 py-0.5 text-[6px]">
        <div className="text-red-800">ご請求金額</div><div className="font-bold text-red-900">¥XXX,XXX</div>
      </div>
    </div>
  ),
  ocean: (
    <div className="bg-white text-[7px] h-28 overflow-hidden">
      <div className="bg-cyan-700 text-white p-2 flex justify-between items-end">
        <span className="text-sm font-bold tracking-widest">INVOICE</span>
        <div className="text-right text-[6px]"><div>発行日: XXXX年X月X日</div></div>
      </div>
      <div className="p-2">
        <div className="border-l-2 border-cyan-700 pl-1 text-[6px] mb-1"><div className="font-bold">○○株式会社</div></div>
        <div className="bg-cyan-50 border-l-4 border-cyan-700 p-1 text-[6px]">
          <div className="text-gray-500">ご請求金額</div><div className="font-bold text-cyan-700">¥XXX,XXX</div>
        </div>
      </div>
    </div>
  ),
  night: (
    <div className="bg-white text-[7px] h-28 overflow-hidden flex">
      <div className="bg-slate-900 w-10 p-1.5 flex-shrink-0">
        <div className="text-yellow-500 font-bold text-[8px]">INV</div>
        <div className="text-slate-400 text-[5px] mb-2">請求書</div>
        <div className="text-white text-[5px] font-bold">自社名</div>
      </div>
      <div className="flex-1 p-2">
        <div className="font-bold text-[8px] border-b-2 border-yellow-600 pb-0.5 mb-1">○○株式会社</div>
        <div className="bg-yellow-50 border-l-2 border-yellow-600 px-1 py-0.5 text-[6px]">
          <div className="text-yellow-700">ご請求金額</div><div className="font-bold">¥XXX,XXX</div>
        </div>
      </div>
    </div>
  ),
  sakura: (
    <div className="bg-white p-2 text-[7px] h-28 overflow-hidden">
      <div className="text-center mb-1">
        <div className="text-sm font-bold tracking-[6px]">請 求 書</div>
        <div className="text-[5px] text-pink-700">INVOICE</div>
      </div>
      <div className="border-t-2 border-pink-700 pt-1 mb-1 flex justify-between">
        <div className="text-[6px] font-bold">○○株式会社</div>
        <div className="text-[6px] font-bold">発行者名</div>
      </div>
      <div className="bg-pink-50 border-l-2 border-pink-700 px-1 py-0.5 text-[6px]">
        <div className="text-pink-700">ご請求金額</div><div className="font-bold text-pink-900">¥XXX,XXX</div>
      </div>
    </div>
  ),
  autumn: (
    <div className="bg-white p-2 border border-gray-300 text-[7px] h-28 overflow-hidden">
      <div className="text-center font-bold text-sm border-b-2 border-amber-700 pb-1 mb-1">請 求 書</div>
      <div className="flex gap-2 mb-1">
        <div className="flex-1 text-[6px]"><div className="font-bold border-b border-amber-700">○○株式会社</div></div>
        <div className="flex-1 text-right text-[6px] font-bold">発行者名</div>
      </div>
      <div className="bg-amber-50 border border-amber-700 p-1 text-[6px] flex justify-between mb-1">
        <span>ご請求金額 ¥XXX,XXX</span>
      </div>
      <div className="flex bg-amber-700 text-white text-[5px] px-0.5"><span className="flex-1"># 品目</span><span>金額</span></div>
    </div>
  ),
  slate: (
    <div className="bg-white text-[7px] h-28 overflow-hidden">
      <div className="bg-slate-700 text-white p-2 flex justify-between items-end">
        <span className="text-sm font-bold tracking-widest">INVOICE</span>
        <div className="text-right text-[6px]"><div>発行日: XXXX年X月X日</div></div>
      </div>
      <div className="p-2">
        <div className="border-l-2 border-indigo-700 pl-1 text-[6px] mb-1"><div className="font-bold">○○株式会社</div></div>
        <div className="bg-indigo-50 border-l-4 border-indigo-700 p-1 text-[6px]">
          <div className="text-gray-500">ご請求金額</div><div className="font-bold text-indigo-700">¥XXX,XXX</div>
        </div>
      </div>
    </div>
  ),
  violet: (
    <div className="bg-white text-[7px] h-28 overflow-hidden">
      <div className="bg-violet-700 text-white p-2 flex justify-between items-end">
        <span className="text-sm font-bold tracking-widest">INVOICE</span>
        <div className="text-right text-[6px]"><div>発行日: XXXX年X月X日</div></div>
      </div>
      <div className="p-2">
        <div className="border-l-2 border-violet-700 pl-1 text-[6px] mb-1"><div className="font-bold">○○株式会社</div></div>
        <div className="bg-violet-50 border-l-4 border-violet-700 p-1 text-[6px]">
          <div className="text-gray-500">ご請求金額</div><div className="font-bold text-violet-700">¥XXX,XXX</div>
        </div>
      </div>
    </div>
  ),
  retro: (
    <div className="bg-amber-50 p-2 border border-amber-800 text-[7px] h-28 overflow-hidden">
      <div className="text-center font-bold text-sm border-b-2 border-amber-900 pb-1 mb-1 tracking-widest">請 求 書</div>
      <div className="flex gap-2 mb-1">
        <div className="flex-1 text-[6px]"><div className="font-bold">○○株式会社</div></div>
        <div className="flex-1 text-right text-[6px] text-amber-900 font-bold">発行者名</div>
      </div>
      <div className="border border-amber-800 p-1 text-[6px] flex justify-between mb-1 bg-amber-100">
        <span>ご請求金額 ¥XXX,XXX</span>
      </div>
      <div className="flex bg-amber-900 text-amber-50 text-[5px] px-0.5"><span className="flex-1"># 品目</span><span>金額</span></div>
    </div>
  ),
};

const PER_PAGE = 6;
const TEMPLATE_IDS = Object.keys(TEMPLATE_META) as TemplateId[];

export function TemplateSelector({ selected, onChange }: Props) {
  const totalPages = Math.ceil(TEMPLATE_IDS.length / PER_PAGE);
  const selectedPage = Math.floor(TEMPLATE_IDS.indexOf(selected) / PER_PAGE);
  const [page, setPage] = useState(selectedPage >= 0 ? selectedPage : 0);

  const visible = TEMPLATE_IDS.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700">テンプレート選択</h2>
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="w-6 h-6 flex items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-30 text-xs"
            >
              ‹
            </button>
            <span className="text-xs text-gray-400">{page + 1} / {totalPages}</span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="w-6 h-6 flex items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-30 text-xs"
            >
              ›
            </button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {visible.map((id) => {
          const meta = TEMPLATE_META[id];
          const isSelected = selected === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`text-left rounded-lg border-2 overflow-hidden transition-all ${
                isSelected
                  ? 'border-blue-600 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              {ACCENT_PREVIEWS[id]}
              <div className="p-2 bg-white">
                <div className="flex items-center gap-1.5">
                  {isSelected && (
                    <span className="w-3 h-3 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <svg className="w-2 h-2 text-white" viewBox="0 0 8 8" fill="currentColor">
                        <path d="M6.41 1L3 4.41 1.59 3 .5 4.09 3 6.5 7.5 2z" />
                      </svg>
                    </span>
                  )}
                  <span className="text-xs font-semibold text-gray-800">{meta.label}</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">{meta.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
