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

const BLUE = '#1a56db';
const LIGHT_BLUE = '#eff6ff';
const DARK = '#1e293b';

const s = StyleSheet.create({
  page: { fontFamily: 'NotoSansJP', fontSize: 9, color: DARK, padding: 0 },
  topBar: { backgroundColor: BLUE, padding: '18pt 20pt 14pt 20pt', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  titleText: { fontSize: 26, fontFamily: 'NotoSansJP', fontWeight: 700, color: '#fff', letterSpacing: 3 },
  topMeta: { alignItems: 'flex-end' },
  topMetaLabel: { fontSize: 7.5, color: 'rgba(255,255,255,0.75)', marginBottom: 2 },
  topMetaValue: { fontSize: 9.5, color: '#fff', fontFamily: 'NotoSansJP', fontWeight: 700 },
  body: { padding: '14pt 20pt' },
  partiesRow: { flexDirection: 'row', marginBottom: 12, gap: 16 },
  clientBlock: { flex: 1 },
  clientNameWrap: { borderLeft: `3pt solid ${BLUE}`, paddingLeft: 8, marginBottom: 4 },
  clientName: { fontSize: 14, fontFamily: 'NotoSansJP', fontWeight: 700 },
  honorific: { fontSize: 8.5, color: '#64748b' },
  smallText: { fontSize: 8, color: '#475569', lineHeight: 1.6 },
  issuerBlock: { flex: 1, alignItems: 'flex-end' },
  issuerName: { fontSize: 11, fontFamily: 'NotoSansJP', fontWeight: 700, marginBottom: 3, textAlign: 'right' },
  issuerText: { fontSize: 8, color: '#475569', lineHeight: 1.7, textAlign: 'right' },
  amountCard: { backgroundColor: LIGHT_BLUE, borderLeft: `4pt solid ${BLUE}`, padding: '10pt 16pt', marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 4 },
  amountLabel: { fontSize: 8.5, color: '#64748b', marginBottom: 3 },
  amountValue: { fontSize: 20, fontFamily: 'NotoSansJP', fontWeight: 700, color: BLUE },
  amountDue: { alignItems: 'flex-end' },
  amountDueLabel: { fontSize: 8, color: '#64748b', marginBottom: 2 },
  amountDueValue: { fontSize: 9.5, fontFamily: 'NotoSansJP', fontWeight: 700 },
  tableHeader: { flexDirection: 'row', backgroundColor: BLUE, borderRadius: 3, marginBottom: 2 },
  tableRow: { flexDirection: 'row', borderBottom: `0.5pt solid #e2e8f0` },
  tableRowEven: { flexDirection: 'row', borderBottom: `0.5pt solid #e2e8f0`, backgroundColor: '#f8fafc' },
  thNo: { width: '5%', padding: '5pt 4pt', color: '#fff', fontSize: 8, textAlign: 'center', fontFamily: 'NotoSansJP', fontWeight: 700 },
  thDesc: { width: '45%', padding: '5pt 8pt', color: '#fff', fontSize: 8, fontFamily: 'NotoSansJP', fontWeight: 700 },
  thQty: { width: '8%', padding: '5pt 4pt', color: '#fff', fontSize: 8, textAlign: 'right', fontFamily: 'NotoSansJP', fontWeight: 700 },
  thUnit: { width: '8%', padding: '5pt 4pt', color: '#fff', fontSize: 8, textAlign: 'center', fontFamily: 'NotoSansJP', fontWeight: 700 },
  thPrice: { width: '17%', padding: '5pt 8pt', color: '#fff', fontSize: 8, textAlign: 'right', fontFamily: 'NotoSansJP', fontWeight: 700 },
  thAmount: { width: '17%', padding: '5pt 8pt', color: '#fff', fontSize: 8, textAlign: 'right', fontFamily: 'NotoSansJP', fontWeight: 700 },
  tdNo: { width: '5%', padding: '4pt 4pt', fontSize: 8, textAlign: 'center', color: '#94a3b8' },
  tdDesc: { width: '45%', padding: '4pt 8pt', fontSize: 8 },
  tdQty: { width: '8%', padding: '4pt 4pt', fontSize: 8, textAlign: 'right' },
  tdUnit: { width: '8%', padding: '4pt 4pt', fontSize: 8, textAlign: 'center', color: '#64748b' },
  tdPrice: { width: '17%', padding: '4pt 8pt', fontSize: 8, textAlign: 'right' },
  tdAmount: { width: '17%', padding: '4pt 8pt', fontSize: 8, textAlign: 'right', fontFamily: 'NotoSansJP', fontWeight: 700 },
  totalsWrap: { alignItems: 'flex-end', marginBottom: 14 },
  totalRow: { flexDirection: 'row', width: 220, marginBottom: 1 },
  totalLabel: { width: 110, textAlign: 'right', padding: '3pt 8pt', fontSize: 8.5, color: '#64748b' },
  totalValue: { width: 110, textAlign: 'right', padding: '3pt 8pt', fontSize: 8.5 },
  totalDivider: { width: 220, borderBottom: `1pt solid ${BLUE}`, marginBottom: 2 },
  grandRow: { flexDirection: 'row', width: 220, backgroundColor: BLUE, borderRadius: 3 },
  grandLabel: { width: 110, textAlign: 'right', padding: '5pt 8pt', color: '#fff', fontSize: 10, fontFamily: 'NotoSansJP', fontWeight: 700 },
  grandValue: { width: 110, textAlign: 'right', padding: '5pt 8pt', color: '#fff', fontSize: 10, fontFamily: 'NotoSansJP', fontWeight: 700 },
  bottomRow: { flexDirection: 'row', gap: 10 },
  bankBox: { flex: 1, backgroundColor: '#f8fafc', border: `1pt solid #e2e8f0`, padding: '8pt 10pt', borderRadius: 3, fontSize: 8.5, lineHeight: 1.7 },
  bankTitle: { fontFamily: 'NotoSansJP', fontWeight: 700, color: BLUE, marginBottom: 4 },
  notesBox: { flex: 1, border: `1pt solid #e2e8f0`, padding: '8pt 10pt', borderRadius: 3, fontSize: 8.5, minHeight: 50 },
  notesTitle: { fontFamily: 'NotoSansJP', fontWeight: 700, color: BLUE, marginBottom: 4 },
});

type Props = { data: InvoiceData; stampDataUrl?: string | null; stampSize?: number };

export function ModernTemplate({ data, stampDataUrl, stampSize = 64 }: Props) {
  const { subtotal, taxAmount, total } = computeTotals(data);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* 上部ブルーバー */}
        <View style={s.topBar}>
          <Text style={s.titleText}>INVOICE</Text>
          <View style={s.topMeta}>
            <Text style={s.topMetaLabel}>発行日</Text>
            <Text style={s.topMetaValue}>{formatDateJa(data.issueDate)}</Text>
            <Text style={{ ...s.topMetaLabel, marginTop: 4 }}>請求書番号</Text>
            <Text style={s.topMetaValue}>{data.invoiceNumber}</Text>
          </View>
        </View>

        <View style={s.body}>
          {/* 取引先・発行者 */}
          <View style={s.partiesRow}>
            <View style={s.clientBlock}>
              {data.clientPostal ? <Text style={s.smallText}>〒{formatPostal(data.clientPostal)}</Text> : null}
              {data.clientAddress ? <Text style={{ ...s.smallText, marginBottom: 5 }}>{data.clientAddress}</Text> : null}
              {data.clientDept ? <Text style={s.smallText}>{data.clientDept}</Text> : null}
              <View style={s.clientNameWrap}>
                <Text style={s.clientName}>{data.clientName}</Text>
                <Text style={s.honorific}>{data.clientContact ? `${data.clientContact} 様` : '御中'}</Text>
                {data.clientTel ? <Text style={s.smallText}>TEL: {data.clientTel}</Text> : null}
                {data.clientEmail ? <Text style={s.smallText}>{data.clientEmail}</Text> : null}
              </View>
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

          {/* 請求金額 */}
          <View style={s.amountCard}>
            <View>
              <Text style={s.amountLabel}>ご請求金額（税込）</Text>
              <Text style={s.amountValue}>¥{formatCurrency(total)}</Text>
            </View>
            {data.dueDate ? (
              <View style={s.amountDue}>
                <Text style={s.amountDueLabel}>お支払い期限</Text>
                <Text style={s.amountDueValue}>{formatDateJa(data.dueDate)}</Text>
              </View>
            ) : null}
          </View>

          {/* 明細テーブル */}
          <View style={{ marginBottom: 8 }}>
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
            <View style={s.totalDivider} />
            <View style={s.grandRow}>
              <Text style={s.grandLabel}>合計</Text>
              <Text style={s.grandValue}>¥{formatCurrency(total)}</Text>
            </View>
          </View>

          {/* 振込先・備考 */}
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
              <Text style={{ fontSize: 8.5, color: '#475569' }}>{data.notes || ' '}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
