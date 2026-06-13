import {
  Document,
  Image,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import type { InvoiceData } from '@/lib/types';
import { computeTotals, formatCurrency, formatDateJa, formatPostal, taxLabel, subtotalLabel } from '@/lib/calculations';
import { registerFonts } from '@/lib/fonts';

registerFonts();

const AMBER = '#b45309';
const AMBER_MID = '#d97706';
const BEIGE = '#fffbeb';
const DARK = '#1a1a1a';
const MUTED = '#555';

const s = StyleSheet.create({
  page: { fontFamily: 'NotoSansJP', fontSize: 9, color: DARK, padding: '16mm 15mm 14mm 15mm', backgroundColor: BEIGE },
  title: { fontSize: 20, fontFamily: 'NotoSansJP', fontWeight: 700, textAlign: 'center', marginBottom: 22, letterSpacing: 4, borderBottom: `2pt solid ${AMBER}`, paddingBottom: 8, color: AMBER },
  metaRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 },
  metaText: { fontSize: 8.5, color: MUTED },
  headerRow: { flexDirection: 'row', marginBottom: 14 },
  clientBlock: { flex: 1 },
  issuerBlock: { flex: 1, alignItems: 'flex-end' },
  clientName: { fontSize: 14, fontFamily: 'NotoSansJP', fontWeight: 700, borderBottom: `1pt solid ${AMBER}`, paddingBottom: 3, marginBottom: 4 },
  honorific: { fontSize: 9, color: MUTED, marginBottom: 4 },
  smallText: { fontSize: 8, color: '#666', lineHeight: 1.6 },
  issuerText: { fontSize: 8, color: '#333', lineHeight: 1.7, textAlign: 'right' },
  issuerName: { fontSize: 11, fontFamily: 'NotoSansJP', fontWeight: 700, marginBottom: 4, textAlign: 'right' },
  summaryBox: { border: `1pt solid ${AMBER}`, backgroundColor: '#fff', padding: '10pt 14pt', marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 9, color: AMBER_MID },
  summaryAmount: { fontSize: 16, fontFamily: 'NotoSansJP', fontWeight: 700, color: AMBER },
  summaryDue: { fontSize: 8.5, textAlign: 'right', color: MUTED },
  tableHeader: { flexDirection: 'row', backgroundColor: AMBER },
  tableRow: { flexDirection: 'row', borderBottom: `0.5pt solid #d6c39a` },
  tableRowEven: { flexDirection: 'row', borderBottom: `0.5pt solid #d6c39a`, backgroundColor: '#fef9ec' },
  thNo: { width: '5%', padding: '5pt 4pt', color: '#fff', fontSize: 8, textAlign: 'center', fontFamily: 'NotoSansJP', fontWeight: 700 },
  thDesc: { width: '45%', padding: '5pt 6pt', color: '#fff', fontSize: 8, fontFamily: 'NotoSansJP', fontWeight: 700 },
  thQty: { width: '8%', padding: '5pt 4pt', color: '#fff', fontSize: 8, textAlign: 'right', fontFamily: 'NotoSansJP', fontWeight: 700 },
  thUnit: { width: '8%', padding: '5pt 4pt', color: '#fff', fontSize: 8, textAlign: 'center', fontFamily: 'NotoSansJP', fontWeight: 700 },
  thPrice: { width: '17%', padding: '5pt 6pt', color: '#fff', fontSize: 8, textAlign: 'right', fontFamily: 'NotoSansJP', fontWeight: 700 },
  thAmount: { width: '17%', padding: '5pt 6pt', color: '#fff', fontSize: 8, textAlign: 'right', fontFamily: 'NotoSansJP', fontWeight: 700 },
  tdNo: { width: '5%', padding: '5pt 4pt', fontSize: 8, textAlign: 'center', color: '#c4a96a' },
  tdDesc: { width: '45%', padding: '5pt 6pt', fontSize: 8 },
  tdQty: { width: '8%', padding: '5pt 4pt', fontSize: 8, textAlign: 'right' },
  tdUnit: { width: '8%', padding: '5pt 4pt', fontSize: 8, textAlign: 'center', color: MUTED },
  tdPrice: { width: '17%', padding: '5pt 6pt', fontSize: 8, textAlign: 'right', color: MUTED },
  tdAmount: { width: '17%', padding: '5pt 6pt', fontSize: 8, textAlign: 'right', fontFamily: 'NotoSansJP', fontWeight: 700 },
  totalsContainer: { alignItems: 'flex-end', marginBottom: 12, marginTop: 4 },
  totalRow: { flexDirection: 'row', width: 200 },
  totalLabel: { width: 100, textAlign: 'right', padding: '3pt 6pt', backgroundColor: '#fef3c7', borderBottom: `0.5pt solid #d6c39a`, fontSize: 8.5, fontFamily: 'NotoSansJP', fontWeight: 700, color: AMBER },
  totalValue: { width: 100, textAlign: 'right', padding: '3pt 6pt', borderBottom: `0.5pt solid #d6c39a`, fontSize: 8.5 },
  totalGrandLabel: { width: 100, textAlign: 'right', padding: '4pt 6pt', backgroundColor: AMBER, color: '#fff', fontSize: 9.5, fontFamily: 'NotoSansJP', fontWeight: 700 },
  totalGrandValue: { width: 100, textAlign: 'right', padding: '4pt 6pt', backgroundColor: AMBER, color: '#fff', fontSize: 9.5, fontFamily: 'NotoSansJP', fontWeight: 700 },
  bottomRow: { flexDirection: 'column', gap: 8 },
  bankBox: { border: `1pt solid #d6c39a`, padding: '10pt 12pt', fontSize: 8.5, lineHeight: 1.8, backgroundColor: '#fff' },
  bankTitle: { fontFamily: 'NotoSansJP', fontWeight: 700, marginBottom: 4, fontSize: 8.5, color: AMBER },
  notesBox: { border: `1pt solid #d6c39a`, padding: '10pt 12pt', fontSize: 8.5, minHeight: 48, backgroundColor: '#fff' },
  notesTitle: { fontFamily: 'NotoSansJP', fontWeight: 700, marginBottom: 4, fontSize: 8.5, color: AMBER },
});

type Props = { data: InvoiceData; stampDataUrl?: string | null; stampSize?: number };

export function AutumnTemplate({ data, stampDataUrl, stampSize = 45 }: Props) {
  const { subtotal, taxAmount, total } = computeTotals(data);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.title}>請 求 書</Text>

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
            <Text style={s.totalLabel}>{subtotalLabel(data.taxType)}</Text>
            <Text style={s.totalValue}>¥{formatCurrency(subtotal)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>{taxLabel(data.taxType)}</Text>
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
          ) : <View style={{ flex: 1 }} />}
          <View style={s.notesBox}>
            <Text style={s.notesTitle}>備考</Text>
            <Text style={{ color: '#666' }}>{data.notes || ' '}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
