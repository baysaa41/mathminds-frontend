// frontend/src/components/LivePreview.jsx
// (!!! ШИНЭЧИЛСЭН: PSTricksRenderer-г image_url ашигладаг болгосон)

import { useMemo, useState, useEffect } from 'react';
import { MathJax } from 'better-react-mathjax';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';

// (!!!) --- PSTricks серверийн хаягийг энд тодорхойлно ---
// Development үед: 'http://127.0.0.1:5000'
// Production үед: Таны Flask серверийн бодит хаяг (жишээ нь, 'http://www.mmo.mn:5000')
const PSTRICKS_SERVER_BASE_URL = 'https://pst.mathminds.club'

// --- PSTricks Рендер хийх туслах компонент ---
const PSTricksRenderer = ({ code }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // (!!!) imageData -> imageUrl болгож өөрчилсөн
    const [imageUrl, setImageUrl] = useState(null);

    useEffect(() => {
        const renderPST = async () => {
            if (!code) {
                setLoading(false);
                return;
            }
            setLoading(true);
            setError(null);
            // (!!!) imageUrl-г цэвэрлэх
            setImageUrl(null);
            try {
                // (!!!) Flask серверийн URL-г зөв зааж өгөх
                const response = await fetch(`${PSTRICKS_SERVER_BASE_URL}/render-pstricks`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: code }),
                });
                if (!response.ok) {
                    const errorResult = await response.json();
                    throw new Error(errorResult.error || `PSTricks server error (${response.status})`);
                }
                const result = await response.json();
                // (!!!) png_base64 биш image_url-г шалгах
                if (result.image_url) {
                    // (!!!) Хүлээн авсан харьцангуй URL-г бүрэн URL болгох
                    // Flask сервер өөр домайн/порт дээр байвал үүнийг хийх шаардлагатай
                    // Хэрэв ижил домайн дээр proxy хийгдсэн бол PSTRICKS_SERVER_BASE_URL нэмэхгүй байж болно
                    const fullImageUrl = PSTRICKS_SERVER_BASE_URL ? `${PSTRICKS_SERVER_BASE_URL}${result.image_url}` : result.image_url;
                    setImageUrl(fullImageUrl);
                } else {
                    throw new Error('Invalid response from PSTricks server (missing image_url).');
                }
            } catch (err) {
                setError(err.message);
                console.error('PSTricks rendering failed:', err);
            } finally {
                setLoading(false);
            }
        };
        renderPST();
    }, [code]); // useEffect хамаарал хэвээрээ

    if (loading) {
        return <div className="text-center p-2"><Spinner animation="border" size="sm" /></div>;
    }
    if (error) {
        // Алдааг илүү дэлгэрэнгүй харуулах
        return <Alert variant="danger" className="p-1 small">[PST] Алдаа: {error}</Alert>;
    }
    // (!!!) imageData биш imageUrl-г шалгах
    if (imageUrl) {
        return (
            <div className="text-center my-2">
                {/* (!!!) src-д base64 биш, URL-г шууд оноох */}
                <img
                    src={imageUrl}
                    style={{ maxWidth: '100%', height: 'auto', display: 'inline-block' }}
                    alt="PSTricks render"
                    // Зураг ачаалахад алдаа гарвал харуулах
                    onError={(e) => {
                        e.target.style.display = 'none'; // Зургийг нуух
                        setError(`Зургийг (${imageUrl}) ачаалахад алдаа гарлаа.`);
                    }}
                />
            </div>
        );
    }
    // Хэрэв код байсан ч зураг үүсээгүй бол (магадгүй хоосон код)
    if (code && !loading && !error && !imageUrl) {
        return <Alert variant="warning" className="p-1 small">[PST] Зураг үүсгэгдсэнгүй.</Alert>;
    }

    return null; // Код байхгүй, алдаагүй, зураггүй бол юу ч харуулахгүй
};

// --- Табулар хөрвүүлэх функц ---
// Энгийн \begin{tabular}{...} ... \end{tabular} --> HTML table
function convertTabularToHTML(text) {
    if (!text) return text;
    // match tabular environment (dotall)
    return text.replace(/\\begin\{tabular\}\{([^\}]*)\}([\s\S]*?)\\end\{tabular\}/g, (match, colSpec, body) => {
        // Determine number of columns from colSpec: count letters l|c|r (ignore | and @{} etc.)
        const colMatches = (colSpec.match(/[lcr]/g) || []);
        const colCount = colMatches.length || Math.max(1, (body.split('&')[0] ? body.split('&').length : 1));

        // Split into rows by \\ (LaTeX rowbreak). Use a regex to split on \\ possibly followed by whitespace/newline
        // But we must avoid splitting on \\ within other commands; this is heuristic for simple tables.
        let rawRows = body.split(/\\\\\s*(?:\n|$)/g);

        // Clean up rows: remove leading/trailing whitespace and remove \hline markers
        const rows = rawRows.map(r => r.trim()).filter(r => r.length > 0);

        // Build HTML
        let html = `<div class="table-responsive"><table class="table table-sm" style="border-collapse:collapse;">`;

        // Add a simple border style for <td> and <th>
        const cellStyle = 'style="border:1px solid #dee2e6;padding:6px;vertical-align:middle;"';

        rows.forEach((rowRaw, rowIndex) => {
            // Detect and remove \hline tokens inside row
            let row = rowRaw.replace(/\\hline/g, '').trim();

            // Detect \rowcolor{...} either plain or wrapped in <comment>..</comment>
            // e.g. \rowcolor{tablehead}  OR  <comment>\rowcolor{tablehead}</comment>
            let rowColorMatch = row.match(/(?:<comment>\s*)?\\rowcolor\{([^\}]+)\}(?:\s*<\/comment>)?/);
            let rowClass = '';
            if (rowColorMatch) {
                const colorName = rowColorMatch[1].trim();
                // Use class so user can style via CSS; also for "tablehead" set a default header style
                rowClass = ` class="rowcolor-${colorName}"`;
                // remove the \rowcolor token from row text
                row = row.replace(rowColorMatch[0], '').trim();
            }

            // Split cells by unescaped & (simple approach)
            // Allow for commas and other chars inside cells; this is a heuristic for typical usage.
            const cells = row.split(/&/g).map(c => c.trim());

            // If this row was marked as header (rowcolor tablehead) or it's the first row and contains bold/other heuristic,
            // treat cells as <th>. We'll use rowClass presence to decide.
            const useHeader = !!rowClass && rowClass.includes('tablehead');

            html += `<tr${rowClass}>`;

            for (let c = 0; c < Math.max(colCount, cells.length); c++) {
                const cellContent = (cells[c] !== undefined) ? cells[c] : '';
                if (useHeader) {
                    html += `<th ${cellStyle}>${cellContent}</th>`;
                } else {
                    html += `<td ${cellStyle}>${cellContent}</td>`;
                }
            }

            html += `</tr>`;
        });

        html += `</table></div>`;

        return html;
    });
}

// (!!!) ШИНЭ ФУНКЦ: latex_filter.py-г хуулбарлах
// Энэ нь \begin{enumerate}, \emph зэргийг HTML болгоно.
function applyLatexFilters(text) {
    if (!text) return "";
    let html = text;

    // --- ПЕРША: табулар-ийг түр тариалангаар хөрвүүлэх ---
    html = convertTabularToHTML(html);

    // \begin{enumerate}...\item...\end{enumerate} -> <ol><li>...</li></ol>
    html = html.replace(/\\begin{enumerate}(.*?)(\\item(.*?))*\\end{enumerate}/gs, (match) => {
        // Эхний \item-с өмнөх зүйлсийг устгаад, \item-уудыг <li> болгох
        let items = match.replace(/\\begin{enumerate}\s*(\\item)?/g, '<li>');
        items = items.replace(/\\end{enumerate}\s*/g, '</li>');
        items = items.replace(/\\item\s*/g, '</li><li>');
        // Ensure the last item is properly closed if it ends right before \end{enumerate}
        if (items.endsWith('<li>')) {
            items = items.substring(0, items.length - 4); // Remove last empty <li>
        } else if (!items.endsWith('</li>')) {
            items += '</li>'; // Close the last item properly
        }
        return `<ol>${items}</ol>`;
    });
    // \begin{itemize}...\item...\end{itemize} -> <ul><li>...</li></ul>
    html = html.replace(/\\begin{itemize}(.*?)(\\item(.*?))*\\end{itemize}/gs, (match) => {
        let items = match.replace(/\\begin{itemize}\s*(\\item)?/g, '<li>');
        items = items.replace(/\\end{itemize}\s*/g, '</li>');
        items = items.replace(/\\item\s*/g, '</li><li>');
        if (items.endsWith('<li>')) {
            items = items.substring(0, items.length - 4);
        } else if (!items.endsWith('</li>')) {
            items += '</li>';
        }
        return `<ul>${items}</ul>`;
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
    // Avoid adding <br> inside table/list structures generated above
    // This is tricky, maybe apply this replacement *before* list/table conversion?
    // For now, let's keep it simple and apply at the end. It might add extra breaks in some cases.
    html = html.replace(/\n\n/g, '<br/><br/>'); // Paragraph break
    // Replace single newlines only if they are not potentially part of other structures
    // This simple replace might still break things like code blocks if not handled carefully
    // html = html.replace(/(?<!<br>)\n(?!<br>)/g, '<br/>'); // Avoid double breaks

    return html;
}

// --- MathJax + PSTricks + LaTeX орчныг хамт харуулах НЭГДСЭН компонент ---
const LivePreview = ({ content }) => {
    // 1. Текстийг [pst] тааг-аар нь "pst" (зураг) болон "latex" (бусад) гэж салгана
    const parts = useMemo(() => {
        if (!content) return [];

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
                    // Use a div wrapper for block-level context, especially after applyLatexFilters might add block elements
                    return (
                        <div key={index} dangerouslySetInnerHTML={{ __html: htmlContent }} style={{ display: 'inline' }} /> // Use inline display if it shouldn't break flow, or remove style for block
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