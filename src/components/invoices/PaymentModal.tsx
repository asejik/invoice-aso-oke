import { useForm } from 'react-hook-form';
import { GlassCard } from '../ui/GlassCard';
import { X, Save } from 'lucide-react';
import type { Invoice } from '../../types';

interface Props {
  invoice: Invoice;
  onClose: () => void;
  onSave: (amountToAdd: number) => void;
}

export function PaymentModal({ invoice, onClose, onSave }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<{ amount: number }>();

  const balanceDue = invoice.grandTotal - invoice.depositAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <GlassCard className="w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-white mb-1">Record Payment</h2>
        <p className="text-sm text-slate-400 mb-6">Update payment for Invoice #{invoice.invoiceNumber}</p>

        <div className="space-y-4 mb-6">
          <div className="flex justify-between text-sm p-3 bg-white/5 rounded-lg border border-white/5">
            <span className="text-slate-400">Total Invoice:</span>
            <span className="text-white font-medium">{invoice.currency} {invoice.grandTotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm p-3 bg-white/5 rounded-lg border border-white/5">
            <span className="text-slate-400">Already Paid:</span>
            <span className="text-green-400 font-medium">{invoice.currency} {invoice.depositAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
            <span className="text-orange-200">Balance Due:</span>
            <span className="text-orange-400 font-bold">{invoice.currency} {balanceDue.toLocaleString()}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit((data) => onSave(Number(data.amount)))}>
          <label className="block text-xs font-medium text-slate-400 mb-1 uppercase">Amount Receiving Now</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
              {invoice.currency === 'NGN' ? '₦' : invoice.currency === 'USD' ? '$' : invoice.currency === 'GBP' ? '£' : '€'}
            </span>
            <input
              type="number"
              {...register('amount', {
                required: true,
                min: 1,
                max: { value: balanceDue, message: "Cannot exceed balance" }
              })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-8 text-white focus:outline-none focus:border-indigo-500 transition-all text-lg font-bold"
              placeholder="0.00"
              autoFocus
            />
          </div>
          {errors.amount && <span className="text-red-400 text-xs mt-1">{errors.amount.message}</span>}

          {/* Helper Buttons */}
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => {
                const input = document.querySelector('input[name="amount"]') as HTMLInputElement;
                if(input) {
                   input.value = balanceDue.toString();
                   input.dispatchEvent(new Event('input', { bubbles: true }));
                   input.focus();
                }
              }}
              className="text-xs bg-white/5 hover:bg-white/10 text-indigo-300 px-2 py-1 rounded transition-colors"
            >
              Pay Full Balance
            </button>
          </div>

          <button
            type="submit"
            className="w-full mt-6 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-green-500/20 transition-all"
          >
            <Save size={18} />
            Confirm Payment
          </button>
        </form>
      </GlassCard>
    </div>
  );
}