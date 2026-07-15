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
    /\\begin\{tabular\}\{([^}]*)\}([\s\S]*?)\\end\{tabular\}/g,
    (match, colSpec, body) => {
      const colMatches = colSpec.match(/[lcr]/g) || [];
      const colCount =
        colMatches.length || Math.max(1, body.split('&')[0] ? body.split('&').length : 1);
      let rawRows = body.split(/\\\\\s*(?:\n|$)/g);
      const rows = rawRows.map((r) => r.trim()).filter((r) => r.length > 0);
      let html = `<div class="table-responsive"><table class="table table-sm" style="border-collapse:collapse;">`;
      const cellStyle = 'style="border:1px solid #dee2e6;padding:6px;vertical-align:middle;"';
      rows.forEach((rowRaw, _rowIndex) => {
        let row = rowRaw.replace(/\\hline/g, '').trim();
        let rowColorMatch = row.match(/(?:<comment>\s*)?\\rowcolor\{([^}]+)\}(?:\s*<\/comment>)?/);
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
  // \begin{description}\item[Нэр] тайлбар...\end{description} — нэр томьёоны жагсаалт
  // (MathJax "description"-ийг математик орчин гэж ойлгодоггүй тул "Unknown environment"
  // алдаа өгдөг байсан, иймд HTML болгож хөрвүүлнэ)
  html = html.replace(/\\begin\{description\}([\s\S]*?)\\end\{description\}/g, (_, body) => {
    const items = body.split(/\\item\s*/).map((s) => s.trim()).filter(Boolean);
    const dl = items.map((item) => {
      const m = item.match(/^\[([^\]]*)\]\s*([\s\S]*)$/);
      return m
        ? `<dt style="font-weight:600;">${m[1].trim()}</dt><dd>${m[2].trim()}</dd>`
        : `<dd>${item}</dd>`;
    }).join('');
    return `<dl>${dl}</dl>`;
  });
  // Тусгай блокууд (\begin{definition}{Нэр}...\end{definition} эсвэл \begin{definition}...\end{definition})
  const blockTypes = [
    { env: 'definition', label: 'Тодорхойлолт', color: '#0d6efd', bg: '#e8f0fe', icon: '📘' },
    { env: 'theorem',    label: 'Теорем',       color: '#6f42c1', bg: '#f3eefe', icon: '📐' },
    { env: 'formula',    label: 'Томьёо',       color: '#d63384', bg: '#fce4f0', icon: '📝' },
    { env: 'example',    label: 'Жишээ',        color: '#198754', bg: '#e8f5e9', icon: '💡' },
    { env: 'note',       label: 'Тэмдэглэл',   color: '#fd7e14', bg: '#fff3e0', icon: '📌' },
    { env: 'proof',      label: 'Нотолгоо',     color: '#495057', bg: '#f1f3f5', icon: '🔍' },
    { env: 'exercise',   label: 'Дасгал',       color: '#198754', bg: '#e8f5e9', icon: '✏️' },
  ];
  for (const bt of blockTypes) {
    // {Нэр} аргумент заавал биш — байвал ашиглана, байхгүй бол label-аа ганцаараа харуулна
    const re = new RegExp(
      `\\\\begin\\{${bt.env}\\}(?:\\{([^}]*)\\})?([\\s\\S]*?)\\\\end\\{${bt.env}\\}`,
      'g'
    );
    html = html.replace(re, (_, name, body) => {
      const title = name ? `${bt.label}: ${name}` : bt.label;
      return (
        `<div class="article-block mb-3" style="border-left:4px solid ${bt.color};background:${bt.bg};border-radius:8px;padding:12px 16px;">` +
        `<div style="font-weight:600;color:${bt.color};margin-bottom:4px;">${bt.icon} ${title}</div>` +
        `<div>${body.trim()}</div>` +
        `</div>`
      );
    });
  }

  // Энгийн текст дэх "Жишээ бодлого 1.", "Бодлого 2.", "Шийдэл:", "Хариу:" зэргийг ялгах
  const inlineBlocks = [
    { re: /^(Жишээ(?:\s+бодлого)?[\s.:]*(\d+)?[.:]?\s*)/gm,  color: '#198754', bg: '#e8f5e9', icon: '💡' },
    { re: /^(Бодлого[\s.:]*(\d+)?[.:]?\s*)/gm,                color: '#198754', bg: '#e8f5e9', icon: '💡' },
    { re: /^(Шийдэл[.:]?\s*)/gm,                              color: '#0d6efd', bg: '#e8f0fe', icon: '✏️' },
    { re: /^(Бодолт[.:]?\s*)/gm,                              color: '#0d6efd', bg: '#e8f0fe', icon: '✏️' },
    { re: /^(Хариу(?![а-яёөүА-ЯЁӨҮ])[.:]?\s*)/gm,             color: '#6f42c1', bg: '#f3eefe', icon: '✅' },
  ];
  for (const ib of inlineBlocks) {
    html = html.replace(ib.re, (match) =>
      `<span style="display:inline-block;background:${ib.bg};color:${ib.color};font-weight:600;padding:2px 8px;border-radius:4px;margin-right:4px;">${ib.icon} ${match.trim()}</span>`
    );
  }

  // Heading командууд (\section, \subsection, ... — одтой хувилбарыг ч дэмжинэ: \subsection*{})
  html = html.replace(/\\section\*?\{([^}]*)\}/g,        '<h2 class="article-section mt-4 mb-2">$1</h2>');
  html = html.replace(/\\subsection\*?\{([^}]*)\}/g,     '<h3 class="article-subsection mt-3 mb-2">$1</h3>');
  html = html.replace(/\\subsubsection\*?\{([^}]*)\}/g,  '<h4 class="article-subsubsection mt-3 mb-1">$1</h4>');
  html = html.replace(/\\paragraph\*?\{([^}]*)\}/g,      '<h5 class="article-paragraph mt-2 mb-1">$1</h5>');

  html = html.replace(/\\emph{(.*?)}/g, '<em>$1</em>');
  html = html.replace(/\\textbf{(.*?)}/g, '<strong>$1</strong>');
  html = html.replace(/``(.*?)''/g, '<q>$1</q>');
  html = html.replace(/\\begin{center}(.*?)\\end{center}/gs, '<div class="text-center">$1</div>');
  html = html.replace(/\n\n/g, '<br/><br/>');

  // Markdown bold **text** → <strong>
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Markdown links [text](url) → <a>
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
    if (/^https?:\/\//.test(url)) {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    }
    return `<a href="${url}">${text}</a>`;
  });

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
    (match, url) => {
      let cleanUrl = url;
      // Strip trailing punctuation unlikely to be part of a URL
      cleanUrl = cleanUrl.replace(/[.,;:!?]+$/, '');
      // Strip unbalanced trailing closing parentheses/brackets
      while (
        cleanUrl.endsWith(')') &&
        (cleanUrl.match(/\(/g) || []).length < (cleanUrl.match(/\)/g) || []).length
      ) {
        cleanUrl = cleanUrl.slice(0, -1);
      }
      while (
        cleanUrl.endsWith(']') &&
        (cleanUrl.match(/\[/g) || []).length < (cleanUrl.match(/\]/g) || []).length
      ) {
        cleanUrl = cleanUrl.slice(0, -1);
      }
      const suffix = url.slice(cleanUrl.length);
      return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer">${cleanUrl}</a>${suffix}`;
    }
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
