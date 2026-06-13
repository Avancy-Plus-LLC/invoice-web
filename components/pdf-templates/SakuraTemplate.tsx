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
import { computeTotals, formatCurrency, formatDateJa, formatPostal, taxLabel, subtotalLabel } from '@/lib/calculations';
import { registerFonts } from '@/lib/fonts';

registerFonts();

const ROSE = '#be185d';
const ROSE_MID = '#db2777';
const ROSE_LIGHT = '#fdf2f8';
const DARK = '#1c1917';
const MUTED = '#78716c';

function HDivider({ color = ROSE, thick = false }: { color?: string; thick?: boolean }) {
  return (
    <Svg height={thick ? 2 : 1} style={{ marginBottom: 10, marginTop: 2 }}>
      <Line x1={0} y1={0} x2={595} y2={0} strokeWidth={thick ? 1.5 : 0.6} stroke={color} />
    </Svg>
  );
}

const s = StyleSheet.create({
  page: { fontFamily: 'NotoSansJP', fontSize: 9, color: DARK, padding: '16mm 18mm 14mm 18mm' },
  titleArea: { alignItems: 'center', marginBottom: 6 },
  titleMain: { fontSize: 22, fontFamily: 'NotoSansJP', fontWeight: 700, letterSpacing: 10, color: DARK, marginBottom: 2 },
  titleSub: { fontSize: 8, color: ROSE_MID, letterSpacing: 3 },
  metaRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 },
  metaText: { fontSize: 8, color: MUTED },

  headerRow: { flexDirection: 'row', marginBottom: 14 },
  clientBlock: { flex: 1 },
  clientPostal: { fontSize: 8, color: MUTED, marginBottom: 2 },
  clientAddress: { fontSize: 8, color: MUTED, marginBottom: 5 },
  clientDept: { fontSize: 8, color: MUTED, marginBottom: 2 },
  clientName: { fontSize: 15, fontFamily: 'NotoSansJP', fontWeight: 700, marginBottom: 3 },
  honorific: { fontSize: 8.5, color: MUTED },
  issuerBlock: { flex: 1, alignItems: 'flex-end' },
  issuerName: { fontSize: 11, fontFamily: 'NotoSansJP', fontWeight: 700, marginBottom: 4, textAlign: 'right' },
  issuerText: { fontSize: 8, color: MUTED, lineHeight: 1.7, textAlign: 'right' },

  summaryBox: { backgroundColor: ROSE_LIGHT, borderLeft: `3pt solid ${ROSE}`, padding: '10pt 16pt', marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 8, color: ROSE_MID, marginBottom: 3, letterSpacing: 0.5 },
  summaryAmount: { fontSize: 20, fontFamily: 'NotoSansJP', fontWeight: 700, color: ROSE },
  summaryDueLabel: { fontSize: 8, color: MUTED, marginBottom: 2, textAlign: 'right' },
  summaryDueValue: { fontSize: 9.5, fontFamily: 'NotoSansJP', fontWeight: 700, textAlign: 'right' },

  tableHeaderRow: { flexDirection: 'row', backgroundColor: ROSE, borderRadius: 2, marginBottom: 2 },
  tableRow: { flexDirection: 'row', borderBottom: `0.5pt solid #fce7f3` },
  tableRowEven: { flexDirection: 'row', borderBottom: `0.5pt solid #fce7f3`, backgroundColor: '#fff7fb' },
  thNo: { width: '5%', padding: '5pt 4pt', color: '#fff', fontSize: 8, textAlign: 'center', fontFamily: 'NotoSansJP', fontWeight: 700 },
  thDesc: { width: '45%', padding: '5pt 8pt', color: '#fff', fontSize: 8, fontFamily: 'NotoSansJP', fontWeight: 700 },
  thQty: { width: '8%', padding: '5pt 4pt', color: '#fff', fontSize: 8, textAlign: 'right', fontFamily: 'NotoSansJP', fontWeight: 700 },
  thUnit: { width: '8%', padding: '5pt 4pt', color: '#fff', fontSize: 8, textAlign: 'center', fontFamily: 'NotoSansJP', fontWeight: 700 },
  thPrice: { width: '17%', padding: '5pt 8pt', color: '#fff', fontSize: 8, textAlign: 'right', fontFamily: 'NotoSansJP', fontWeight: 700 },
  thAmount: { width: '17%', padding: '5pt 8pt', color: '#fff', fontSize: 8, textAlign: 'right', fontFamily: 'NotoSansJP', fontWeight: 700 },
  tdNo: { width: '5%', padding: '4pt 4pt', fontSize: 8, textAlign: 'center', color: '#f9a8d4' },
  tdDesc: { width: '45%', padding: '4pt 8pt', fontSize: 8 },
  tdQty: { width: '8%', padding: '4pt 4pt', fontSize: 8, textAlign: 'right' },
  tdUnit: { width: '8%', padding: '4pt 4pt', fontSize: 8, textAlign: 'center', color: MUTED },
  tdPrice: { width: '17%', padding: '4pt 8pt', fontSize: 8, textAlign: 'right', color: MUTED },
  tdAmount: { width: '17%', padding: '4pt 8pt', fontSize: 8, textAlign: 'right', fontFamily: 'NotoSansJP', fontWeight: 700 },

  totalsWrap: { alignItems: 'flex-end', marginTop: 8, marginBottom: 14 },
  totalRow: { flexDirection: 'row', width: 210 },
  totalLabel: { width: 110, textAlign: 'right', padding: '3pt 8pt', fontSize: 8.5, color: MUTED },
  totalValue: { width: 100, textAlign: 'right', padding: '3pt 8pt', fontSize: 8.5 },
  grandRow: { flexDirection: 'row', width: 210, backgroundColor: ROSE, borderRadius: 2 },
  grandLabel: { width: 110, textAlign: 'right', padding: '5pt 8pt', color: '#fff', fontSize: 10, fontFamily: 'NotoSansJP', fontWeight: 700 },
  grandValue: { width: 100, textAlign: 'right', padding: '5pt 8pt', color: '#fff', fontSize: 10, fontFamily: 'NotoSansJP', fontWeight: 700 },

  bottomRow: { flexDirection: 'column', gap: 8 },
  bankBox: { border: `1pt solid #fce7f3`, padding: '8pt 12pt', fontSize: 8.5, lineHeight: 1.8 },
  bankTitle: { fontFamily: 'NotoSansJP', fontWeight: 700, color: ROSE_MID, marginBottom: 4, fontSize: 8.5 },
  notesBox: { border: `1pt solid #fce7f3`, padding: '8pt 12pt', fontSize: 8.5, minHeight: 44 },
  notesTitle: { fontFamily: 'NotoSansJP', fontWeight: 700, color: ROSE_MID, marginBottom: 4, fontSize: 8.5 },
});

type Props = { data: InvoiceData; stampDataUrl?: string | null; stampSize?: number };

export function SakuraTemplate({ data, stampDataUrl, stampSize = 45 }: Props) {
  const { subtotal, taxAmount, total } = computeTotals(data);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* タイトル */}
        <View style={s.titleArea}>
          <Text style={s.titleMain}>請 求 書</Text>
          <Text style={s.titleSub}>INVOICE</Text>
        </View>

        <HDivider thick />

        <View style={s.metaRow}>
          <Text style={s.metaText}>発行日：{formatDateJa(data.issueDate)}　　No. {data.invoiceNumber}</Text>
        </View>

        {/* 取引先・発行者 */}
        <View style={s.headerRow}>
          <View style={s.clientBlock}>
            {data.clientPostal ? <Text style={s.clientPostal}>〒{formatPostal(data.clientPostal)}</Text> : null}
            {data.clientAddress ? <Text style={s.clientAddress}>{data.clientAddress}</Text> : null}
            {data.clientDept ? <Text style={{ fontSize: 8, color: MUTED, marginBottom: 2 }}>{data.clientDept}</Text> : null}
            <Text style={s.clientName}>{data.clientName}</Text>
            <Text style={s.honorific}>{data.clientContact ? `${data.clientContact} 様` : '御中'}</Text>
                {data.clientTel ? <Text style={s.clientPostal}>TEL: {data.clientTel}</Text> : null}
                {data.clientEmail ? <Text style={s.clientPostal}>{data.clientEmail}</Text> : null}
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

        <HDivider />

        {/* 請求金額 */}
        <View style={s.summaryBox}>
          <View>
            <Text style={s.summaryLabel}>ご請求金額（税込）</Text>
            <Text style={s.summaryAmount}>¥{formatCurrency(total)}</Text>
          </View>
          {data.dueDate ? (
            <View>
              <Text style={s.summaryDueLabel}>お支払い期限</Text>
              <Text style={s.summaryDueValue}>{formatDateJa(data.dueDate)}</Text>
            </View>
          ) : null}
        </View>

        {/* 明細 */}
        <View style={{ marginBottom: 6 }}>
          <View style={s.tableHeaderRow}>
            <Text style={s.thNo}>#</Text>
            <Text style={s.thDesc}>品目・内容</Text>
            <Text style={s.thQty}>数量</Text>
            <Text style={s.thUnit}>単位</Text>
            <Text style={s.thPrice}>単価</Text>
            <Text style={s.thAmount}>金額</Text>
          </View>
          {data.items.map((item, i) => {
            const amount = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
            return (
              <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowEven}>
                <Text style={s.tdNo}>{i + 1}</Text>
                <Text style={s.tdDesc}>{item.description}</Text>
                <Text style={s.tdQty}>{formatCurrency(Number(item.quantity) || 0)}</Text>
                <Text style={s.tdUnit}>{item.unit}</Text>
                <Text style={s.tdPrice}>¥{formatCurrency(Number(item.unitPrice) || 0)}</Text>
                <Text style={s.tdAmount}>¥{formatCurrency(amount)}</Text>
              </View>
            );
          })}
        </View>

        {/* 合計 */}
        <View style={s.totalsWrap}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>{subtotalLabel(data.taxType)}</Text>
            <Text style={s.totalValue}>¥{formatCurrency(subtotal)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>{taxLabel(data.taxType)}</Text>
            <Text style={s.totalValue}>¥{formatCurrency(taxAmount)}</Text>
          </View>
          <View style={s.grandRow}>
            <Text style={s.grandLabel}>合計</Text>
            <Text style={s.grandValue}>¥{formatCurrency(total)}</Text>
          </View>
        </View>

        <HDivider />

        {/* 振込先・備考 */}
        <View style={s.bottomRow}>
          {data.bankName ? (
            <View style={s.bankBox}>
              <Text style={s.bankTitle}>お振込先</Text>
              <Text>{data.bankName}　{data.bankBranch ? `${data.bankBranch}支店` : ''}</Text>
              <Text>{data.accountType}　{data.accountNumber}　{data.accountHolder}</Text>
            </View>
          ) : null}
          <View style={s.notesBox}>
            <Text style={s.notesTitle}>備考</Text>
            <Text style={{ color: MUTED }}>{data.notes || ' '}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
