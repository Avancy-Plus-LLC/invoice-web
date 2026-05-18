import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const zipcode = req.nextUrl.searchParams.get('zipcode')?.replace(/[-ー]/g, '');

  if (!zipcode || !/^\d{7}$/.test(zipcode)) {
    return NextResponse.json({ error: '7桁の郵便番号を入力してください' }, { status: 400 });
  }

  const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zipcode}`);
  if (!res.ok) {
    return NextResponse.json({ error: '外部APIエラー' }, { status: 502 });
  }

  const data = await res.json();
  if (!data.results) {
    return NextResponse.json({ error: '該当する住所が見つかりません' }, { status: 404 });
  }

  const { address1, address2, address3 } = data.results[0];
  return NextResponse.json({ address: `${address1}${address2}${address3}` });
}
