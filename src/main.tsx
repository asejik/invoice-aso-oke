import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// FIX: Polyfill Buffer for @react-pdf/renderer
import { Buffer } from 'buffer';

// TypeScript will now accept this because of window.d.ts
if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || Buffer;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);