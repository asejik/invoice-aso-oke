export type CurrencyCode = 'NGN' | 'USD' | 'GBP' | 'EUR';

export interface BusinessProfile {
  id?: number; // Dexie uses auto-incrementing numbers by default
  businessName: string;
  address: string;
  phone: string;
  email?: string;
  logoUrl?: string; // We will store the Blob URL here temporarily
  ownerName?: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  invoiceFooterText?: string;
}

export interface Customer {
  id?: string; // UUID
  name: string;
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  country?: string;
  createdAt: Date;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id?: string; // UUID
  customerId: string;
  invoiceNumber: string; // e.g., INV-0001
  items: InvoiceItem[];

  // Financials
  subtotal: number;
  discount: number;
  discountRate?: number;
  discountType?: 'percentage' | 'fixed';
  tax: number;
  grandTotal: number;
  depositAmount: number;
  payments?: PaymentRecord[];

  // Meta
  currency: CurrencyCode;
  status: 'draft' | 'pending' | 'paid' | 'partial';
  dateIssued: Date;
  dueDate?: Date;
  notes?: string;

  // Sync Status (Critical for Offline Mode)
  isSynced: boolean;
  createdAt?: Date;
  updatedAt: Date;
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  note?: string; // Optional: e.g., "Bank Transfer", "Cash"
}