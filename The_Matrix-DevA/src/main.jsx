// ============================================
// main.jsx — Vite entry point
// ============================================

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Global styles (order matters: variables → reset → global)
import './styles/variables.css';
import './styles/reset.css';
import './styles/global.css';

import App from './App';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
