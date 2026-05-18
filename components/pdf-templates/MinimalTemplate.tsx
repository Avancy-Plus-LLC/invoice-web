import {
  Document,
  Image,
  Page,
  Text,
  View,
  StyleSheet,
  Line,
  Svg,
} from '@react-pdf/renderer';
import type { InvoiceData } from '@/lib/types';
import { computeTotals, formatCurrency, formatDateJa, formatPostal } from '@/lib/calculations';
import { registerFonts } from '@/lib/fonts';

registerFonts();

const GRAY = '#6b7280';
const DARK = '#111827';

const s = StyleSheet.create({
  page: { fontFamily: 'NotoSansJP', fontSize: 9, color: DARK, padding: '18mm 20mm' },
  pageTitle: { fontSize: 30, letterSpacing: 8, color: DARK, marginBottom: 4 },
  titleSub: { fontSize: 8.5, color: GRAY, letterSpacing: 1, marginBottom: 20 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 22 },
  metaBlock: { alignItems: 'flex-end' },
  metaLabel: { fontSize: 7.5, color: GRAY, letterSpacing: 0.5, marginBottom: 2 },
  metaValue: { fontSize: 9, fontFamily: 'NotoSansJP', fontWeight: 700 },
  dividerThin: { marginBottom: 16 },
  partiesRow: { flexDirection: 'row', marginBottom: 18 },
  clientBlock: { flex: 1 },
  clientName: { fontSize: 15, fontFamily: 'NotoSansJP', fontWeight: 700, marginBottom: 2 },
  honorific: { fontSize: 8.5, color: GRAY, marginBottom: 4 },
  smallText: { fontSize: 8, color: GRAY, lineHeight: 1.7 },
  issuerBlock: { flex: 1, alignItems: 'flex-end' },
  issuerName: { fontSize: 11, fontFamily: 'NotoSansJP', fontWeight: 700, marginBottom: 3, textAlign: 'right' },
  issuerText: { fontSize: 8, color: GRAY, lineHeight: 1.7, textAlign: 'right' },
  amountSection: { marginBottom: 20, paddingBottom: 16 },
  amountLabel: { fontSize: 8, color: GRAY, letterSpacing: 1, marginBottom: 5 },
  amountValue: { fontSize: 28, fontFamily: 'NotoSansJP', fontWeight: 700, letterSpacing: 1 },
  amountDue: { fontSize: 8.5, color: GRAY, marginTop: 4 },
  tableHeaderRow: { flexDirection: 'row', paddingBottom: 4, marginBottom: 4 },
  tableRow: { flexDirection: 'row', paddingTop: 5, paddingBottom: 5 },
  thNo: { width: '5%', fontSize: 7.5, color: GRAY, letterSpacing: 0.5 },
  thDesc: { width: '46%', fontSize: 7.5, color: GRAY, letterSpacing: 0.5 },
  thQty: { width: '9%', fontSize: 7.5, color: GRAY, letterSpacing: 0.5, textAlign: 'right' },
  thUnit: { width: '7%', fontSize: 7.5, color: GRAY, letterSpacing: 0.5, textAlign: 'center' },
  thPrice: { width: '16%', fontSize: 7.5, color: GRAY, letterSpacing: 0.5, textAlign: 'right' },
  thAmount: { width: '17%', fontSize: 7.5, color: GRAY, letterSpacing: 0.5, textAlign: 'right' },
  tdNo: { width: '5%', fontSize: 8.5, color: GRAY },
  tdDesc: { width: '46%', fontSize: 8.5 },
  tdQty: { width: '9%', fontSize: 8.5, textAlign: 'right' },
  tdUnit: { width: '7%', fontSize: 8.5, textAlign: 'center', color: GRAY },
  tdPrice: { width: '16%', fontSize: 8.5, textAlign: 'right', color: GRAY },
  tdAmount: { width: '17%', fontSize: 8.5, textAlign: 'right', fontFamily: 'NotoSansJP', fontWeight: 700 },
  totalsWrap: { alignItems: 'flex-end', marginTop: 12, marginBottom: 18 },
  totalRow: { flexDirection: 'row', width: 200 },
  totalLabel: { flex: 1, fontSize: 8.5, color: GRAY, textAlign: 'right', padding: '2.5pt 8pt' },
  totalValue: { width: 90, fontSize: 8.5, textAlign: 'right', padding: '2.5pt 0' },
  grandLabel: { flex: 1, fontSize: 10, fontFamily: 'NotoSansJP', fontWeight: 700, textAlign: 'right', padding: '5pt 8pt' },
  grandValue: { width: 90, fontSize: 10, fontFamily: 'NotoSansJP', fontWeight: 700, textAlign: 'right', padding: '5pt 0' },
  bottomSection: { flexDirection: 'row', gap: 14 },
  bankBox: { flex: 1, fontSize: 8.5, lineHeight: 1.8 },
  bankLabel: { fontSize: 7.5, color: GRAY, letterSpacing: 0.5, marginBottom: 5 },
  notesBox: { flex: 1, fontSize: 8.5 },
  notesLabel: { fontSize: 7.5, color: GRAY, letterSpacing: 0.5, marginBottom: 5 },
  notesText: { color: GRAY, lineHeight: 1.7 },
});

function HLine({ color = '#e5e7eb' }: { color?: string }) {
  return (
    <Svg height={1} style={{ marginBottom: 10, marginTop: 2 }}>
      <Line x1={0} y1={0} x2={595} y2={0} strokeWidth={0.6} stroke={color} />
    </Svg>
  );
}

type Props = { data: InvoiceData; stampDataUrl?: string | null; stampSize?: number };

export function MinimalTemplate({ data, stampDataUrl, stampSize = 64 }: Props) {
  const { subtotal, taxAmount, total } = computeTotals(data);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* タイトル */}
        <View style={s.topRow}>
          <View>
            <Text style={s.pageTitle}>INVOICE</Text>
            <Text style={s.titleSub}>請 求 書</Text>
          </View>
          <View style={s.metaBlock}>
            <Text style={s.metaLabel}>DATE</Text>
            <Text style={{ ...s.metaValue, marginBottom: 8 }}>{formatDateJa(data.issueDate)}</Text>
            <Text style={s.metaLabel}>NO.</Text>
            <Text style={s.metaValue}>{data.invoiceNumber}</Text>
          </View>
        </View>

        <HLine color="#1a1a1a" />

        {/* 取引先・発行者 */}
        <View style={s.partiesRow}>
          <View style={s.clientBlock}>
            {data.clientPostal ? <Text style={s.smallText}>〒{formatPostal(data.clientPostal)}</Text> : null}
            {data.clientAddress ? <Text style={{ ...s.smallText, marginBottom: 5 }}>{data.clientAddress}</Text> : null}
            {data.clientDept ? <Text style={s.smallText}>{data.clientDept}</Text> : null}
            <Text style={s.clientName}>{data.clientName}</Text>
            <Text style={s.honorific}>{data.clientContact ? `${data.clientContact} 様` : '御中'}</Text>
                {data.clientTel ? <Text style={s.smallText}>TEL: {data.clientTel}</Text> : null}
                {data.clientEmail ? <Text style={s.smallText}>{data.clientEmail}</Text> : null}
          </View>
          <View style={s.issuerBlock}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.issuerName}>{data.issuerName}</Text>
                {data.issuerPostal ? <Text style={s.issuerText}>〒{formatPostal(data.issuerPostal)}</Text> : null}
                {data.issuerAddress ? <Text style={s.issuerText}>{data.issuerAddress}</Text> : null}
                {data.issuerTel ? <Text style={s.issuerText}>TEL: {data.issuerTel}</Text> : null}
                {data.issuerEmail ? <Text style={s.issuerText}>{data.issuerEmail}</Text> : null}
                {data.issuerInvoiceNumber ? <Text style={s.issuerText}>登録番号：{data.issuerInvoiceNumber}</Text> : null}
              </View>
              {stampDataUrl ? <Image src={stampDataUrl} style={{ width: stampSize, height: stampSize, marginLeft: 6 }} /> : null}
            </View>
          </View>
        </View>

        <HLine />

        {/* 請求金額 */}
        <View style={s.amountSection}>
          <Text style={s.amountLabel}>TOTAL AMOUNT DUE</Text>
          <Text style={s.amountValue}>¥{formatCurrency(total)}</Text>
          {data.dueDate ? <Text style={s.amountDue}>お支払い期限：{formatDateJa(data.dueDate)}</Text> : null}
        </View>

        <HLine />

        {/* テーブルヘッダー */}
        <View style={s.tableHeaderRow}>
          <Text style={s.thNo}>#</Text>
          <Text style={s.thDesc}>品目・内容</Text>
          <Text style={s.thQty}>数量</Text>
          <Text style={s.thUnit}>単位</Text>
          <Text style={s.thPrice}>単価</Text>
          <Text style={s.thAmount}>金額</Text>
        </View>

        <HLine />

        {data.items.map((item, i) => {
          const amount = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
          return (
            <View key={i}>
              <View style={s.tableRow}>
                <Text style={s.tdNo}>{i + 1}</Text>
                <Text style={s.tdDesc}>{item.description}</Text>
                <Text style={s.tdQty}>{formatCurrency(Number(item.quantity) || 0)}</Text>
                <Text style={s.tdUnit}>{item.unit}</Text>
                <Text style={s.tdPrice}>¥{formatCurrency(Number(item.unitPrice) || 0)}</Text>
                <Text style={s.tdAmount}>¥{formatCurrency(amount)}</Text>
              </View>
              <HLine />
            </View>
          );
        })}

        {/* 合計 */}
        <View style={s.totalsWrap}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>小計</Text>
            <Text style={s.totalValue}>¥{formatCurrency(subtotal)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>消費税（10%）</Text>
            <Text style={s.totalValue}>¥{formatCurrency(taxAmount)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={s.grandLabel}>合計</Text>
            <Text style={s.grandValue}>¥{formatCurrency(total)}</Text>
          </View>
        </View>

        <HLine color="#1a1a1a" />

        {/* 振込先・備考 */}
        <View style={s.bottomSection}>
          {data.bankName ? (
            <View style={s.bankBox}>
              <Text style={s.bankLabel}>BANK TRANSFER</Text>
              <Text>{data.bankName}　{data.bankBranch ? `${data.bankBranch}支店` : ''}</Text>
              <Text>{data.accountType}　{data.accountNumber}　{data.accountHolder}</Text>
            </View>
          ) : <View style={{ flex: 1 }} />}
          <View style={s.notesBox}>
            <Text style={s.notesLabel}>NOTES</Text>
            <Text style={s.notesText}>{data.notes || ' '}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
