import { Document, Image, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { InvoiceData } from '@/lib/types';
import { computeTotals, formatCurrency, formatDateJa, formatPostal } from '@/lib/calculations';
import { registerFonts } from '@/lib/fonts';

registerFonts();

const s = StyleSheet.create({
  page: { fontFamily: 'NotoSansJP', fontSize: 9, color: '#1a1a1a', padding: '16mm 15mm 14mm 15mm' },
  title: { fontSize: 20, fontFamily: 'NotoSansJP', fontWeight: 700, textAlign: 'center', marginBottom: 22, letterSpacing: 4, borderBottom: '2pt solid #1a1a1a', paddingBottom: 8 },
  metaRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16 },
  metaText: { fontSize: 8.5, color: '#555' },
  clientRow: { marginBottom: 12 },
  clientPostal: { fontSize: 8, color: '#444', marginBottom: 2 },
  clientAddress: { fontSize: 8, color: '#444', marginBottom: 4 },
  clientName: { fontSize: 16, fontFamily: 'NotoSansJP', fontWeight: 700, borderBottom: '1.5pt solid #1a1a1a', paddingBottom: 4, marginBottom: 2 },
  honorific: { fontSize: 9, color: '#555' },
  amountBox: { border: '2pt solid #1a1a1a', padding: '14pt 18pt', marginBottom: 16, alignItems: 'center' },
  amountLabel: { fontSize: 9, color: '#555', marginBottom: 4 },
  amountValue: { fontSize: 28, fontFamily: 'NotoSansJP', fontWeight: 700 },
  confirmText: { fontSize: 9.5, textAlign: 'center', marginBottom: 16, color: '#333' },
  descRow: { marginBottom: 16, padding: '8pt 12pt', backgroundColor: '#f5f5f5' },
  descLabel: { fontSize: 8.5, color: '#666', marginBottom: 2 },
  descText: { fontSize: 10, fontFamily: 'NotoSansJP', fontWeight: 700 },
  breakdownBox: { border: '0.5pt solid #ccc', marginBottom: 20 },
  breakdownRow: { flexDirection: 'row', borderBottom: '0.5pt solid #ccc', padding: '5pt 10pt' },
  breakdownLabel: { flex: 1, fontSize: 8.5 },
  breakdownValue: { fontSize: 8.5, textAlign: 'right' },
  issuerSection: { borderTop: '1pt solid #ccc', paddingTop: 14 },
  issuerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  issuerInfo: { alignItems: 'flex-end' },
  stampBox: { width: 70, height: 70, border: '1pt dashed #aaa', alignItems: 'center', justifyContent: 'center' },
  stampLabel: { fontSize: 8, color: '#aaa', textAlign: 'center', lineHeight: 1.6 },
  issuerName: { fontSize: 13, fontFamily: 'NotoSansJP', fontWeight: 700, marginBottom: 4, textAlign: 'right' },
  issuerText: { fontSize: 8, color: '#333', lineHeight: 1.7, textAlign: 'right' },
  smallText: { fontSize: 8, color: '#444', lineHeight: 1.6 },
  clientSmall: { fontSize: 8, color: '#444', lineHeight: 1.6 },
});

type Props = { data: InvoiceData; stampDataUrl?: string | null; stampSize?: number };

export function ReceiptTemplate({ data, stampDataUrl, stampSize = 64 }: Props) {
  const { subtotal, taxAmount, total } = computeTotals(data);
  const tadashiGaki = data.subject || data.items.filter(i => i.description).map(i => i.description).join('・') || '　';

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.title}>領 収 書</Text>

        <View style={s.metaRow}>
          <Text style={s.metaText}>発行日：{formatDateJa(data.issueDate)}　　No. {data.invoiceNumber}</Text>
        </View>

        <View style={s.clientRow}>
          {data.clientPostal ? <Text style={s.clientPostal}>〒{formatPostal(data.clientPostal)}</Text> : null}
          {data.clientAddress ? <Text style={s.clientAddress}>{data.clientAddress}</Text> : null}
          <Text style={s.clientName}>{data.clientName}</Text>
          <Text style={s.honorific}>{data.clientContact ? `${data.clientContact} 様` : '御中'}</Text>
          {data.clientTel ? <Text style={s.clientSmall}>TEL: {data.clientTel}</Text> : null}
          {data.clientEmail ? <Text style={s.clientSmall}>{data.clientEmail}</Text> : null}
        </View>

        <View style={s.amountBox}>
          <Text style={s.amountLabel}>領収金額（税込）</Text>
          <Text style={s.amountValue}>¥ {formatCurrency(total)}</Text>
        </View>

        <Text style={s.confirmText}>上記の金額正に領収いたしました</Text>

        <View style={s.descRow}>
          <Text style={s.descLabel}>但し書き</Text>
          <Text style={s.descText}>{tadashiGaki} として</Text>
        </View>

        <View style={s.breakdownBox}>
          <View style={s.breakdownRow}>
            <Text style={s.breakdownLabel}>小計</Text>
            <Text style={s.breakdownValue}>¥{formatCurrency(subtotal)}</Text>
          </View>
          <View style={s.breakdownRow}>
            <Text style={s.breakdownLabel}>内消費税（10%）</Text>
            <Text style={s.breakdownValue}>¥{formatCurrency(taxAmount)}</Text>
          </View>
          <View style={{ ...s.breakdownRow, borderBottom: 'none' }}>
            <Text style={{ ...s.breakdownLabel, fontFamily: 'NotoSansJP', fontWeight: 700 }}>合計</Text>
            <Text style={{ ...s.breakdownValue, fontFamily: 'NotoSansJP', fontWeight: 700 }}>¥{formatCurrency(total)}</Text>
          </View>
        </View>

        {data.notes ? (
          <View style={{ marginBottom: 16, padding: '6pt 10pt', border: '0.5pt solid #ccc' }}>
            <Text style={{ fontSize: 8, color: '#555', marginBottom: 2 }}>備考</Text>
            <Text style={{ fontSize: 8.5 }}>{data.notes}</Text>
          </View>
        ) : null}

        <View style={s.issuerSection}>
          <View style={s.issuerRow}>
            <View style={s.stampBox}>
              <Text style={s.stampLabel}>収入{'\n'}印紙</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
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
      </Page>
    </Document>
  );
}
