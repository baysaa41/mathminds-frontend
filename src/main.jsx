// frontend/src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';

// better-react-mathjax-г импорт хийх
import { MathJaxContext } from "better-react-mathjax";

// MathJax тохиргоо (mathjax_config.js-тэй ижил)
const mathJaxConfig = {
    tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']], // Инлайн томьёог $...$ эсвэл \(...\) гэж танина
        macros: {                                  // Тусгай макронууд
            tg: "\\operatorname{tg}",
            ctg: "\\operatorname{ctg}",
            arctg: "\\operatorname{arctg}",
            arcctg: "\\operatorname{arcctg}",
            cosec: "\\operatorname{cosec}",
            sgn: "\\operatorname{sgn}",
            lt: "\\,<\\,",
            geo: "\\div\\kern{-0.5em}\\div",
        },
        packages: {'[+]': ['ams', 'cancel', 'color']} // Нэмэлт багцууд
    },
    svg: {
        scale: 1.05 // SVG гаралтын хэмжээг тохируулах
    },
    options: {
        skipHtmlTags: ["script", "noscript", "style", "textarea", "pre", "code"], // Эдгээр HTML таг доторхыг алгасна
        ignoreHtmlClass: "tex2jax_ignore", // Энэ класс_тай элементүүдийг алгасна
        processHtmlClass: "tex2jax_process" // Зөвхөн энэ класс_тай элементүүдийг боловсруулна (шаардлагатай бол)
    }
};

ReactDOM.createRoot(document.getElementById('root')).render(
    // <React.StrictMode> ашиглахыг зөвлөж байна (заавал биш)
    <React.StrictMode>
        <MathJaxContext version={3} config={mathJaxConfig}>
            <AuthProvider>
                <App />
            </AuthProvider>
        </MathJaxContext>
    </React.StrictMode>
);
// Илүүц хаалтыг устгасан