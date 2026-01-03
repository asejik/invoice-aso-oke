import { useEffect, useState } from 'react';
import { db } from './db';
import { AppShell } from './components/layout/AppShell';
import { BusinessProfileForm } from './components/forms/BusinessProfileForm';
import { CustomerList } from './components/customers/CustomerList';
import { InvoiceForm } from './components/invoices/InvoiceForm';
import { InvoiceList } from './components/invoices/InvoiceList';
import { Dashboard } from './components/dashboard/Dashboard';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [status, setStatus] = useState('Checking DB...');

  useEffect(() => {
    async function initDB() {
      try {
        await db.open();
        setStatus('Ready');
      } catch (error) {
        setStatus(`Error`);
      }
    }
    initDB();
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'settings':
        return <BusinessProfileForm />;

      case 'customers':
        return <CustomerList />;

      case 'create':
        return (
          <InvoiceForm
            onComplete={() => setActiveTab('invoices')}
            onCancel={() => setActiveTab('dashboard')}
            onAddClient={() => setActiveTab('customers')}
          />
        );

      case 'invoices':
        return <InvoiceList />;

      case 'dashboard':
      default:
        return (
          <Dashboard onNavigate={setActiveTab} />
        );
    }
  };

  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="fixed top-4 right-4 z-50 pointer-events-none opacity-0 md:opacity-100">
         <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/5">
             <span className={`h-2 w-2 rounded-full ${status === 'Ready' ? 'bg-green-500' : 'bg-red-500'}`} />
             <span className="text-[10px] font-mono text-slate-400 uppercase">{status}</span>
         </div>
      </div>

      {renderContent()}
    </AppShell>
  );
}

export default App;