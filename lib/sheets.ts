import type { SavedIssuer, InvoiceItem } from './types';

const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE_BASE = 'https://www.googleapis.com/drive/v3';

const REQUIRED_SHEETS = ['発行者情報', '取引先リスト', '備考マスタ', '振込先リスト', '品目マスタ'];

const DEFAULT_NOTES_ROWS = [
  ['請求書', 'いつもお世話になっております。\n大変恐れ入りますが振込手数料はご負担頂きますようお願いいたします。'],
  ['見積書', 'いつもお世話になっております。何卒ご検討のほどよろしくお願いいたします。\nご不明点等ございましたらお気軽にお問い合わせください。'],
  ['領収書', 'この度はお支払いいただき誠にありがとうございました。\n確かに領収いたしました。今後ともよろしくお願いいたします。'],
];

async function gFetch(url: string, accessToken: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google API ${res.status}: ${text}`);
  }
  return res.json();
}

async function batchUpdateValues(accessToken: string, spreadsheetId: string, data: Array<{ range: string; values: string[][] }>) {
  return gFetch(`${SHEETS_BASE}/${spreadsheetId}/values:batchUpdate`, accessToken, {
    method: 'POST',
    body: JSON.stringify({ valueInputOption: 'RAW', data }),
  });
}

async function ensureSheets(accessToken: string, spreadsheetId: string) {
  const meta = await gFetch(
    `${SHEETS_BASE}/${spreadsheetId}?fields=sheets.properties.title`,
    accessToken
  );
  const existing = new Set((meta.sheets ?? []).map((s: { properties: { title: string } }) => s.properties.title));

  const missing = REQUIRED_SHEETS.filter((t) => !existing.has(t));
  if (missing.length === 0) return;

  await gFetch(`${SHEETS_BASE}/${spreadsheetId}:batchUpdate`, accessToken, {
    method: 'POST',
    body: JSON.stringify({
      requests: missing.map((title) => ({ addSheet: { properties: { title } } })),
    }),
  });

  const updates: Array<{ range: string; values: string[][] }> = [];
  if (missing.includes('発行者情報')) {
    updates.push({ range: '発行者情報!A1:O1', values: [['発行者名','郵便番号','住所','電話番号','メールアドレス','インボイス登録番号','銀行名','支店名','口座種別','口座番号','口座名義','WebhookURL','最終請求書番号','最終見積書番号','最終領収書番号']] });
  }
  if (missing.includes('取引先リスト')) {
    updates.push({ range: '取引先リスト!A1:G1', values: [['取引先名','郵便番号','住所','部署','担当者名','電話番号','メールアドレス']] });
  }
  if (missing.includes('備考マスタ')) {
    updates.push({ range: '備考マスタ!A1:B1', values: [['書類種別', '備考']] });
    updates.push({ range: '備考マスタ!A2:B4', values: DEFAULT_NOTES_ROWS });
  }
  if (missing.includes('振込先リスト')) {
    updates.push({ range: '振込先リスト!A1:F1', values: [['ラベル', '銀行名', '支店名', '口座種別', '口座番号', '口座名義']] });
  }
  if (missing.includes('品目マスタ')) {
    updates.push({ range: '品目マスタ!A1:E1', values: [['取引先名', '品目・内容', '数量', '単位', '単価']] });
  }
  if (updates.length > 0) await batchUpdateValues(accessToken, spreadsheetId, updates);
}

export async function getOrCreateSpreadsheet(accessToken: string): Promise<string> {
  const q = encodeURIComponent(
    "name='請求書データ' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false"
  );
  const search = await gFetch(`${DRIVE_BASE}/files?q=${q}&fields=files(id)`, accessToken);

  if (search.files?.length) {
    const id = search.files[0].id as string;
    await ensureSheets(accessToken, id);
    return id;
  }

  const created = await gFetch(SHEETS_BASE, accessToken, {
    method: 'POST',
    body: JSON.stringify({
      properties: { title: '請求書データ' },
      sheets: REQUIRED_SHEETS.map((title) => ({ properties: { title } })),
    }),
  });

  const id = created.spreadsheetId as string;

  await batchUpdateValues(accessToken, id, [
    { range: '発行者情報!A1:O1', values: [['発行者名','郵便番号','住所','電話番号','メールアドレス','インボイス登録番号','銀行名','支店名','口座種別','口座番号','口座名義','WebhookURL','最終請求書番号','最終見積書番号','最終領収書番号']] },
    { range: '取引先リスト!A1:G1', values: [['取引先名','郵便番号','住所','部署','担当者名','電話番号','メールアドレス']] },
    { range: '備考マスタ!A1:B1', values: [['書類種別', '備考']] },
    { range: '備考マスタ!A2:B4', values: DEFAULT_NOTES_ROWS },
    { range: '振込先リスト!A1:F1', values: [['ラベル','銀行名','支店名','口座種別','口座番号','口座名義']] },
    { range: '品目マスタ!A1:E1', values: [['取引先名','品目・内容','数量','単位','単価']] },
  ]);

  return id;
}

export async function readIssuers(accessToken: string, spreadsheetId: string): Promise<SavedIssuer[]> {
  const data = await gFetch(`${SHEETS_BASE}/${spreadsheetId}/values/発行者情報!A1:K`, accessToken);
  return ((data.values ?? []) as string[][])
    .filter((row) => row[0] && row[0] !== '発行者名')
    .map((row) => ({
      issuerName: row[0] ?? '',
      issuerPostal: row[1] ?? '',
      issuerAddress: row[2] ?? '',
      issuerTel: row[3] ?? '',
      issuerEmail: row[4] ?? '',
      issuerInvoiceNumber: row[5] ?? '',
      bankName: row[6] ?? '',
      bankBranch: row[7] ?? '',
      accountType: row[8] ?? '普通',
      accountNumber: row[9] ?? '',
      accountHolder: row[10] ?? '',
    }));
}

export async function appendIssuer(accessToken: string, spreadsheetId: string, issuer: SavedIssuer) {
  await gFetch(
    `${SHEETS_BASE}/${spreadsheetId}/values/発行者情報!A:L:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        values: [[
          issuer.issuerName,
          issuer.issuerPostal,
          issuer.issuerAddress,
          issuer.issuerTel,
          issuer.issuerEmail,
          issuer.issuerInvoiceNumber,
          issuer.bankName,
          issuer.bankBranch,
          issuer.accountType,
          issuer.accountNumber,
          issuer.accountHolder,
          '',
        ]],
      }),
    }
  );
}

export async function readIssuerInfo(accessToken: string, spreadsheetId: string) {
  const data = await gFetch(`${SHEETS_BASE}/${spreadsheetId}/values/発行者情報!A2:O2`, accessToken);
  const row: string[] = data.values?.[0] ?? [];
  if (!row.length) return null;
  return {
    issuerName: row[0] ?? '',
    issuerPostal: row[1] ?? '',
    issuerAddress: row[2] ?? '',
    issuerTel: row[3] ?? '',
    issuerEmail: row[4] ?? '',
    issuerInvoiceNumber: row[5] ?? '',
    bankName: row[6] ?? '',
    bankBranch: row[7] ?? '',
    accountType: row[8] ?? '普通',
    accountNumber: row[9] ?? '',
    accountHolder: row[10] ?? '',
    webhookUrl: row[11] ?? '',
    lastInvoiceNumber: row[12] ?? '',
    lastEstimateNumber: row[13] ?? '',
    lastReceiptNumber: row[14] ?? '',
  };
}

export async function writeIssuerInfo(accessToken: string, spreadsheetId: string, data: Record<string, string>) {
  await gFetch(
    `${SHEETS_BASE}/${spreadsheetId}/values/発行者情報!A2:L2?valueInputOption=RAW`,
    accessToken,
    {
      method: 'PUT',
      body: JSON.stringify({
        values: [[
          data.issuerName ?? '',
          data.issuerPostal ?? '',
          data.issuerAddress ?? '',
          data.issuerTel ?? '',
          data.issuerEmail ?? '',
          data.issuerInvoiceNumber ?? '',
          data.bankName ?? '',
          data.bankBranch ?? '',
          data.accountType ?? '普通',
          data.accountNumber ?? '',
          data.accountHolder ?? '',
          data.webhookUrl ?? '',
        ]],
      }),
    }
  );
}

export async function readClients(accessToken: string, spreadsheetId: string) {
  const data = await gFetch(`${SHEETS_BASE}/${spreadsheetId}/values/取引先リスト!A1:G`, accessToken);
  return ((data.values ?? []) as string[][])
    .filter((row) => row[0] && row[0] !== '取引先名')
    .map((row) => ({
    clientName: row[0] ?? '',
    clientPostal: row[1] ?? '',
    clientAddress: row[2] ?? '',
    clientDept: row[3] ?? '',
    clientContact: row[4] ?? '',
    clientTel: row[5] ?? '',
    clientEmail: row[6] ?? '',
  }));
}

export async function appendClient(accessToken: string, spreadsheetId: string, client: Record<string, string>) {
  await gFetch(
    `${SHEETS_BASE}/${spreadsheetId}/values/取引先リスト!A:G:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        values: [[
          client.clientName ?? '',
          client.clientPostal ?? '',
          client.clientAddress ?? '',
          client.clientDept ?? '',
          client.clientContact ?? '',
          client.clientTel ?? '',
          client.clientEmail ?? '',
        ]],
      }),
    }
  );
}

export async function readNotesTemplates(accessToken: string, spreadsheetId: string): Promise<Record<string, string>> {
  const data = await gFetch(`${SHEETS_BASE}/${spreadsheetId}/values/備考マスタ!A2:B`, accessToken);
  const result: Record<string, string> = {};
  for (const row of (data.values ?? []) as string[][]) {
    if (row[0]) result[row[0]] = row[1] ?? '';
  }
  return result;
}

export async function writeNotesTemplate(accessToken: string, spreadsheetId: string, docType: string, notes: string) {
  const data = await gFetch(`${SHEETS_BASE}/${spreadsheetId}/values/備考マスタ!A2:A`, accessToken);
  const rows = (data.values ?? []) as string[][];
  const rowIndex = rows.findIndex((r) => r[0] === docType);

  if (rowIndex >= 0) {
    const rowNum = rowIndex + 2;
    await gFetch(
      `${SHEETS_BASE}/${spreadsheetId}/values/備考マスタ!A${rowNum}:B${rowNum}?valueInputOption=RAW`,
      accessToken,
      { method: 'PUT', body: JSON.stringify({ values: [[docType, notes]] }) }
    );
  } else {
    await gFetch(
      `${SHEETS_BASE}/${spreadsheetId}/values/備考マスタ!A:B:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      accessToken,
      { method: 'POST', body: JSON.stringify({ values: [[docType, notes]] }) }
    );
  }
}

export async function writeInvoiceNumbers(
  accessToken: string,
  spreadsheetId: string,
  numbers: { '請求書': string; '見積書': string; '領収書': string }
) {
  await gFetch(
    `${SHEETS_BASE}/${spreadsheetId}/values/発行者情報!M2:O2?valueInputOption=RAW`,
    accessToken,
    {
      method: 'PUT',
      body: JSON.stringify({ values: [[numbers['請求書'], numbers['見積書'], numbers['領収書']]] }),
    }
  );
}

export async function readItemTemplates(accessToken: string, spreadsheetId: string): Promise<Record<string, InvoiceItem[]>> {
  const data = await gFetch(`${SHEETS_BASE}/${spreadsheetId}/values/品目マスタ!A2:E`, accessToken);
  const result: Record<string, InvoiceItem[]> = {};
  for (const row of (data.values ?? []) as string[][]) {
    if (!row[0]) continue;
    const clientName = row[0];
    if (!result[clientName]) result[clientName] = [];
    const qty = Number(row[2]) || 1;
    const price = Number(row[4]) || 0;
    result[clientName].push({
      description: row[1] ?? '',
      quantity: qty,
      unit: row[3] ?? '式',
      unitPrice: price,
      amount: qty * price,
    });
  }
  return result;
}

export async function writeItemTemplate(accessToken: string, spreadsheetId: string, clientName: string, items: InvoiceItem[]) {
  const data = await gFetch(`${SHEETS_BASE}/${spreadsheetId}/values/品目マスタ!A2:E`, accessToken);
  const existing = ((data.values ?? []) as string[][]).filter((row) => row[0] && row[0] !== clientName);
  const newRows = [
    ...existing,
    ...items.map((item) => [clientName, item.description, String(item.quantity), item.unit, String(item.unitPrice)]),
  ];

  await gFetch(`${SHEETS_BASE}/${spreadsheetId}/values/品目マスタ!A2:E:clear`, accessToken, {
    method: 'POST',
    body: '{}',
  });

  if (newRows.length > 0) {
    await gFetch(`${SHEETS_BASE}/${spreadsheetId}/values/品目マスタ!A2:E?valueInputOption=RAW`, accessToken, {
      method: 'PUT',
      body: JSON.stringify({ values: newRows }),
    });
  }
}
