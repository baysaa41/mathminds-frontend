// frontend/src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import { MathJaxContext } from 'better-react-mathjax';
import { mathJaxConfig } from './mathjax.config.js';

// ✅ React Query import
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// (!!!) 1. "БЭЛЭГНИЙ ХАЙРЦАГ"-ИЙГ ИМПОРТЛОХ
// (Та энэ файлыг frontend/src/context/PrefillContext.jsx гэж үүсгэсэн гэж үзлээ)
import { PrefillProvider } from './context/PrefillContext.jsx';

// React Query client үүсгэх
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <PrefillProvider>
            <MathJaxContext version={3} config={mathJaxConfig}>
              <App />
            </MathJaxContext>
          </PrefillProvider>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
