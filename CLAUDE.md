@AGENTS.md

# invoice-web — プロジェクト概要

## 何のためのシステムか

個人事業主・法人向けの **請求書・見積書・領収書 PDF 生成 Web アプリ**。
Google アカウントでログインし、フォームに入力 → PDF 生成 → ダウンロード / Google Drive 保存 / Gmail 送信 が一連で完結する。

## クライアント・利用者

- **Avancy Plus 合同会社**（鈴木大朗）の社内ツール
- 自社請求書発行を効率化するために構築

---

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フレームワーク | Next.js 16.2.6（App Router） |
| UI | React 19 + Tailwind CSS v4 |
| フォーム | react-hook-form |
| PDF 生成 | @react-pdf/renderer v4（ブラウザサイド） |
| 認証 | next-auth v4（Google OAuth） |
| 外部連携 | Google Sheets API / Drive API v3 / Gmail API |
| フォント | Noto Sans JP（woff2、public/fonts/） |
| ホスティング | Cloudflare Workers（opennextjs-cloudflare） |
| デプロイコマンド | `npm run cf:deploy` |

---

## ファイル構成

```
invoice-web/
├── app/
│   ├── page.tsx              # メインUI（フォーム・ドキュメント種別切替・印鑑・Webhook）
│   ├── layout.tsx            # AuthProvider wrapper
│   └── api/
│       ├── auth/[...nextauth]/  # next-auth ルート
│       ├── sheets/route.ts   # Google Sheets CRUD（発行者・取引先・備考・振込先）
│       ├── drive/route.ts    # Google Drive PDF保存
│       ├── email/route.ts    # Gmail送信（PDFをDrive保存＋添付送信）
│       ├── postal/route.ts   # 郵便番号→住所変換
│       └── webhook/route.ts  # 外部システムへのダウンロード通知
├── components/
│   ├── InvoiceForm.tsx       # メインフォーム（取引先・発行者・明細・備考）
│   ├── InvoiceSummary.tsx    # 小計・消費税・合計表示
│   ├── PDFActions.tsx        # ダウンロード/Drive保存/Gmail送信ボタン
│   ├── PDFActionsInner.tsx   # PDFActions の内部実装（クライアントコンポーネント）
│   ├── TemplateSelector.tsx  # テンプレート選択UI
│   └── pdf-templates/        # 12種のPDFテンプレート（react-pdf）
│       ├── ClassicTemplate.tsx
│       ├── ModernTemplate.tsx
│       ├── EstimateTemplate.tsx  # 見積書専用
│       ├── ReceiptTemplate.tsx   # 領収書専用
│       └── ... (他8種)
├── lib/
│   ├── types.ts              # InvoiceData / InvoiceItem / BankAccount / TemplateId 等
│   ├── sheets.ts             # Google Sheets API ラッパー
│   ├── auth.ts               # next-auth 設定（Google OAuth + トークンリフレッシュ）
│   ├── calculations.ts       # 税額計算（消費税10%）
│   ├── fonts.ts              # react-pdf 用 Noto Sans JP フォント登録
│   └── https-patch.ts        # Cloudflare Workers 向け Node.js https パッチ
├── public/fonts/             # Noto Sans JP woff2（PDF埋め込み用）
├── wrangler.toml             # Cloudflare Workers 設定
└── open-next.config.ts       # opennextjs-cloudflare 設定
```

---

## Google Sheets データ構造

ログインユーザーの Google Drive に `請求書データ` スプレッドシートを自動作成。

| シート名 | 用途 |
|---|---|
| 発行者情報 | 自社情報・銀行口座・Webhook URL |
| 取引先リスト | クライアントマスタ |
| 備考マスタ | 書類種別ごとの備考テンプレート |
| 振込先リスト | 振込先銀行口座マスタ |

---

## 実装済み機能

- **書類種別**：請求書 / 見積書 / 領収書（切替で番号プレフィックスも自動変更）
- **PDF テンプレート**：12 種（クラシック・モダン・ミニマル・エレガント・和風・オーシャン・ナイト・桜・秋・スレート・バイオレット・レトロ）
- **インボイス対応**：消費税10%・登録番号欄
- **電子印鑑**：画像アップロード（localStorage保存）・サイズ調整
- **マスタ管理**（要 Google ログイン）：取引先 / 振込先 / 備考テンプレート
- **Google Drive 保存**：`請求書PDF` フォルダに自動保存
- **Gmail 送信**：PDF 添付メール送信（Drive 保存も同時実行）
- **Webhook**：ダウンロード時に外部 URL へ請求データ POST
- **郵便番号→住所自動補完**
- **番号自動インクリメント**：ダウンロード後に採番を +1

---

## 開発ルール・注意事項

1. **Next.js のバージョン固有の挙動に注意**：コードを書く前に `node_modules/next/dist/docs/` を確認すること（AGENTS.md 参照）
2. **Cloudflare Workers 制約**：Node.js API（`https` モジュールなど）は直接使えない。`lib/https-patch.ts` で対処済み
3. **NEXTAUTH_URL は `wrangler.toml` の `[vars]` に記載必須**（シークレットだけでは JWT 署名エラーになる）
4. **@react-pdf/renderer はブラウザサイドのみ**：SSR 不可。`PDFActionsInner.tsx` は `'use client'` かつ dynamic import で扱うこと
5. **フォント**：PDF には `public/fonts/NotoSansJP-*.woff2` を fetch して埋め込む（`lib/fonts.ts`）
6. **認証スコープ**：Sheets / Drive / Gmail の3つを同時に要求している。スコープ変更時は `lib/auth.ts` を更新

---

## 環境変数

`.env.local` に以下が必要：

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
```

Cloudflare 本番環境では `NEXTAUTH_URL` は `wrangler.toml [vars]` に、残りは `wrangler secret put` で登録。

---

## 次のステップ（候補）

- 請求書の発行履歴管理（Sheets への保存・一覧表示）
- テンプレート選択を見積書・領収書にも開放（現状は請求書のみ）
- 取引先削除・編集機能
- PDF プレビューのパフォーマンス改善（大量明細時の再レンダリング）
- マルチユーザー対応（現状は1アカウント＝1スプレッドシート前提）
