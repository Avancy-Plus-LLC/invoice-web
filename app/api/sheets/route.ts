import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getOrCreateSpreadsheet,
  readIssuerInfo,
  writeIssuerInfo,
  readIssuers,
  appendIssuer,
  readClients,
  appendClient,
  readNotesTemplates,
  writeNotesTemplate,
  readItemTemplates,
  writeItemTemplate,
  writeInvoiceNumbers,
} from '@/lib/sheets';

async function getAccessToken(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if ((session as any)?.error === 'RefreshAccessTokenError') return null;
  return (session as any)?.accessToken ?? null;
}

export async function GET() {
  const accessToken = await getAccessToken();
  if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const spreadsheetId = await getOrCreateSpreadsheet(accessToken);
  const [issuer, issuers, clients, notesTemplates, itemTemplates] = await Promise.all([
    readIssuerInfo(accessToken, spreadsheetId),
    readIssuers(accessToken, spreadsheetId),
    readClients(accessToken, spreadsheetId),
    readNotesTemplates(accessToken, spreadsheetId),
    readItemTemplates(accessToken, spreadsheetId),
  ]);

  return NextResponse.json({ issuer, issuers, clients, notesTemplates, itemTemplates });
}

export async function POST(req: NextRequest) {
  const accessToken = await getAccessToken();
  if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { action, data } = await req.json();
    const spreadsheetId = await getOrCreateSpreadsheet(accessToken);

    if (action === 'saveIssuer') {
      await writeIssuerInfo(accessToken, spreadsheetId, data);
      return NextResponse.json({ ok: true });
    }

    if (action === 'saveIssuerNew') {
      await appendIssuer(accessToken, spreadsheetId, data);
      return NextResponse.json({ ok: true });
    }

    if (action === 'saveClient') {
      await appendClient(accessToken, spreadsheetId, data);
      return NextResponse.json({ ok: true });
    }

    if (action === 'saveNotesTemplate') {
      await writeNotesTemplate(accessToken, spreadsheetId, data.docType, data.notes);
      return NextResponse.json({ ok: true });
    }

    if (action === 'saveItemTemplate') {
      await writeItemTemplate(accessToken, spreadsheetId, data.clientName, data.items);
      return NextResponse.json({ ok: true });
    }

    if (action === 'saveInvoiceNumbers') {
      await writeInvoiceNumbers(accessToken, spreadsheetId, data);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
