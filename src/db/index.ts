import Dexie, { type Table } from 'dexie';
import type { BusinessProfile, Customer, Invoice } from '../types';

class AsoOkeDatabase extends Dexie {
  // Declare implicit table properties.
  // (We don't instantiate them here, Dexie does that for us)
  businessProfile!: Table<BusinessProfile>;
  customers!: Table<Customer>;
  invoices!: Table<Invoice>;

  constructor() {
    super('AsoOkeInvoiceDB');

    // Define the schema
    // ++id means auto-incrementing primary key
    // &id means unique primary key
    this.version(1).stores({
      businessProfile: '++id',
      customers: '&id, name, phone',
      invoices: '&id, customerId, status, dateIssued, isSynced'
    });
  }
}

export const db = new AsoOkeDatabase();