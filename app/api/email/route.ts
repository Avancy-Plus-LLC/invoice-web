import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const FOLDER_NAME = '請求書PDF';

async function getOrCreateFolder(token: string): Promise<string> {
  const q = encodeURIComponent(
    `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  );
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (searchRes.ok) {
    const d = await searchRes.json();
    if (d.files?.[0]?.id) return d.files[0].id;
  }
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
  });
  const folder = await createRes.json();
  if (!createRes.ok) throw new Error(`Folder: ${JSON.stringify(folder)}`);
  return folder.id as string;
}

async function saveToDrive(token: string, pdfBytes: Uint8Array, fileName: string): Promise<string> {
  const folderId = await getOrCreateFolder(token);

  const metaRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: `${fileName}.pdf`, parents: [folderId], mimeType: 'application/pdf' }),
  });
  const meta = await metaRes.json();
  if (!metaRes.ok) throw new Error(`Meta: ${JSON.stringify(meta)}`);

  const uploadRes = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${meta.id}?uploadType=media`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/pdf' },
      body: pdfBytes.buffer as ArrayBuffer,
    }
  );
  if (!uploadRes.ok) throw new Error(`Upload: ${await uploadRes.text()}`);

  return `https://drive.google.com/file/d/${meta.id}/view`;
}

function encodeUtf8Base64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach(b => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function buildRawEmail(params: {
  to: string;
  subject: string;
  bodyText: string;
  pdfBytes: Uint8Array;
  fileName: string;
}) {
  const boundary = 'invoice_email_boundary_xyz';

  // PDF を76文字ごとに折り返してbase64化
  const chunkSize = 3 * 57;
  let pdfB64 = '';
  for (let i = 0; i < params.pdfBytes.length; i += chunkSize) {
    const chunk = params.pdfBytes.slice(i, i + chunkSize);
    let bin = '';
    chunk.forEach(b => (bin += String.fromCharCode(b)));
    pdfB64 += btoa(bin) + '\r\n';
  }

  // 全体をASCIIのみで構成（文字化け防止）
  const raw =
    `To: ${params.to}\r\n` +
    `Subject: =?UTF-8?B?${encodeUtf8Base64(params.subject)}?=\r\n` +
    `MIME-Version: 1.0\r\n` +
    `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: text/plain; charset=UTF-8\r\n` +
    `Content-Transfer-Encoding: base64\r\n\r\n` +
    `${encodeUtf8Base64(params.bodyText)}\r\n\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/pdf\r\n` +
    `Content-Transfer-Encoding: base64\r\n` +
    `Content-Disposition: attachment; filename="=?UTF-8?B?${encodeUtf8Base64(params.fileName + '.pdf')}?="\r\n\r\n` +
    `${pdfB64}\r\n` +
    `--${boundary}--`;

  // raw は純粋なASCIIなのでそのままbase64url化
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session as any)?.error === 'RefreshAccessTokenError') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const accessToken = (session as any)?.accessToken as string | null;
    if (!accessToken) return NextResponse.json({ error: 'No access token' }, { status: 401 });

    const { pdfBase64, fileName, to, subject, bodyText } = await req.json();
    if (!pdfBase64 || !fileName || !to) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    // base64 → Uint8Array
    const binaryString = atob(pdfBase64);
    const pdfBytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) pdfBytes[i] = binaryString.charCodeAt(i);

    // Drive保存
    const driveUrl = await saveToDrive(accessToken, pdfBytes, fileName);

    // Gmail送信
    const rawEmail = buildRawEmail({ to, subject, bodyText, pdfBytes, fileName });
    const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: rawEmail }),
    });

    if (!gmailRes.ok) {
      const err = await gmailRes.text();
      return NextResponse.json({ error: `Gmail: ${err}` }, { status: 500 });
    }

    return NextResponse.json({ ok: true, driveUrl });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
