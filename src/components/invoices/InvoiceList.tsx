import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { GlassCard } from '../ui/GlassCard';
import { FileText, Download } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { InvoicePDF } from './InvoicePDF';
import { useState } from 'react';

export function InvoiceList() {
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  // 1. Fetch Invoices and Join with Customers
  const invoices = useLiveQuery(async () => {
    const allInvoices = await db.invoices.reverse().toArray(); // Newest first
    const allCustomers = await db.customers.toArray();

    // Map customer name to invoice
    return allInvoices.map(inv => {
      const customer = allCustomers.find(c => c.id === inv.customerId);
      return { ...inv, customerName: customer?.name || 'Unknown' };
    });
  });

  // 2. Handle PDF Generation
  const handleDownload = async (invoice: any) => {
    setGeneratingId(invoice.id);
    try {
      // Fetch full data needed for PDF
      const business = await db.businessProfile.orderBy('id').first();
      const customer = await db.customers.get(invoice.customerId);

      if (!business || !customer) {
        alert("Missing business profile or customer data!");
        return;
      }

      // Generate Blob
      const blob = await pdf(
        <InvoicePDF invoice={invoice} business={business} customer={customer} />
      ).toBlob();

      // Force Download using native anchor tag
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoice.invoiceNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to generate PDF");
    } finally {
      setGeneratingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'paid': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'partial': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  if (!invoices?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <FileText size={48} className="mb-4 opacity-20" />
        <p>No invoices created yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Invoices</h1>
        <div className="text-sm text-slate-400">
          Total: {invoices.length}
        </div>
      </div>

      <div className="grid gap-4">
        {invoices.map((inv: any) => (
          <GlassCard key={inv.id} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">

            {/* Left: Info */}
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-full ${getStatusColor(inv.status)}`}>
                <FileText size={20} />
              </div>
              <div>
                <h3 className="text-white font-bold">{inv.customerName}</h3>
                <p className="text-xs text-slate-400">#{inv.invoiceNumber} • {new Date(inv.dateIssued).toLocaleDateString()}</p>
                <div className="mt-1 flex items-center gap-2">
                   <span className={`text-[10px] uppercase px-2 py-0.5 rounded border ${getStatusColor(inv.status)}`}>
                     {inv.status}
                   </span>
                   {inv.status !== 'paid' && (
                     <span className="text-xs font-mono text-slate-300">
                       Due: {inv.currency} {(inv.grandTotal - inv.depositAmount).toLocaleString()}
                     </span>
                   )}
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4 w-full md:w-auto mt-2 md:mt-0">
               <div className="text-right flex-1 md:flex-none">
                 <p className="text-sm text-slate-400">Total</p>
                 <p className="text-lg font-bold text-white">{inv.currency} {inv.grandTotal.toLocaleString()}</p>
               </div>

               <button
                 onClick={() => handleDownload(inv)}
                 disabled={generatingId === inv.id}
                 className="p-2 hover:bg-white/10 rounded-lg text-indigo-400 transition-colors disabled:opacity-50"
                 title="Download PDF"
               >
                 {generatingId === inv.id ? (
                   <div className="h-5 w-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                 ) : (
                   <Download size={20} />
                 )}
               </button>
            </div>

          </GlassCard>
        ))}
      </div>
    </div>
  );
}