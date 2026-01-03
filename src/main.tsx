import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// FIX: Polyfill Buffer for @react-pdf/renderer
import { Buffer } from 'buffer';

// Use (window as any) to silence the TypeScript error
if (typeof window !== 'undefined') {
  (window as any).Buffer = (window as any).Buffer || Buffer;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);