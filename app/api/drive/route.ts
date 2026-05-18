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
  if (!createRes.ok) throw new Error(`Folder create: ${JSON.stringify(folder)}`);
  return folder.id as string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const accessToken = (session as any)?.accessToken as string | null;
    if (!accessToken) return NextResponse.json({ error: 'No access token' }, { status: 401 });

    const { pdfBase64, fileName } = await req.json();
    if (!pdfBase64 || !fileName) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    // base64 → Uint8Array
    const binaryString = atob(pdfBase64);
    const pdfBytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) pdfBytes[i] = binaryString.charCodeAt(i);

    // Step 1: ファイルメタデータを作成
    const folderId = await getOrCreateFolder(accessToken);
    const metaRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `${fileName}.pdf`, parents: [folderId], mimeType: 'application/pdf' }),
    });
    const meta = await metaRes.json();
    if (!metaRes.ok) return NextResponse.json({ error: `Meta: ${JSON.stringify(meta)}` }, { status: 500 });

    // Step 2: PDFコンテンツをアップロード
    const uploadRes = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${meta.id}?uploadType=media`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/pdf' },
        body: pdfBytes,
      }
    );
    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      return NextResponse.json({ error: `Upload: ${err}` }, { status: 500 });
    }

    const driveUrl = `https://drive.google.com/file/d/${meta.id}/view`;
    return NextResponse.json({ ok: true, driveUrl, fileId: meta.id });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
