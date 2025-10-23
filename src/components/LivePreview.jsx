// frontend/src/components/LivePreview.jsx

import { useMemo, useState, useEffect } from 'react';
import { MathJax } from 'better-react-mathjax';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';

// --- PSTricks Рендер хийх туслах компонент (problem_editor.html-с) ---
const PSTricksRenderer = ({ code }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [imageData, setImageData] = useState(null);

    useEffect(() => {
        const renderPST = async () => {
            if (!code) {
                setLoading(false);
                return;
            }
            setLoading(true);
            setError(null);
            setImageData(null);
            try {
                //
                const response = await fetch('http://127.0.0.1:5000/render-pstricks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: code }),
                });
                if (!response.ok) {
                    const errorResult = await response.json();
                    throw new Error(errorResult.error || 'PSTricks server error');
                }
                const result = await response.json();
                if (result.png_base64) { //
                    setImageData(result.png_base64);
                } else {
                    throw new Error('Invalid response from PSTricks server.');
                }
            } catch (err) {
                setError(err.message);
                console.error('PSTricks rendering failed:', err);
            } finally {
                setLoading(false);
            }
        };
        renderPST();
    }, [code]);

    if (loading) {
        return <div className="text-center p-2"><Spinner animation="border" size="sm" /></div>;
    }
    if (error) {
        return <Alert variant="danger" className="p-1 small">[PST] Алдаа: {error}</Alert>;
    }
    if (imageData) {
        //
        return (
            <img
                src={'data:image/png;base64,' + imageData}
                style={{ maxWidth: '100%', height: 'auto' }}
                alt="PSTricks render"
            />
        );
    }
    return null;
};

// (!!!) ШИНЭ ФУНКЦ: latex_filter.py-г хуулбарлах
// Энэ нь \begin{enumerate}, \emph зэргийг HTML болгоно.
function applyLatexFilters(text) {
    if (!text) return "";
    let html = text;

    // \begin{enumerate}...\item...\end{enumerate} -> <ol><li>...</li></ol>
    // JavaScript-н 's' flag нь re.DOTALL-той тэнцүү
    html = html.replace(/\\begin{enumerate}(.*?)(\\item(.*?))*\\end{enumerate}/gs, (match) => {
        // Эхний \item-с өмнөх зүйлсийг устгаад, \item-уудыг <li> болгох
        let items = match.replace(/\\begin{enumerate}\s*(\\item)?/g, '<li>');
        items = items.replace(/\\end{enumerate}\s*/g, '</li>');
        items = items.replace(/\\item\s*/g, '</li><li>');
        return `<ol>${items}</ol>`;
    });

    // \emph{...} -> <em>...</em>
    html = html.replace(/\\emph{(.*?)}/g, '<em>$1</em>');

    // \textbf{...} -> <strong>...</strong>
    html = html.replace(/\\textbf{(.*?)}/g, '<strong>$1</strong>');

    // ``...'' -> <q>...</q> (Quote)
    html = html.replace(/``(.*?)\'\'/g, '<q>$1</q>');

    // \begin{center}...\end{center} -> <div class="text-center">...</div>
    html = html.replace(/\\begin{center}(.*?)\\end{center}/gs, '<div class="text-center">$1</div>');

    // Шинэ мөрийг <br> болгох (HTML-д шинэ мөр автоматаар харагддаггүй)
    html = html.replace(/\n\n/g, '<br/><br/>'); // Параграф
    html = html.replace(/\n/g, '<br/>'); // Энгийн шинэ мөр

    return html;
}

// --- MathJax + PSTricks + LaTeX орчныг хамт харуулах НЭГДСЭН компонент ---
const LivePreview = ({ content }) => {
    // 1. Текстийг [pst] тааг-аар нь "pst" (зураг) болон "latex" (бусад) гэж салгана
    const parts = useMemo(() => {
        if (!content) return [];

        //
        // (!!!) [xlat], [psti] зэргийг энд нэмж болно
        const pstRegex = /\[pst\]([\s\S]*?)\[\/pst\]/g;
        const result = [];
        let lastIndex = 0;
        let match;

        while ((match = pstRegex.exec(content)) !== null) {
            // [pst] тааг-ийн өмнөх текст
            if (match.index > lastIndex) {
                result.push({ type: 'latex', value: content.substring(lastIndex, match.index) });
            }
            // [pst] тааг-ийн доторх код
            result.push({ type: 'pst', value: match[1].trim() });
            lastIndex = match.index + match[0].length;
        }

        // [pst] тааг-ийн дараах текст
        if (lastIndex < content.length) {
            result.push({ type: 'latex', value: content.substring(lastIndex) });
        }

        return result;
    }, [content]);

    if (!content) {
        return <div className="text-muted small">(Агуулга байхгүй)</div>;
    }

    // 2. Бүх хэсгийг MathJax дотор рендерлэнэ
    // MathJax тохиргоог Layout.jsx-с авна
    return (
        <MathJax hideUntilTypeset={"first"}>
            {parts.map((part, index) => {
                if (part.type === 'latex') {
                    // 3. "latex" хэсгийг \emph, \begin{...} зэргийг HTML болгож хувиргана
                    const htmlContent = applyLatexFilters(part.value);
                    // 4. Үр дүнг HTML-р нь оруулах ба MathJax энэ доторх $...$-г олж ажиллана
                    return (
                        <span key={index} dangerouslySetInnerHTML={{ __html: htmlContent }} />
                    );
                }
                if (part.type === 'pst') {
                    // 5. "pst" хэсгийг PSTricks сервэр лүү илгээнэ
                    return <PSTricksRenderer key={index} code={part.value} />;
                }
                return null;
            })}
        </MathJax>
    );
};

export default LivePreview;