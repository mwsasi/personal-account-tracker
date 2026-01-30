import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error("Application failed to start:", error);
  rootElement.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif; color: #721c24; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; margin: 20px;">
      <h1 style="margin-top: 0;">Application Error</h1>
      <p>The application failed to start on Netlify. Error details:</p>
      <pre style="background: rgba(0,0,0,0.05); padding: 10px; border-radius: 4px; overflow: auto;">${error instanceof Error ? error.message : String(error)}</pre>
      <p>Check the browser console for more technical details.</p>
    </div>
  `;
}