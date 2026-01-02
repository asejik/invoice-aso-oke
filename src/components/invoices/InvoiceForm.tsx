import { useEffect, useMemo } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { GlassCard } from '../ui/GlassCard';
import { Save, Plus, Trash2, Calculator, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';
import type { Invoice, CurrencyCode } from '../../types';

interface Props {
  onComplete: () => void;
  onCancel: () => void;
}

// Helper for currency symbols
const CURRENCIES: Record<CurrencyCode, string> = {
  NGN: '₦', USD: '$', GBP: '£', EUR: '€'
};

export function InvoiceForm({ onComplete, onCancel }: Props) {
  // 1. Fetch Customers for the Dropdown
  const customers = useLiveQuery(() => db.customers.toArray());

  // 2. Setup Form
  const { register, control, handleSubmit, setValue, formState: { errors } } = useForm<any>({
    defaultValues: {
      currency: 'NGN',
      invoiceNumber: `INV-${Date.now().toString().slice(-4)}`, // Simple auto-gen
      items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
      depositAmount: 0,
      dateIssued: new Date().toISOString().split('T')[0],
      customerId: ''
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  // 3. Real-time Calculations (The "Excel" Logic)
  const items = useWatch({ control, name: "items" });
  const deposit = useWatch({ control, name: "depositAmount" });
  const currency = useWatch({ control, name: "currency" });

  const totals = useMemo(() => {
    const subtotal = items.reduce((acc: number, item: any) => {
      return acc + (Number(item.quantity) * Number(item.unitPrice));
    }, 0);
    const grandTotal = subtotal; // Add tax logic here later if needed
    const balance = grandTotal - Number(deposit || 0);

    return { subtotal, grandTotal, balance };
  }, [items, deposit]);

  // 4. Submit Logic
  const onSubmit = async (data: any) => {
    try {
      if (!data.customerId) {
        alert("Please select a customer");
        return;
      }

      const invoiceData: Invoice = {
        id: crypto.randomUUID(),
        customerId: data.customerId,
        invoiceNumber: data.invoiceNumber,
        items: data.items.map((item: any) => ({
          ...item,
          id: crypto.randomUUID(),
          total: item.quantity * item.unitPrice
        })),
        subtotal: totals.subtotal,
        discount: 0,
        tax: 0,
        grandTotal: totals.grandTotal,
        depositAmount: Number(data.depositAmount),
        currency: data.currency,
        status: totals.balance <= 0 ? 'paid' : (data.depositAmount > 0 ? 'partial' : 'pending'),
        dateIssued: new Date(data.dateIssued),
        isSynced: false,
        updatedAt: new Date()
      };

      await db.invoices.add(invoiceData);
      onComplete(); // Go back to list
    } catch (err) {
      console.error(err);
      alert("Failed to save invoice");
    }
  };

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all text-sm";
  const labelClass = "block text-xs font-medium text-slate-400 mb-1 uppercase";

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full text-slate-400 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-white">New Invoice</h2>
          <p className="text-slate-400 text-sm">Create a new order for production.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Section 1: Meta Data & Customer */}
        <GlassCard className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Currency</label>
              <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                {(Object.keys(CURRENCIES) as CurrencyCode[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setValue('currency', c)}
                    className={clsx(
                      "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
                      currency === c ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Invoice #</label>
              <input {...register('invoiceNumber')} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Date</label>
              <input type="date" {...register('dateIssued')} className={inputClass} />
            </div>
          </div>

          <div className="mt-4">
            <label className={labelClass}>Customer</label>
            <select {...register('customerId')} className={inputClass}>
              <option value="">Select a client...</option>
              {customers?.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
              ))}
            </select>
          </div>
        </GlassCard>

        {/* Section 2: Items Table */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Order Items</h3>
            <button
              type="button"
              onClick={() => append({ description: '', quantity: 1, unitPrice: 0, total: 0 })}
              className="text-xs flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-indigo-300 transition-colors"
            >
              <Plus size={14} /> Add Item
            </button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex flex-col md:flex-row gap-2 items-start md:items-center bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="flex-1 w-full">
                  <input
                    {...register(`items.${index}.description` as const, { required: true })}
                    placeholder="Item description (e.g., Aso Oke Set)"
                    className="bg-transparent border-none text-white placeholder-slate-600 focus:ring-0 w-full p-0 text-sm"
                  />
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                  <div className="w-20">
                     <input
                      type="number"
                      {...register(`items.${index}.quantity` as const)}
                      className={clsx(inputClass, "text-right")}
                      placeholder="Qty"
                      min="1"
                    />
                  </div>
                  <div className="w-32 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">{CURRENCIES[currency as CurrencyCode]}</span>
                    <input
                      type="number"
                      {...register(`items.${index}.unitPrice` as const)}
                      className={clsx(inputClass, "text-right pl-6")}
                      placeholder="Price"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Section 3: Totals & Payment (Production Rule) */}
        <GlassCard className="p-6">
          <div className="flex flex-col md:flex-row gap-8">
             {/* Deposit Input */}
             <div className="flex-1 space-y-4">
                <div>
                  <label className={labelClass}>Deposit / Initial Payment</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{CURRENCIES[currency as CurrencyCode]}</span>
                    <input
                      type="number"
                      {...register('depositAmount')}
                      className="w-full bg-indigo-500/10 border border-indigo-500/30 rounded-xl px-4 py-4 pl-8 text-xl font-bold text-white focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <p className="text-xs text-indigo-300/80 mt-2 flex items-center gap-1">
                    <Calculator size={12} />
                    Production starts after deposit confirmation.
                  </p>
                </div>
             </div>

             {/* Summary */}
             <div className="w-full md:w-64 space-y-3 pt-2">
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Subtotal:</span>
                  <span>{CURRENCIES[currency as CurrencyCode]} {totals.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Deposit:</span>
                  <span className="text-white">({CURRENCIES[currency as CurrencyCode]} {Number(deposit).toLocaleString()})</span>
                </div>
                <div className="h-px bg-white/10 my-2" />
                <div className="flex justify-between text-lg font-bold text-white">
                  <span>Balance Due:</span>
                  <span className={totals.balance > 0 ? "text-orange-400" : "text-green-400"}>
                    {CURRENCIES[currency as CurrencyCode]} {totals.balance.toLocaleString()}
                  </span>
                </div>
             </div>
          </div>
        </GlassCard>

        {/* Action Bar */}
        <div className="flex justify-end pt-4">
           <button
            type="submit"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all transform hover:-translate-y-1"
          >
            <Save size={20} />
            Generate Invoice
          </button>
        </div>
      </form>
    </div>
  );
}