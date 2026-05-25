export type InvoiceItem = {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
};

export type DocType = '請求書' | '見積書' | '領収書';

export type InvoiceData = {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  subject: string;
  clientName: string;
  clientPostal: string;
  clientAddress: string;
  clientDept: string;
  clientContact: string;
  clientTel: string;
  clientEmail: string;
  issuerName: string;
  issuerPostal: string;
  issuerAddress: string;
  issuerTel: string;
  issuerEmail: string;
  issuerInvoiceNumber: string;
  items: InvoiceItem[];
  notes: string;
  bankName: string;
  bankBranch: string;
  accountType: string;
  accountNumber: string;
  accountHolder: string;
};

export type SavedIssuer = {
  issuerName: string;
  issuerPostal: string;
  issuerAddress: string;
  issuerTel: string;
  issuerEmail: string;
  issuerInvoiceNumber: string;
  bankName: string;
  bankBranch: string;
  accountType: string;
  accountNumber: string;
  accountHolder: string;
};


export type ComputedTotals = {
  subtotal: number;
  taxAmount: number;
  total: number;
};

export type TemplateId = 'classic' | 'modern' | 'minimal' | 'elegant' | 'wagyu'
  | 'ocean' | 'night' | 'sakura' | 'autumn' | 'slate' | 'violet' | 'retro';

export const TEMPLATE_META: Record<TemplateId, { label: string; description: string; accent: string }> = {
  classic: {
    label: 'クラシック',
    description: '伝統的な罫線スタイル。フォーマルな取引に。',
    accent: '#1a1a1a',
  },
  modern: {
    label: 'モダン',
    description: 'ブルーアクセントのスタイリッシュなデザイン。',
    accent: '#1a56db',
  },
  minimal: {
    label: 'ミニマル',
    description: '余白重視の上品なシンプルデザイン。',
    accent: '#6b7280',
  },
  elegant: {
    label: 'エレガント',
    description: 'グリーンサイドバーのプレミアムデザイン。',
    accent: '#065f46',
  },
  wagyu: {
    label: '和風',
    description: '朱色アクセントの伝統的な日本スタイル。',
    accent: '#9b1c1c',
  },
  ocean: {
    label: 'オーシャン',
    description: 'ティールカラーの清潔感あるデザイン。',
    accent: '#0e7490',
  },
  night: {
    label: 'ナイト',
    description: 'ネイビー×ゴールドのプレミアムデザイン。',
    accent: '#d97706',
  },
  sakura: {
    label: '桜',
    description: 'ローズピンクの華やかな日本スタイル。',
    accent: '#be185d',
  },
  autumn: {
    label: '秋',
    description: 'アンバー系のあたたかみのあるデザイン。',
    accent: '#b45309',
  },
  slate: {
    label: 'スレート',
    description: 'スレート×インディゴのクールなデザイン。',
    accent: '#4338ca',
  },
  violet: {
    label: 'バイオレット',
    description: 'パープルアクセントのモダンデザイン。',
    accent: '#7c3aed',
  },
  retro: {
    label: 'レトロ',
    description: 'クリーム×セピアのヴィンテージスタイル。',
    accent: '#92400e',
  },
};
