import {
  Document,
  Image,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import type { InvoiceData } from '@/lib/types';
import { computeTotals, formatCurrency, formatDateJa, formatPostal } from '@/lib/calculations';
import { registerFonts } from '@/lib/fonts';

registerFonts();

const SEPIA = '#92400e';
const SEPIA_MID = '#b45309';
const CREAM = '#fef3c7';
const DARK = '#451a03';
const MUTED = '#78716c';

const s = StyleSheet.create({
  page: { fontFamily: 'NotoSansJP', fontSize: 9, color: DARK, padding: '16mm 18mm 14mm 18mm', backgroundColor: '#fffbf0' },
  titleArea: { alignItems: 'center', marginBottom: 8 },
  titleMain: { fontSize: 22, fontFamily: 'NotoSansJP', fontWeight: 700, letterSpacing: 10, color: DARK, marginBottom: 2 },
  titleSub: { fontSize: 8, color: SEPIA_MID, letterSpacing: 3 },
  outerBorder: { border: `1.5pt solid ${SEPIA}`, padding: '6pt 10pt', marginBottom: 10 },
  metaRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 },
  metaText: { fontSize: 8, color: MUTED },
  headerRow: { flexDirection: 'row', marginBottom: 12 },
  clientBlock: { flex: 1 },
  issuerBlock: { flex: 1, alignItems: 'flex-end' },
  clientName: { fontSize: 14, fontFamily: 'NotoSansJP', fontWeight: 700, borderBottom: `1pt solid ${SEPIA}`, paddingBottom: 3, marginBottom: 4 },
  honorific: { fontSize: 9, color: MUTED, marginBottom: 4 },
  smallText: { fontSize: 8, color: MUTED, lineHeight: 1.6 },
  issuerName: { fontSize: 11, fontFamily: 'NotoSansJP', fontWeight: 700, marginBottom: 4, textAlign: 'right' },
  issuerText: { fontSize: 8, color: MUTED, lineHeight: 1.7, textAlign: 'right' },
  summaryBox: { backgroundColor: CREAM, border: `1pt solid ${SEPIA}`, padding: '10pt 14pt', marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 9, color: SEPIA_MID },
  summaryAmount: { fontSize: 16, fontFamily: 'NotoSansJP', fontWeight: 700, color: SEPIA },
  summaryDue: { fontSize: 8.5, textAlign: 'right', color: MUTED },
  tableHeader: { flexDirection: 'row', backgroundColor: SEPIA },
  tableRow: { flexDirection: 'row', borderBottom: `0.5pt solid #d6d3d1` },
  tableRowEven: { flexDirection: 'row', borderBottom: `0.5pt solid #d6d3d1`, backgroundColor: CREAM },
  thNo: { width: '5%', padding: '5pt 4pt', color: '#fff', fontSize: 8, textAlign: 'center', fontFamily: 'NotoSansJP', fontWeight: 700 },
  thDesc: { width: '45%', padding: '5pt 6pt', color: '#fff', fontSize: 8, fontFamily: 'NotoSansJP', fontWeight: 700 },
  thQty: { width: '8%', padding: '5pt 4pt', color: '#fff', fontSize: 8, textAlign: 'right', fontFamily: 'NotoSansJP', fontWeight: 700 },
  thUnit: { width: '8%', padding: '5pt 4pt', color: '#fff', fontSize: 8, textAlign: 'center', fontFamily: 'NotoSansJP', fontWeight: 700 },
  thPrice: { width: '17%', padding: '5pt 6pt', color: '#fff', fontSize: 8, textAlign: 'right', fontFamily: 'NotoSansJP', fontWeight: 700 },
  thAmount: { width: '17%', padding: '5pt 6pt', color: '#fff', fontSize: 8, textAlign: 'right', fontFamily: 'NotoSansJP', fontWeight: 700 },
  tdNo: { width: '5%', padding: '5pt 4pt', fontSize: 8, textAlign: 'center', color: MUTED },
  tdDesc: { width: '45%', padding: '5pt 6pt', fontSize: 8 },
  tdQty: { width: '8%', padding: '5pt 4pt', fontSize: 8, textAlign: 'right' },
  tdUnit: { width: '8%', padding: '5pt 4pt', fontSize: 8, textAlign: 'center', color: MUTED },
  tdPrice: { width: '17%', padding: '5pt 6pt', fontSize: 8, textAlign: 'right', color: MUTED },
  tdAmount: { width: '17%', padding: '5pt 6pt', fontSize: 8, textAlign: 'right', fontFamily: 'NotoSansJP', fontWeight: 700 },
  totalsContainer: { alignItems: 'flex-end', marginBottom: 12, marginTop: 4 },
  totalRow: { flexDirection: 'row', width: 200 },
  totalLabel: { width: 100, textAlign: 'right', padding: '3pt 6pt', backgroundColor: CREAM, borderBottom: `0.5pt solid #d6d3d1`, fontSize: 8.5, fontFamily: 'NotoSansJP', fontWeight: 700 },
  totalValue: { width: 100, textAlign: 'right', padding: '3pt 6pt', borderBottom: `0.5pt solid #d6d3d1`, fontSize: 8.5 },
  totalGrandLabel: { width: 100, textAlign: 'right', padding: '4pt 6pt', backgroundColor: SEPIA, color: '#fff', fontSize: 9.5, fontFamily: 'NotoSansJP', fontWeight: 700 },
  totalGrandValue: { width: 100, textAlign: 'right', padding: '4pt 6pt', backgroundColor: SEPIA, color: '#fff', fontSize: 9.5, fontFamily: 'NotoSansJP', fontWeight: 700 },
  bottomRow: { flexDirection: 'column', gap: 8 },
  bankBox: { backgroundColor: CREAM, border: `1pt solid ${SEPIA}`, padding: '8pt 10pt', fontSize: 8.5, lineHeight: 1.8 },
  bankTitle: { fontFamily: 'NotoSansJP', fontWeight: 700, color: SEPIA, marginBottom: 4 },
  notesBox: { border: `1pt solid ${SEPIA}`, padding: '8pt 10pt', fontSize: 8.5, minHeight: 44 },
  notesTitle: { fontFamily: 'NotoSansJP', fontWeight: 700, color: SEPIA, marginBottom: 4 },
});

type Props = { data: InvoiceData; stampDataUrl?: string | null; stampSize?: number };

export function RetroTemplate({ data, stampDataUrl, stampSize = 45 }: Props) {
  const { subtotal, taxAmount, total } = computeTotals(data);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.titleArea}>
          <Text style={s.titleMain}>請 求 書</Text>
          <Text style={s.titleSub}>INVOICE</Text>
        </View>

        <View style={s.outerBorder}>
          <View style={s.metaRow}>
            <Text style={s.metaText}>発行日：{formatDateJa(data.issueDate)}　　No. {data.invoiceNumber}</Text>
          </View>

          <View style={s.headerRow}>
            <View style={s.clientBlock}>
              {data.clientPostal ? <Text style={s.smallText}>〒{formatPostal(data.clientPostal)}</Text> : null}
              {data.clientAddress ? <Text style={{ ...s.smallText, marginBottom: 4 }}>{data.clientAddress}</Text> : null}
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

          <View style={s.summaryBox}>
            <View>
              <Text style={s.summaryLabel}>ご請求金額（税込）</Text>
              <Text style={s.summaryAmount}>¥{formatCurrency(total)}</Text>
            </View>
            {data.dueDate ? <Text style={s.summaryDue}>お支払い期限：{formatDateJa(data.dueDate)}</Text> : null}
          </View>
        </View>

        <View style={{ marginBottom: 4 }}>
          <View style={s.tableHeader}>
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

        <View style={s.totalsContainer}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>小計</Text>
            <Text style={s.totalValue}>¥{formatCurrency(subtotal)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>消費税（10%）</Text>
            <Text style={s.totalValue}>¥{formatCurrency(taxAmount)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={s.totalGrandLabel}>合計</Text>
            <Text style={s.totalGrandValue}>¥{formatCurrency(total)}</Text>
          </View>
        </View>

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
