import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { GlassCard } from '../ui/GlassCard';
import { FileText, Download, Share2, CreditCard } from 'lucide-react'; // Changed MessageCircle to Share2
import { pdf } from '@react-pdf/renderer';
import { InvoicePDF } from './InvoicePDF';
import { PaymentModal } from './PaymentModal';
import type { Invoice } from '../../types';

export function InvoiceList() {
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // 1. Fetch Invoices and Join with Customers
  const invoices = useLiveQuery(async () => {
    const allInvoices = await db.invoices.reverse().toArray();
    const allCustomers = await db.customers.toArray();

    return allInvoices.map(inv => {
      const customer = allCustomers.find(c => c.id === inv.customerId);
      return {
        ...inv,
        customerName: customer?.name || 'Unknown',
        customerPhone: customer?.phone || ''
      };
    });
  });

  // 2. NATIVE FILE SHARE LOGIC (The Fix)
  const handleShare = async (invoice: any) => {
    setGeneratingId(invoice.id);
    try {
      // A. Gather Data
      const business = await db.businessProfile.orderBy('id').first();
      const customer = await db.customers.get(invoice.customerId);

      if (!business || !customer) {
        alert("Missing business profile or customer data!");
        return;
      }

      // B. Generate PDF Blob
      const blob = await pdf(
        <InvoicePDF invoice={invoice} business={business} customer={customer} />
      ).toBlob();

      // C. Create a File Object
      const file = new File([blob], `${invoice.invoiceNumber}.pdf`, { type: 'application/pdf' });

      // D. Check if Browser Supports File Sharing (Mobile usually does)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Invoice #${invoice.invoiceNumber}`,
          text: `Hello ${customer.name}, here is your invoice from ${business.businessName}.`,
        });
      } else {
        // Fallback for Desktop (or incompatible browsers)
        alert("Your browser does not support direct file sharing. The invoice will download instead, and you can attach it manually.");

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${invoice.invoiceNumber}.pdf`;
        link.click();
      }
    } catch (error) {
      console.error("Error sharing:", error);
      // Don't alert if user just cancelled the share sheet
      if ((error as Error).name !== 'AbortError') {
        alert("Failed to share invoice.");
      }
    } finally {
      setGeneratingId(null);
    }
  };

  const handlePaymentUpdate = async (amountToAdd: number) => {
    if (!selectedInvoice || !selectedInvoice.id) return;

    try {
      const newDeposit = selectedInvoice.depositAmount + amountToAdd;
      const isPaid = newDeposit >= selectedInvoice.grandTotal;
      const isPartial = newDeposit > 0 && newDeposit < selectedInvoice.grandTotal;
      const newStatus = isPaid ? 'paid' : (isPartial ? 'partial' : 'pending');

      await db.invoices.update(selectedInvoice.id, {
        depositAmount: newDeposit,
        status: newStatus,
        updatedAt: new Date()
      });
      setSelectedInvoice(null);
    } catch (error) {
      console.error("Payment update failed", error);
    }
  };

  const handleDownload = async (invoice: any) => {
    setGeneratingId(invoice.id);
    try {
      const business = await db.businessProfile.orderBy('id').first();
      const customer = await db.customers.get(invoice.customerId);

      if (!business || !customer) return;

      const blob = await pdf(
        <InvoicePDF invoice={invoice} business={business} customer={customer} />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoice.invoiceNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
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
        <div className="text-sm text-slate-400">Total: {invoices.length}</div>
      </div>

      <div className="grid gap-4">
        {invoices.map((inv: any) => (
          <GlassCard key={inv.id} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group">

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

            <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0 justify-end">

               {inv.status !== 'paid' && (
                 <button
                   onClick={() => setSelectedInvoice(inv)}
                   className="p-2 hover:bg-green-500/10 rounded-lg text-green-400 transition-colors"
                   title="Record Payment"
                 >
                   <CreditCard size={20} />
                 </button>
               )}

               {/* SMART SHARE BUTTON */}
               <button
                 onClick={() => handleShare(inv)}
                 disabled={generatingId === inv.id}
                 className="p-2 hover:bg-green-500/10 rounded-lg text-green-500 transition-colors"
                 title="Share PDF (WhatsApp)"
               >
                 {generatingId === inv.id ? (
                    <div className="h-5 w-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                 ) : (
                    <Share2 size={20} />
                 )}
               </button>

               <button
                 onClick={() => handleDownload(inv)}
                 className="p-2 hover:bg-white/10 rounded-lg text-indigo-400 transition-colors"
                 title="Download PDF"
               >
                 <Download size={20} />
               </button>
            </div>

          </GlassCard>
        ))}
      </div>

      {selectedInvoice && (
        <PaymentModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onSave={handlePaymentUpdate}
        />
      )}
    </div>
  );
}