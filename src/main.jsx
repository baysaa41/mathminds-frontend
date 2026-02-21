// frontend/src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import { MathJaxContext } from 'better-react-mathjax';

// ✅ React Query import
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// (!!!) 1. "БЭЛЭГНИЙ ХАЙРЦАГ"-ИЙГ ИМПОРТЛОХ
// (Та энэ файлыг frontend/src/context/PrefillContext.jsx гэж үүсгэсэн гэж үзлээ)
import { PrefillProvider } from './context/PrefillContext.jsx';

// React Query client үүсгэх
const queryClient = new QueryClient();

// MathJax тохиргоо (хэвээрээ)
const mathJaxConfig = {
  tex: {
    inlineMath: [
      ['$', '$'],
      ['\\(', '\\)'],
    ],
    macros: {
      tg: '\\operatorname{tg}',
      ctg: '\\operatorname{ctg}',
      arctg: '\\operatorname{arctg}',
      arcctg: '\\operatorname{arcctg}',
      cosec: '\\operatorname{cosec}',
      sgn: '\\operatorname{sgn}',
      lt: '\\,<\\,',
      geo: '\\div\\kern{-0.5em}\\div',
    },
    packages: { '[+]': ['ams', 'cancel', 'color'] },
  },
  svg: { scale: 1.05 },
  options: {
    skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
    ignoreHtmlClass: 'tex2jax_ignore',
    processHtmlClass: 'tex2jax_process',
  },
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MathJaxContext version={3} config={mathJaxConfig}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            {/* (!!!) 2. APP-Г "ХАЙРЦАГ"-ААР БҮРЭХ */}
            <PrefillProvider>
              <App />
            </PrefillProvider>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </MathJaxContext>
  </React.StrictMode>
);
