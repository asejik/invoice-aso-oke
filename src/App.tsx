import { useEffect, useState } from 'react';
import { db } from './db';

function App() {
  const [status, setStatus] = useState('Checking DB...');

  useEffect(() => {
    async function initDB() {
      try {
        await db.open();
        setStatus('Database "AsoOkeInvoiceDB" is ready & online 🟢');
      } catch (error) {
        setStatus(`Database Failed 🔴: ${(error as Error).message}`);
      }
    }
    initDB();
  }, []);

  return (
    <div className="flex h-screen w-full items-center justify-center text-white">
      <div className="rounded-2xl border border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] p-8 text-center shadow-[var(--color-glass-shadow)] backdrop-blur-md">
        <h1 className="mb-2 text-2xl font-bold tracking-tight">System Status</h1>
        <p className="font-mono text-sm text-green-400">{status}</p>
      </div>
    </div>
  );
}

export default App;