import { Document, Image, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { InvoiceData } from '@/lib/types';
import { computeTotals, formatCurrency, formatDateJa, formatPostal } from '@/lib/calculations';
import { registerFonts } from '@/lib/fonts';

registerFonts();

const s = StyleSheet.create({
  page: { fontFamily: 'NotoSansJP', fontSize: 9, color: '#1a1a1a', padding: '16mm 15mm 14mm 15mm' },
  title: { fontSize: 20, fontFamily: 'NotoSansJP', fontWeight: 700, textAlign: 'center', marginBottom: 22, letterSpacing: 4, borderBottom: '2pt solid #1a1a1a', paddingBottom: 8 },
  metaRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 },
  metaText: { fontSize: 8.5, color: '#555' },
  headerRow: { flexDirection: 'row', marginBottom: 14 },
  clientBlock: { flex: 1 },
  issuerBlock: { flex: 1, alignItems: 'flex-end' },
  clientName: { fontSize: 14, fontFamily: 'NotoSansJP', fontWeight: 700, borderBottom: '1pt solid #1a1a1a', paddingBottom: 3, marginBottom: 4 },
  honorific: { fontSize: 9, color: '#555', marginBottom: 4 },
  smallText: { fontSize: 8, color: '#444', lineHeight: 1.6 },
  issuerText: { fontSize: 8, color: '#333', lineHeight: 1.7, textAlign: 'right' },
  issuerName: { fontSize: 11, fontFamily: 'NotoSansJP', fontWeight: 700, marginBottom: 4, textAlign: 'right' },
  subjectRow: { marginBottom: 12, padding: '6pt 10pt', backgroundColor: '#f5f5f5', borderLeft: '3pt solid #1a1a1a' },
  subjectText: { fontSize: 9, fontFamily: 'NotoSansJP', fontWeight: 700 },
  summaryBox: { border: '1pt solid #1a1a1a', padding: '10pt 14pt', marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 9, color: '#555' },
  summaryAmount: { fontSize: 16, fontFamily: 'NotoSansJP', fontWeight: 700 },
  summaryDue: { fontSize: 8.5, textAlign: 'right' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1a1a1a' },
  tableRow: { flexDirection: 'row', borderBottom: '0.5pt solid #ccc' },
  tableRowEven: { flexDirection: 'row', borderBottom: '0.5pt solid #ccc', backgroundColor: '#f5f5f5' },
  thNo: { width: '5%', padding: '5pt 4pt', color: '#fff', fontSize: 8, textAlign: 'center', fontFamily: 'NotoSansJP', fontWeight: 700 },
  thDesc: { width: '45%', padding: '5pt 6pt', color: '#fff', fontSize: 8, fontFamily: 'NotoSansJP', fontWeight: 700 },
  thQty: { width: '8%', padding: '5pt 4pt', color: '#fff', fontSize: 8, textAlign: 'right', fontFamily: 'NotoSansJP', fontWeight: 700 },
  thUnit: { width: '8%', padding: '5pt 4pt', color: '#fff', fontSize: 8, textAlign: 'center', fontFamily: 'NotoSansJP', fontWeight: 700 },
  thPrice: { width: '17%', padding: '5pt 6pt', color: '#fff', fontSize: 8, textAlign: 'right', fontFamily: 'NotoSansJP', fontWeight: 700 },
  thAmount: { width: '17%', padding: '5pt 6pt', color: '#fff', fontSize: 8, textAlign: 'right', fontFamily: 'NotoSansJP', fontWeight: 700 },
  tdNo: { width: '5%', padding: '5pt 4pt', fontSize: 8, textAlign: 'center' },
  tdDesc: { width: '45%', padding: '5pt 6pt', fontSize: 8 },
  tdQty: { width: '8%', padding: '5pt 4pt', fontSize: 8, textAlign: 'right' },
  tdUnit: { width: '8%', padding: '5pt 4pt', fontSize: 8, textAlign: 'center' },
  tdPrice: { width: '17%', padding: '5pt 6pt', fontSize: 8, textAlign: 'right' },
  tdAmount: { width: '17%', padding: '5pt 6pt', fontSize: 8, textAlign: 'right' },
  totalsContainer: { alignItems: 'flex-end', marginBottom: 12, marginTop: 4 },
  totalRow: { flexDirection: 'row', width: 200 },
  totalLabel: { width: 100, textAlign: 'right', padding: '3pt 6pt', backgroundColor: '#f0f0f0', borderBottom: '0.5pt solid #ccc', fontSize: 8.5, fontFamily: 'NotoSansJP', fontWeight: 700 },
  totalValue: { width: 100, textAlign: 'right', padding: '3pt 6pt', borderBottom: '0.5pt solid #ccc', fontSize: 8.5 },
  totalGrandLabel: { width: 100, textAlign: 'right', padding: '4pt 6pt', backgroundColor: '#1a1a1a', color: '#fff', fontSize: 9.5, fontFamily: 'NotoSansJP', fontWeight: 700 },
  totalGrandValue: { width: 100, textAlign: 'right', padding: '4pt 6pt', backgroundColor: '#1a1a1a', color: '#fff', fontSize: 9.5, fontFamily: 'NotoSansJP', fontWeight: 700 },
  notesBox: { border: '1pt solid #ccc', padding: '10pt 12pt', fontSize: 8.5, minHeight: 48 },
  notesTitle: { fontFamily: 'NotoSansJP', fontWeight: 700, marginBottom: 4, fontSize: 8.5 },
});

type Props = { data: InvoiceData; stampDataUrl?: string | null; stampSize?: number };

export function EstimateTemplate({ data, stampDataUrl, stampSize = 64 }: Props) {
  const { subtotal, taxAmount, total } = computeTotals(data);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.title}>見 積 書</Text>

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

        {data.subject ? (
          <View style={s.subjectRow}>
            <Text style={s.subjectText}>件名：{data.subject}</Text>
          </View>
        ) : null}

        <View style={s.summaryBox}>
          <View>
            <Text style={s.summaryLabel}>お見積金額（税込）</Text>
            <Text style={s.summaryAmount}>¥{formatCurrency(total)}</Text>
          </View>
          {data.dueDate ? <Text style={s.summaryDue}>見積有効期限：{formatDateJa(data.dueDate)}</Text> : null}
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

        <View style={s.notesBox}>
          <Text style={s.notesTitle}>備考</Text>
          <Text style={{ color: '#444' }}>{data.notes || ' '}</Text>
        </View>
      </Page>
    </Document>
  );
}
