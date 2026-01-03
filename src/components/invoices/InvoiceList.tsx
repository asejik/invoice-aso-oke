import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { GlassCard } from '../ui/GlassCard';
import { FileText, Download, Share2, CreditCard, Send } from 'lucide-react'; // Added Send, X
import { pdf } from '@react-pdf/renderer';
import { InvoicePDF } from './InvoicePDF';
import { PaymentModal } from './PaymentModal';
import type { Invoice } from '../../types';

export function InvoiceList() {
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // NEW: State for the "Ready to Share" Modal
  const [shareModal, setShareModal] = useState<{ file: File, invoice: any } | null>(null);

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

  // 1. PREPARE STAGE: Generate File
  const handlePrepareShare = async (invoice: any) => {
    setGeneratingId(invoice.id);
    try {
      const business = await db.businessProfile.orderBy('id').first();
      const customer = await db.customers.get(invoice.customerId);

      if (!business || !customer) {
        alert("Missing data!");
        return;
      }

      // Generate Blob
      const blob = await pdf(
        <InvoicePDF invoice={invoice} business={business} customer={customer} />
      ).toBlob();

      // Create File
      const file = new File([blob], `${invoice.invoiceNumber}.pdf`, { type: 'application/pdf' });

      // Open "Confirm Share" Modal
      setShareModal({ file, invoice });

    } catch (error) {
      console.error("Error generating PDF:", error);
      alert(`Error: ${(error as Error).message}`);
    } finally {
      setGeneratingId(null);
    }
  };

  // 2. EXECUTE STAGE: User Clicks "Share Now" (Instant)
  const executeShare = async () => {
    if (!shareModal) return;

    try {
      if (navigator.canShare && navigator.canShare({ files: [shareModal.file] })) {
        await navigator.share({
          files: [shareModal.file],
          title: `Invoice #${shareModal.invoice.invoiceNumber}`,
          text: `Hello, here is your invoice #${shareModal.invoice.invoiceNumber}.`,
        });
      } else {
        alert("Sharing not supported on this device. Downloading instead.");
        const url = URL.createObjectURL(shareModal.file);
        const link = document.createElement('a');
        link.href = url;
        link.download = shareModal.file.name;
        link.click();
      }
    } catch (error) {
      console.error("Share failed/cancelled:", error);
    } finally {
      setShareModal(null); // Close modal after sharing
    }
  };

  // ... (handlePaymentUpdate and handleDownload remain the same) ...
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

      const blob = await pdf(<InvoicePDF invoice={invoice} business={business} customer={customer} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoice.invoiceNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) { console.error(err); } finally { setGeneratingId(null); }
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
                 <button onClick={() => setSelectedInvoice(inv)} className="p-2 hover:bg-green-500/10 rounded-lg text-green-400 transition-colors" title="Record Payment">
                   <CreditCard size={20} />
                 </button>
               )}
               {/* Click 1: Prepare */}
               <button
                 onClick={() => handlePrepareShare(inv)}
                 disabled={generatingId === inv.id}
                 className="p-2 hover:bg-green-500/10 rounded-lg text-green-500 transition-colors"
                 title="Share PDF"
               >
                 {generatingId === inv.id ? (
                    <div className="h-5 w-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                 ) : (
                    <Share2 size={20} />
                 )}
               </button>
               <button onClick={() => handleDownload(inv)} className="p-2 hover:bg-white/10 rounded-lg text-indigo-400 transition-colors" title="Download PDF">
                 <Download size={20} />
               </button>
            </div>
          </GlassCard>
        ))}
      </div>

      {selectedInvoice && (
        <PaymentModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} onSave={handlePaymentUpdate} />
      )}

      {/* NEW: Intermediate Share Modal */}
      {shareModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <GlassCard className="w-full max-w-sm p-6 text-center">
            <div className="mx-auto w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-4 text-green-400">
              <Share2 size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Invoice Ready</h3>
            <p className="text-slate-400 text-sm mb-6">
              PDF generated successfully. Click below to open WhatsApp or other apps.
            </p>

            <div className="space-y-3">
              {/* Click 2: Execute (Instant) */}
              <button
                onClick={executeShare}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-green-500/20 active:scale-95 transition-all"
              >
                <Send size={18} />
                Share Now
              </button>

              <button
                onClick={() => setShareModal(null)}
                className="text-slate-500 hover:text-white text-sm py-2"
              >
                Cancel
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}