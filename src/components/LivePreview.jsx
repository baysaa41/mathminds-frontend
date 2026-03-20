// frontend/src/components/LivePreview.jsx
// (!!! ЗАСВАРЛАСАН: MathJax-ийн бүтцийг зөв болгосон)

import { useMemo, useState, useEffect } from 'react';
// (!!!) MathJax-г import хийсэн хэвээрээ
import { MathJax } from 'better-react-mathjax';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';

// (!!!) --- PSTricks серверийн хаяг ---
const PSTRICKS_SERVER_BASE_URL = 'https://pst.mathminds.club';

// --- PSTricks Рендер хийх туслах компонент ---
// (Энэ хэсэг өөрчлөгдөөгүй)
const PSTricksRenderer = ({ code }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    const renderPST = async () => {
      if (!code) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      setImageUrl(null);
      try {
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
        if (result.image_url) {
          const fullImageUrl = PSTRICKS_SERVER_BASE_URL
            ? `${PSTRICKS_SERVER_BASE_URL}${result.image_url}`
            : result.image_url;
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
  }, [code]);

  if (loading) {
    return (
      <div className="text-center p-2">
        <Spinner animation="border" size="sm" />
      </div>
    );
  }
  if (error) {
    return (
      <Alert variant="danger" className="p-1 small">
        [PST] Алдаа: {error}
      </Alert>
    );
  }
  if (imageUrl) {
    return (
      <div className="text-center my-2">
        <img
          src={imageUrl}
          style={{ maxWidth: '100%', height: 'auto', display: 'inline-block' }}
          alt="PSTricks render"
          onError={(e) => {
            e.target.style.display = 'none';
            setError(`Зургийг (${imageUrl}) ачаалахад алдаа гарлаа.`);
          }}
        />
      </div>
    );
  }
  if (code && !loading && !error && !imageUrl) {
    return (
      <Alert variant="warning" className="p-1 small">
        [PST] Зураг үүсгэгдсэнгүй.
      </Alert>
    );
  }

  return null;
};

// --- Табулар хөрвүүлэх функц ---
// (Энэ хэсэг өөрчлөгдөөгүй)
function convertTabularToHTML(text) {
  if (!text) return text;
  // ... (код хэвээрээ) ...
  return text.replace(
    /\\begin\{tabular\}\{([^\}]*)\}([\s\S]*?)\\end\{tabular\}/g,
    (match, colSpec, body) => {
      const colMatches = colSpec.match(/[lcr]/g) || [];
      const colCount =
        colMatches.length || Math.max(1, body.split('&')[0] ? body.split('&').length : 1);
      let rawRows = body.split(/\\\\\s*(?:\n|$)/g);
      const rows = rawRows.map((r) => r.trim()).filter((r) => r.length > 0);
      let html = `<div class="table-responsive"><table class="table table-sm" style="border-collapse:collapse;">`;
      const cellStyle = 'style="border:1px solid #dee2e6;padding:6px;vertical-align:middle;"';
      rows.forEach((rowRaw, rowIndex) => {
        let row = rowRaw.replace(/\\hline/g, '').trim();
        let rowColorMatch = row.match(/(?:<comment>\s*)?\\rowcolor\{([^\}]+)\}(?:\s*<\/comment>)?/);
        let rowClass = '';
        if (rowColorMatch) {
          const colorName = rowColorMatch[1].trim();
          rowClass = ` class="rowcolor-${colorName}"`;
          row = row.replace(rowColorMatch[0], '').trim();
        }
        const cells = row.split(/&/g).map((c) => c.trim());
        const useHeader = !!rowClass && rowClass.includes('tablehead');
        html += `<tr${rowClass}>`;
        for (let c = 0; c < Math.max(colCount, cells.length); c++) {
          const cellContent = cells[c] !== undefined ? cells[c] : '';
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
    }
  );
}

// --- LaTeX филтер функц ---
// (Энэ хэсэг өөрчлөгдөөгүй)
function applyLatexFilters(text) {
  if (!text) return '';
  let html = text;
  html = convertTabularToHTML(html);
  // ... (бусад replace-үүд хэвээрээ) ...
  html = html.replace(/\\begin{enumerate}(.*?)(\\item(.*?))*\\end{enumerate}/gs, (match) => {
    let items = match.replace(/\\begin{enumerate}\s*(\\item)?/g, '<li>');
    items = items.replace(/\\end{enumerate}\s*/g, '</li>');
    items = items.replace(/\\item\s*/g, '</li><li>');
    if (items.endsWith('<li>')) {
      items = items.substring(0, items.length - 4);
    } else if (!items.endsWith('</li>')) {
      items += '</li>';
    }
    return `<ol>${items}</ol>`;
  });
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
  // Heading командууд (\section, \subsection, ...)
  html = html.replace(/\\section\{([^}]*)\}/g,        '<h2 class="article-section mt-4 mb-2">$1</h2>');
  html = html.replace(/\\subsection\{([^}]*)\}/g,     '<h3 class="article-subsection mt-3 mb-2">$1</h3>');
  html = html.replace(/\\subsubsection\{([^}]*)\}/g,  '<h4 class="article-subsubsection mt-3 mb-1">$1</h4>');
  html = html.replace(/\\paragraph\{([^}]*)\}/g,      '<h5 class="article-paragraph mt-2 mb-1">$1</h5>');

  html = html.replace(/\\emph{(.*?)}/g, '<em>$1</em>');
  html = html.replace(/\\textbf{(.*?)}/g, '<strong>$1</strong>');
  html = html.replace(/``(.*?)\'\'/g, '<q>$1</q>');
  html = html.replace(/\\begin{center}(.*?)\\end{center}/gs, '<div class="text-center">$1</div>');
  html = html.replace(/\n\n/g, '<br/><br/>');

  // @mention → profile link
  // HTML tag дотор байгаа @-г орхино
  html = html.replace(
    /(?<![="'a-zA-Z0-9_/@])@([a-zA-Z0-9_]+)/g,
    '<a href="/profile/$1" class="mention-link text-primary text-decoration-none fw-semibold">@$1</a>'
  );

  // URLs → clickable links
  // href=, src= гэх мэт HTML attribute дотор аль хэдийн байгаа URL-г орхино
  html = html.replace(
    /(?<![="'>])(https?:\/\/[^\s<>"']+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  return html;
}

// --- НЭГДСЭН компонент (!!! ЗАСВАР ОРСОН) ---
const LivePreview = ({ content }) => {
  // 1. Текстийг [pst] тааг-аар салгах (хэвээрээ)
  const parts = useMemo(() => {
    if (!content) return [];
    const pstRegex = /\[pst\]([\s\S]*?)\[\/pst\]/g;
    const result = [];
    let lastIndex = 0;
    let match;
    while ((match = pstRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        result.push({ type: 'latex', value: content.substring(lastIndex, match.index) });
      }
      result.push({ type: 'pst', value: match[1].trim() });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < content.length) {
      result.push({ type: 'latex', value: content.substring(lastIndex) });
    }
    return result;
  }, [content]);

  if (!content) {
    return <></>;
  }

  // 2. (!!!) Бүх хэсгийг рендерлэхдээ ГАДНА талын <MathJax> компонентыг АВНА.
  // React.Fragment (эсвэл <>) ашиглана
  return (
    <>
      {parts.map((part, index) => {
        if (part.type === 'latex') {
          // 3. LaTeX хэсгийг HTML болгоно
          const htmlContent = applyLatexFilters(part.value);

          // 4. (!!!) ЭНЭ ХЭСГИЙГ <MathJax dynamic> -аар БҮРНЭ
          // 'dynamic' prop нь dangerouslySetInnerHTML доторхыг
          // дахин шалгах тушаал өгдөг.
          return (
            <MathJax dynamic key={index}>
              <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
            </MathJax>
          );
        }
        if (part.type === 'pst') {
          // 5. PSTricks хэсэг (MathJax шаардлагагүй)
          return <PSTricksRenderer key={index} code={part.value} />;
        }
        return null;
      })}
    </>
  );
};

export default LivePreview;
