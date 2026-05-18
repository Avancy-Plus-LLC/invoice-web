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

const GREEN = '#065f46';
const GREEN_MID = '#047857';
const GREEN_LIGHT = '#ecfdf5';
const GOLD = '#b45309';
const DARK = '#1c1917';
const MUTED = '#78716c';

const s = StyleSheet.create({
  page: { fontFamily: 'NotoSansJP', fontSize: 9, color: DARK, padding: 0 },
  sidebar: { position: 'absolute', top: 0, left: 0, width: '32%', height: '100%', backgroundColor: GREEN },
  mainArea: { marginLeft: '32%', padding: '18pt 20pt 18pt 22pt' },

  sideContent: { padding: '24pt 16pt' },
  sideTitle: { fontSize: 22, fontFamily: 'NotoSansJP', fontWeight: 700, color: '#fff', letterSpacing: 3, marginBottom: 4 },
  sideTitleJa: { fontSize: 9, color: 'rgba(255,255,255,0.6)', letterSpacing: 2, marginBottom: 28 },
  sideLabel: { fontSize: 7, color: 'rgba(255,255,255,0.55)', letterSpacing: 1, marginBottom: 3, marginTop: 12 },
  sideValue: { fontSize: 9, color: '#fff', fontFamily: 'NotoSansJP', fontWeight: 700 },
  sideDivider: { borderBottom: '0.5pt solid rgba(255,255,255,0.2)', marginTop: 20, marginBottom: 16 },
  sideIssuerLabel: { fontSize: 7, color: 'rgba(255,255,255,0.55)', letterSpacing: 1, marginBottom: 6 },
  sideIssuerName: { fontSize: 10, fontFamily: 'NotoSansJP', fontWeight: 700, color: '#fff', marginBottom: 4 },
  sideIssuerText: { fontSize: 7.5, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8 },

  clientSection: { marginBottom: 16 },
  clientPostal: { fontSize: 8, color: MUTED, marginBottom: 2 },
  clientAddress: { fontSize: 8, color: MUTED, marginBottom: 6 },
  clientDept: { fontSize: 8, color: MUTED, marginBottom: 2 },
  clientName: { fontSize: 16, fontFamily: 'NotoSansJP', fontWeight: 700, borderBottom: `1.5pt solid ${GREEN}`, paddingBottom: 4, marginBottom: 3 },
  honorific: { fontSize: 8.5, color: MUTED },

  amountBox: { backgroundColor: GREEN_LIGHT, borderLeft: `4pt solid ${GREEN}`, padding: '10pt 14pt', marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amountLabel: { fontSize: 8, color: GREEN_MID, marginBottom: 3, letterSpacing: 0.5 },
  amountValue: { fontSize: 20, fontFamily: 'NotoSansJP', fontWeight: 700, color: GREEN },
  amountDue: { alignItems: 'flex-end' },
  amountDueLabel: { fontSize: 7.5, color: MUTED, marginBottom: 2 },
  amountDueValue: { fontSize: 9.5, fontFamily: 'NotoSansJP', fontWeight: 700 },

  tableHeader: { flexDirection: 'row', backgroundColor: GREEN, borderRadius: 2, marginBottom: 2 },
  tableRow: { flexDirection: 'row', borderBottom: `0.5pt solid #e7e5e4` },
  tableRowEven: { flexDirection: 'row', borderBottom: `0.5pt solid #e7e5e4`, backgroundColor: '#fafaf9' },
  thNo: { width: '5%', padding: '5pt 4pt', color: '#fff', fontSize: 7.5, textAlign: 'center', fontFamily: 'NotoSansJP', fontWeight: 700 },
  thDesc: { width: '45%', padding: '5pt 8pt', color: '#fff', fontSize: 7.5, fontFamily: 'NotoSansJP', fontWeight: 700 },
  thQty: { width: '8%', padding: '5pt 4pt', color: '#fff', fontSize: 7.5, textAlign: 'right', fontFamily: 'NotoSansJP', fontWeight: 700 },
  thUnit: { width: '8%', padding: '5pt 4pt', color: '#fff', fontSize: 7.5, textAlign: 'center', fontFamily: 'NotoSansJP', fontWeight: 700 },
  thPrice: { width: '17%', padding: '5pt 8pt', color: '#fff', fontSize: 7.5, textAlign: 'right', fontFamily: 'NotoSansJP', fontWeight: 700 },
  thAmount: { width: '17%', padding: '5pt 8pt', color: '#fff', fontSize: 7.5, textAlign: 'right', fontFamily: 'NotoSansJP', fontWeight: 700 },
  tdNo: { width: '5%', padding: '4pt 4pt', fontSize: 8, textAlign: 'center', color: '#a8a29e' },
  tdDesc: { width: '45%', padding: '4pt 8pt', fontSize: 8 },
  tdQty: { width: '8%', padding: '4pt 4pt', fontSize: 8, textAlign: 'right' },
  tdUnit: { width: '8%', padding: '4pt 4pt', fontSize: 8, textAlign: 'center', color: MUTED },
  tdPrice: { width: '17%', padding: '4pt 8pt', fontSize: 8, textAlign: 'right', color: MUTED },
  tdAmount: { width: '17%', padding: '4pt 8pt', fontSize: 8, textAlign: 'right', fontFamily: 'NotoSansJP', fontWeight: 700 },

  totalsWrap: { alignItems: 'flex-end', marginTop: 8, marginBottom: 14 },
  totalRow: { flexDirection: 'row', width: 210 },
  totalLabel: { width: 110, textAlign: 'right', padding: '3pt 8pt', fontSize: 8.5, color: MUTED },
  totalValue: { width: 100, textAlign: 'right', padding: '3pt 8pt', fontSize: 8.5 },
  totalDivider: { width: 210, borderBottom: `1pt solid ${GOLD}`, marginBottom: 2 },
  grandRow: { flexDirection: 'row', width: 210, backgroundColor: GREEN, borderRadius: 2 },
  grandLabel: { width: 110, textAlign: 'right', padding: '5pt 8pt', color: '#fff', fontSize: 10, fontFamily: 'NotoSansJP', fontWeight: 700 },
  grandValue: { width: 100, textAlign: 'right', padding: '5pt 8pt', color: '#fff', fontSize: 10, fontFamily: 'NotoSansJP', fontWeight: 700 },

  bottomRow: { flexDirection: 'column', gap: 8 },
  bankBox: { backgroundColor: '#fafaf9', border: `1pt solid #e7e5e4`, padding: '8pt 10pt', borderRadius: 2, fontSize: 8.5, lineHeight: 1.8 },
  bankTitle: { fontFamily: 'NotoSansJP', fontWeight: 700, color: GREEN, marginBottom: 4, fontSize: 8.5 },
  notesBox: { border: `1pt solid #e7e5e4`, padding: '8pt 10pt', borderRadius: 2, fontSize: 8.5, minHeight: 44 },
  notesTitle: { fontFamily: 'NotoSansJP', fontWeight: 700, color: GREEN, marginBottom: 4, fontSize: 8.5 },
});

type Props = { data: InvoiceData; stampDataUrl?: string | null; stampSize?: number };

export function ElegantTemplate({ data, stampDataUrl, stampSize = 64 }: Props) {
  const { subtotal, taxAmount, total } = computeTotals(data);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* サイドバー */}
        <View style={s.sidebar}>
          <View style={s.sideContent}>
            <Text style={s.sideTitle}>INVOICE</Text>
            <Text style={s.sideTitleJa}>請 求 書</Text>

            <Text style={s.sideLabel}>発行日</Text>
            <Text style={s.sideValue}>{formatDateJa(data.issueDate)}</Text>
            <Text style={s.sideLabel}>請求書番号</Text>
            <Text style={s.sideValue}>{data.invoiceNumber}</Text>

            <View style={s.sideDivider} />

            <Text style={s.sideIssuerLabel}>発行者</Text>
            <Text style={s.sideIssuerName}>{data.issuerName}</Text>
            {data.issuerPostal ? <Text style={s.sideIssuerText}>〒{formatPostal(data.issuerPostal)}</Text> : null}
            {data.issuerAddress ? <Text style={s.sideIssuerText}>{data.issuerAddress}</Text> : null}
            {data.issuerTel ? <Text style={s.sideIssuerText}>TEL: {data.issuerTel}</Text> : null}
            {data.issuerEmail ? <Text style={s.sideIssuerText}>{data.issuerEmail}</Text> : null}
            {data.issuerInvoiceNumber ? <Text style={s.sideIssuerText}>登録番号：{data.issuerInvoiceNumber}</Text> : null}
            {stampDataUrl ? <Image src={stampDataUrl} style={{ width: stampSize * 0.8, height: stampSize * 0.8, marginTop: 8 }} /> : null}
          </View>
        </View>

        {/* メインエリア */}
        <View style={s.mainArea}>
          {/* 取引先 */}
          <View style={s.clientSection}>
            {data.clientPostal ? <Text style={s.clientPostal}>〒{formatPostal(data.clientPostal)}</Text> : null}
            {data.clientAddress ? <Text style={s.clientAddress}>{data.clientAddress}</Text> : null}
            {data.clientDept ? <Text style={s.clientDept}>{data.clientDept}</Text> : null}
            <Text style={s.clientName}>{data.clientName}</Text>
            <Text style={s.honorific}>{data.clientContact ? `${data.clientContact} 様` : '御中'}</Text>
                {data.clientTel ? <Text style={s.clientPostal}>TEL: {data.clientTel}</Text> : null}
                {data.clientEmail ? <Text style={s.clientPostal}>{data.clientEmail}</Text> : null}
          </View>

          {/* 請求金額 */}
          <View style={s.amountBox}>
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

          {/* 明細 */}
          <View style={{ marginBottom: 6 }}>
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
              <Text style={s.totalLabel}>小計</Text>
              <Text style={s.totalValue}>¥{formatCurrency(subtotal)}</Text>
            </View>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>消費税（10%）</Text>
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
            ) : null}
            <View style={s.notesBox}>
              <Text style={s.notesTitle}>備考</Text>
              <Text style={{ color: '#57534e' }}>{data.notes || ' '}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
