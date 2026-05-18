import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getOrCreateSpreadsheet,
  readIssuerInfo,
  writeIssuerInfo,
  readClients,
  appendClient,
  readNotesTemplates,
  writeNotesTemplate,
  readBankAccounts,
  writeBankAccounts,
} from '@/lib/sheets';

async function getAccessToken(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session as any)?.accessToken ?? null;
}

export async function GET() {
  const accessToken = await getAccessToken();
  if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const spreadsheetId = await getOrCreateSpreadsheet(accessToken);
  const [issuer, clients, notesTemplates, bankAccounts] = await Promise.all([
    readIssuerInfo(accessToken, spreadsheetId),
    readClients(accessToken, spreadsheetId),
    readNotesTemplates(accessToken, spreadsheetId),
    readBankAccounts(accessToken, spreadsheetId),
  ]);

  return NextResponse.json({ issuer, clients, notesTemplates, bankAccounts });
}

export async function POST(req: NextRequest) {
  const accessToken = await getAccessToken();
  if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { action, data } = await req.json();
  const spreadsheetId = await getOrCreateSpreadsheet(accessToken);

  if (action === 'saveIssuer') {
    await writeIssuerInfo(accessToken, spreadsheetId, data);
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

  if (action === 'saveBankAccounts') {
    await writeBankAccounts(accessToken, spreadsheetId, data.accounts);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
