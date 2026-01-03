import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { Invoice, BusinessProfile, Customer } from '../../types';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#333' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  logo: { width: 100, height: 'auto', objectFit: 'contain', marginBottom: 10 },
  brand: { fontSize: 20, fontWeight: 'bold', textTransform: 'uppercase', color: '#4F46E5' },
  label: { fontSize: 8, color: '#666', marginBottom: 2, textTransform: 'uppercase' },
  value: { fontSize: 10, marginBottom: 8 },

  row: { flexDirection: 'row' },
  col2: { width: '50%' },

  table: { marginTop: 20, borderWidth: 1, borderColor: '#eee' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f9fafb', padding: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  tableRow: { flexDirection: 'row', padding: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  cellDesc: { flex: 2 },
  cellQty: { width: 40, textAlign: 'center' },
  cellPrice: { flex: 1, textAlign: 'right' },
  cellTotal: { flex: 1, textAlign: 'right' },

  totals: { marginTop: 20, alignSelf: 'flex-end', width: '45%' }, // Widened slightly
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  grandTotal: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, borderTopWidth: 1, borderTopColor: '#ccc', paddingTop: 8, fontWeight: 'bold', fontSize: 12 },

  ruleBox: { marginTop: 30, padding: 10, backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1, borderRadius: 4 },
  ruleText: { color: '#DC2626', fontSize: 9, fontWeight: 'bold', textAlign: 'center' },

  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#999', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 }
});

interface PDFProps {
  invoice: Invoice;
  business: BusinessProfile;
  customer: Customer;
}

export const InvoicePDF = ({ invoice, business, customer }: PDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          {business.logoUrl && <Image src={business.logoUrl} style={styles.logo} />}
          <Text style={[styles.brand, { marginTop: 10 }]}>{business.businessName}</Text>
          <Text>{business.address}</Text>
          <Text>{business.phone}</Text>
          <Text>{business.email}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 24, fontWeight: 'light', color: '#ccc' }}>INVOICE</Text>
          <Text style={{ fontSize: 12, marginTop: 4 }}>#{invoice.invoiceNumber}</Text>

          <View style={{ marginTop: 20 }}>
            <Text style={styles.label}>Date Issued</Text>
            <Text style={styles.value}>{new Date(invoice.dateIssued).toLocaleDateString()}</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 1, backgroundColor: '#eee', marginBottom: 20 }} />

      {/* Bill To */}
      <View style={styles.row}>
        <View style={styles.col2}>
          <Text style={styles.label}>Bill To</Text>
          <Text style={{ fontWeight: 'bold', fontSize: 12 }}>{customer.name}</Text>
          <Text>{customer.phone}</Text>
          {customer.address && <Text>{customer.address}</Text>}
          {customer.city && <Text>{customer.city}, {customer.country}</Text>}
        </View>
        <View style={styles.col2}>
          <Text style={styles.label}>Payment Instructions</Text>
          <Text style={{ fontWeight: 'bold' }}>{business.bankName}</Text>
          <Text>{business.accountNumber}</Text>
          <Text>{business.accountName}</Text>
        </View>
      </View>

      {/* Items Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.cellDesc}>Item Description</Text>
          <Text style={styles.cellQty}>Qty</Text>
          <Text style={styles.cellPrice}>Price</Text>
          <Text style={styles.cellTotal}>Total</Text>
        </View>
        {invoice.items.map((item, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.cellDesc}>{item.description}</Text>
            <Text style={styles.cellQty}>{item.quantity}</Text>
            <Text style={styles.cellPrice}>{Number(item.unitPrice).toLocaleString()}</Text>
            <Text style={styles.cellTotal}>{Number(item.total).toLocaleString()}</Text>
          </View>
        ))}
      </View>

      {/* Totals Section with Discount */}
      <View style={styles.totals}>
        <View style={styles.totalRow}>
          <Text>Subtotal:</Text>
          <Text>{invoice.currency} {invoice.subtotal.toLocaleString()}</Text>
        </View>

        {/* Render Discount if it exists */}
        {invoice.discount > 0 && (
          <View style={styles.totalRow}>
            <Text style={{ color: '#ef4444' }}>
              Discount {invoice.discountRate ? `(${invoice.discountRate}%)` : ''}:
            </Text>
            <Text style={{ color: '#ef4444' }}>
              - {invoice.currency} {invoice.discount.toLocaleString()}
            </Text>
          </View>
        )}

        <View style={styles.grandTotal}>
          <Text>Grand Total:</Text>
          <Text>{invoice.currency} {invoice.grandTotal.toLocaleString()}</Text>
        </View>

        {invoice.depositAmount > 0 && (
          <View style={[styles.totalRow, { marginTop: 4 }]}>
            <Text>Amount Paid:</Text>
            <Text>({invoice.currency} {invoice.depositAmount.toLocaleString()})</Text>
          </View>
        )}

        <View style={[styles.totalRow, { marginTop: 8, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 4 }]}>
          <Text style={{ fontWeight: 'bold' }}>Balance Due:</Text>
          <Text style={{ fontWeight: 'bold', color: invoice.grandTotal - invoice.depositAmount > 0 ? '#f97316' : '#22c55e' }}>
            {invoice.currency} {(invoice.grandTotal - invoice.depositAmount).toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Production Rule */}
      <View style={styles.ruleBox}>
        <Text style={styles.ruleText}>
          IMPORTANT: PRODUCTION STARTS ONLY AFTER PAYMENT CONFIRMATION.
        </Text>
        <Text style={[styles.ruleText, { fontWeight: 'normal', marginTop: 2 }]}>
          We do not start work on credit. Thank you for your understanding.
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Generated by {business.businessName} • Thank you for your business!</Text>
      </View>

    </Page>
  </Document>
);