import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOrCreateSpreadsheet, readIssuerInfo } from '@/lib/sheets';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const accessToken = (session as any)?.accessToken as string | null;
  if (!accessToken) return NextResponse.json({ error: 'No access token' }, { status: 401 });

  const body = await req.json();

  const spreadsheetId = await getOrCreateSpreadsheet(accessToken);
  const issuer = await readIssuerInfo(accessToken, spreadsheetId);
  const webhookUrl = issuer?.webhookUrl?.trim();

  if (!webhookUrl) return NextResponse.json({ ok: true, skipped: true });

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'registerInvoice',
      secret: body.secret ?? '',
      data: {
        invoiceDate: body.invoiceDate,
        invoiceNo: body.invoiceNo,
        clientName: body.clientName,
        total: body.total,
      },
    }),
  });

  const result = await res.json().catch(() => ({}));
  return NextResponse.json({ ok: true, result });
}
