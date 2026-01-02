import { useEffect, useState } from 'react';
import { db } from './db';
import { AppShell } from './components/layout/AppShell';
import { GlassCard } from './components/ui/GlassCard';

function App() {
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

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
            <p className="text-slate-400 mt-1">Welcome back, Merchant.</p>
          </div>
          <div className="flex items-center gap-2">
             <span className={`h-2 w-2 rounded-full ${status === 'Ready' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
             <span className="text-xs font-mono text-slate-500 uppercase">{status}</span>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GlassCard className="p-6">
            <h3 className="text-slate-400 text-sm font-medium">Total Revenue</h3>
            <p className="text-2xl font-bold text-white mt-2">₦0.00</p>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="text-slate-400 text-sm font-medium">Pending Payments</h3>
            <p className="text-2xl font-bold text-orange-400 mt-2">₦0.00</p>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="text-slate-400 text-sm font-medium">Invoices Issued</h3>
            <p className="text-2xl font-bold text-indigo-400 mt-2">0</p>
          </GlassCard>
        </div>

        {/* Empty State / Placeholder */}
        <GlassCard className="h-64 flex items-center justify-center border-dashed border-white/10 bg-transparent">
          <p className="text-slate-500">Recent invoices will appear here...</p>
        </GlassCard>
      </div>
    </AppShell>
  );
}

export default App;