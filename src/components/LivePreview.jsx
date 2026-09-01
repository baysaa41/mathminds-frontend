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
const PSTricksRenderer = ({ code, inline = false }) => {
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
    return inline ? (
      <Spinner animation="border" size="sm" className="mx-1" />
    ) : (
      <div className="text-center p-2">
        <Spinner animation="border" size="sm" />
      </div>
    );
  }
  if (error) {
    return (
      <Alert variant="danger" className="p-1 small d-inline-block">
        [PST] Алдаа: {error}
      </Alert>
    );
  }
  if (imageUrl) {
    const img = (
      <img
        src={imageUrl}
        style={{ maxWidth: '100%', height: 'auto', display: 'inline-block', verticalAlign: 'middle' }}
        alt="PSTricks render"
        onError={(e) => {
          e.target.style.display = 'none';
          setError(`Зургийг (${imageUrl}) ачаалахад алдаа гарлаа.`);
        }}
      />
    );
    return inline ? img : <div className="text-center my-2">{img}</div>;
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
function convertTabularToHTML(text) {
  if (!text) return text;
  return text.replace(
    /\\begin\{tabular\}\{([^}]*)\}([\s\S]*?)\\end\{tabular\}/g,
    (match, colSpec, body) => {
      const colMatches = colSpec.match(/[lcr]/g) || [];
      const colCount =
        colMatches.length || Math.max(1, body.split('&')[0] ? body.split('&').length : 1);
      // Багана бүрийн align-ийг colSpec-ийн эрэмбийн дагуу тэмдэглэнэ (l/c/r → left/
      // center/right) — colSpec-д зааагүй (ж: colCount нь fallback-аар тооцогдсон) багана
      // бүрт зөвхөн анхдагч (align тохируулаагүй) хэвээр үлдэнэ.
      const ALIGN_MAP = { l: 'left', c: 'center', r: 'right' };
      const colAligns = colMatches.map((ch) => ALIGN_MAP[ch]);
      let rawRows = body.split(/\\\\\s*(?:\n|$)/g);
      // Сүүлийн мөрийн "\\" тусгаарлагчийн ДАРАА үлдэх "\hline"-г (өөрөө шинэ мөрийн
      // өгөгдөл биш, зөвхөн хүснэгтийн доод зураас) бодит мөр гэж андуурч хоосон
      // <tr>-д хөрвүүлдэг байсан тул \hline-г арилгасны ДАРАА хоосон эсэхийг шалгана.
      const rows = rawRows
        .map((r) => r.trim())
        .filter((r) => r.replace(/\\hline/g, '').trim().length > 0);
      let html = `<div class="table-responsive"><table class="table table-sm" style="border-collapse:collapse;">`;
      const cellStyleBase = 'border:1px solid #dee2e6;padding:6px;vertical-align:middle;';
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
          const align = colAligns[c];
          const cellStyle = `style="${cellStyleBase}${align ? `text-align:${align};` : ''}"`;
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

// --- Аюултай '<' тэмдгийг escape хийх ---
// DB-д Articles.content зэрэгт зохиогчдын бичсэн БОДИТ HTML (<strong>, <a href>, <table> гэх
// мэт — WYSIWYG засварлагчаас ирдэг) байдаг тул '<'-г бүрмөсөн escape хийж болохгүй. Гэвч
// "1<a", "x<b" гэх мэт тэнцэтгэл биш доторх '<' нь мэдэгдэж буй tag-ийн нэртэй давхцвал
// (жиш нь 'a', 'p', 'b') browser үүнийг tag эхлэл гэж андуурч, дараагийн агуулгыг тухайн
// (байхгүй) tag-ийн дотор шингээдэг. Иймд зөвхөн БҮРЭН ХЭЛБ�эржсэн, мэдэгдэж буй tag-уудыг
// (whitelist) хэвээр үлдээж, бусад бүх '<'-г (тэдгээрийн дараа үсэг орсон эсэхээс үл
// хамааран) '&lt;'-рүү хөрвүүлнэ.
const ALLOWED_HTML_TAGS = new Set([
  'a', 'b', 'i', 'u', 'em', 'strong', 'span', 'div', 'p', 'br', 'hr',
  'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'colgroup', 'col',
  'img', 'iframe', 'center', 'del', 'sub', 'sup', 'pre', 'code', 'blockquote', 'q',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'comment', 'body', 'html',
]);
// Alt 1: бүрэн хэлбэржсэн tag (нээх/хаах, зайлшгүй '>'-ээр төгсдөг). Alt 2: ганцаараа '<'.
const TAG_OR_STRAY_LT_RE = /<\/?[a-zA-Z][a-zA-Z0-9]*(?:\s[^<>]*)?\/?>|</g;

function sanitizeAngleBrackets(text) {
  return text.replace(TAG_OR_STRAY_LT_RE, (match) => {
    if (match === '<') return '&lt;';
    const nameMatch = match.match(/^<\/?([a-zA-Z][a-zA-Z0-9]*)/);
    const tagName = nameMatch ? nameMatch[1].toLowerCase() : '';
    if (ALLOWED_HTML_TAGS.has(tagName)) return match;
    // "tag" шиг харагдаад ч дэмждэггүй нэртэй бол — escape хийж бодит текст болгоно.
    return match.replace(/^</, '&lt;').replace(/>$/, '&gt;');
  });
}

// --- Цэвэрхэн web-рендерт орчуулагдахгүй, зөвхөн PDF/LaTeX компайлерт зориулсан
// формат/зай тохируулах командуудыг арилгах ---
// (\vspace, \hspace, \medskip зэрэг нь хуудасны зай/шифт тохируулдаг цэвэр TeX-only
// команд — веб дээр дүрслэх шаардлагагүй тул зүгээр л устгана. \setcounter{enumi}{N}
// нь enumerate жагсаалтын дугаарлалтыг тасалж үргэлжлүүлэхэд ашигладаг, мөн веб
// хувилбарт дүрслэх шаардлагагүй.)
function stripTexOnlyDirectives(text) {
  let out = text;
  out = out.replace(/\\setcounter\{[^}]*\}\{[^}]*\}\s*/g, '');
  out = out.replace(/\\(vspace|hspace)\*?\{[^}]*\}\s*/g, '');
  out = out.replace(/\\(med|big|small)skip\s*/g, '');
  out = out.replace(/\\noindent\s*/g, '');
  out = out.replace(/\\centering\s*/g, '');
  // '\\[5mm]' — мөр хоорондын нэмэлт зай зааж буй LaTeX заавар (мөр таслах '\\'-той хамт)
  out = out.replace(/\\\\\[\d+[a-zA-Z]*\]\s*/g, '');
  // \hfill — мөрийг баруун тийш түлхэх зай тэлэх команд, веб урсгалд утгагүй тул арилгана
  out = out.replace(/\\hfill\s*/g, '');
  // \index{...} — makeindex-д зориулсан үл харагдах index-тэмдэглэгээ, хэвлэмэл гарцад
  // ямар ч дүрслэл өгдөггүй тул зүгээр л арилгана.
  out = out.replace(/\\index\{[^}]*\}\s*/g, '');
  // \label{...} — cross-reference зориулалттай, өөрөө ямар ч дүрслэл өгдөггүй.
  out = out.replace(/\\label\{[^}]*\}\s*/g, '');
  // \caption{Text} — зурган доорх тайлбар, italic текст болгож харуулна.
  out = out.replace(
    /\\caption\{([^}]*)\}\s*/g,
    '<div style="text-align:center;font-style:italic;color:#666;font-size:0.9em;margin-top:-8px;margin-bottom:12px;">$1</div>'
  );
  // \scalebox{N}{...} — веб дээр хариуцлагатай (responsive) зургийг өөрөө аль хэдийн
  // тохирсон хэмжээтэй тул scale factor-ыг хэрэгсэхгүй, зөвхөн дотоод агуулгыг үлдээнэ.
  out = out.replace(/\\scalebox\{[^}]*\}\s*\{([\s\S]*?)\}/g, '$1');
  // \url{https://...} — жинхэнэ дарж болох холбоос болгож хөрвүүлнэ.
  out = out.replace(
    /\\url\{([^}]*)\}/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  return out;
}

// \begin{table}[ht]\centering ... \end{table} — LaTeX float wrapper, зөвхөн байрлал/
// хүрээгийн тухай заавар агуулна (хэвлэлийн зориулалттай), дотор нь ихэвчлэн
// \begin{tabular}/бусад агуулга байрлана. \begin{center}-тэй адил зөвхөн wrapper-ийг
// арилгаж, дотоод агуулгыг хэвээр үлдээнэ.
function unwrapLatexFloats(text) {
  let out = text.replace(/\\begin\{table\}(?:\[[a-zA-Z!]*\])?/g, '').replace(/\\end\{table\}/g, '');
  // \begin{multicols}{N} — олон баганатай текст layout, веб дээр давхар багана
  // зохион байгуулах шаардлагагүй тул зүгээр л задална (агуулга энгийн урсгалаар харагдана).
  out = out.replace(/\\begin\{multicols\}\{\d+\}/g, '').replace(/\\end\{multicols\}/g, '');
  // \begin{figure}[h] ... \end{figure} — table-тэй адил зөвхөн float wrapper, дотор нь
  // ихэвчлэн зураг (\scalebox/<img>) + \caption + \label байрлана.
  out = out.replace(/\\begin\{figure\}(?:\[[a-zA-Z!]*\])?/g, '').replace(/\\end\{figure\}/g, '');
  return out;
}

// --- \begin{itemize}/\begin{enumerate}-ийг УГЛАГДСАН (nested) тохиолдолд ч зөв хөрвүүлэх ---
// Энгийн non-greedy regex (\\begin{env}(.*?)\\end{env}) нь давхарлагдсан жагсаалтад
// АЛДААТАЙ ажилладаг: хамгийн ойрын \\end{env}-г (өөрөөр хэлбэл дотоод жагсаалтынхыг)
// хаалт гэж бодож, гадаад \\end{env} нь холбогдох хос нэхэлгүй үлдэж дэлгэцэнд түүхий
// текстээр гарч ирдэг байсан. Иймд '{'-ийн гүнийг тоолж ХАМГИЙН ГАДААД (balanced)
// хосыг олж, дотоод агуулгыг эхлээд РЕКУРСИВООР хөрвүүлсний дараа \\item-ээр хуваана.
function findBalancedEnvSpans(text, envName) {
  const beginTok = `\\begin{${envName}}`;
  const endTok = `\\end{${envName}}`;
  const spans = [];
  let i = 0;
  while (i < text.length) {
    const b = text.indexOf(beginTok, i);
    if (b === -1) break;
    let depth = 1;
    let j = b + beginTok.length;
    while (depth > 0) {
      const nb = text.indexOf(beginTok, j);
      const ne = text.indexOf(endTok, j);
      if (ne === -1) { depth = -1; break; } // тэнцүү бус (unbalanced) — цааш оролдохгүй
      if (nb !== -1 && nb < ne) {
        depth += 1;
        j = nb + beginTok.length;
      } else {
        depth -= 1;
        j = ne + endTok.length;
      }
    }
    if (depth !== 0) break;
    spans.push({ start: b, end: j, body: text.slice(b + beginTok.length, j - endTok.length) });
    i = j;
  }
  return spans;
}

function convertListEnv(text, envName, wrapTag) {
  const spans = findBalancedEnvSpans(text, envName);
  if (spans.length === 0) return text;
  let out = '';
  let last = 0;
  for (const span of spans) {
    out += text.slice(last, span.start);
    // дотоод (nested) жагсаалтыг эхэлж хөрвүүлнэ — ингэснээр доор \\item-ээр хуваахад
    // дотоод жагсаалтын \\item-үүд аль хэдийн <li>-д хувирсан байгаа тул холилдохгүй.
    const body = convertListEnv(span.body, envName, wrapTag);
    const parts = body.split(/\\item\s*/).map((s) => s.trim()).filter((s) => s.length > 0);
    out += `<${wrapTag}>${parts.map((p) => `<li>${p}</li>`).join('')}</${wrapTag}>`;
    last = span.end;
  }
  out += text.slice(last);
  return out;
}

// --- $...$/$$...$$-ийн ГАДНА байгаа "\\" (мөр таслах команд) -г <br/> болгох ---
// LaTeX-д "\\" нь array/cases/tabular орчинд эгнээ тусгаарлах зориулалттай БОЛОВЧ эх
// материалд энгийн өгүүлбэрийн төгсгөлд ч (шинэ мөрөнд шилжих зорилгоор) байнга
// ашигласан байдаг — тэдгээр нь math horoo-ны гадна тул MathJax огт хардаггүй, зүгээр л
// "\\" гэсэн түүхий текст хэвээр үлдэж (жиш нь "...байг.\\" мөрийн төгсгөлд харагдана).
// Математик доторх "\\" (array/cases мөр таслалт)-д хүрэхгүйн тулд зөвхөн $...$/$$...$$
// блокуудын ХООРОНДЫН хэсгүүдэд л ажиллана. convertTabularToHTML() дараа заавал ажиллах
// ёстой — эс тэгвэл tabular мөр тусгаарлагч "\\"-г MathJax хүрэхээс өмнө устгачихна.
// \begin{multline*}/\begin{gather*} гэх мэт orчны хувьд MathJax (processEnvironments:
// true, анхдагч утга) $-аар ороогдоогүй ч ШУУД math гэж таньдаг тул тэдгээрийг ч мөн
// "math" гэж тооцож алгасах ёстой — эс тэгвэл дотоод "\\" мөр таслалт эвдэрнэ.
// АНХААР: ганц '$...$' (inline math) нь MathJax-ын хувьд НЭГ МӨРӨӨР хязгаарлагддаггүй —
// дотроо \begin{array}{ll}...\end{array} гэх мэт олон мөрт бүтэц агуулж болно (жиш нь
// уламжлалын хүснэгт). Эхэндээ '[^$\n]' (зөвхөн ганц мөр) ашигласан нь ийм олон мөрт
// inline math-ыг "math биш" гэж андуурч, дотоод "\\"-г нь эвдэж байсан тул '[^$]' (мөр
// хамаагүй, зөвхөн дараагийн '$' хүртэл) болгож өргөтгөсөн.
// АНХААР 2: '\[...\]' (display math) урьд нь энд танигдаагүй байсан тул дотор нь
// \begin{array}/\begin{cases} орчноор бичсэн систем тэгшитгэл ("\[\begin{array}{c}
// ...\\...\end{array}\]" маягийн) доторх мөр таслах "\\"-г math-ын гадна гэж андуурч
// <br/> болгож хувиргаж, MathJax-д буруу LaTeX (эвдэрсэн array) очиж рендер алдаатай
// гардаг байсан. Иймд '\[...\]'-г ч мөн адил "math" гэж тооцно.
const MATH_ENV_NAMES = 'equation|align|alignat|gather|multline|eqnarray';
const MATH_BLOCK_SPLIT_RE = new RegExp(
  '(\\$\\$[\\s\\S]+?\\$\\$|\\$[^$]+?\\$|' +
  '\\\\\\[[\\s\\S]*?\\\\\\]|' +
  '\\\\begin\\{(?:' + MATH_ENV_NAMES + ')\\*?\\}[\\s\\S]*?\\\\end\\{(?:' + MATH_ENV_NAMES + ')\\*?\\})',
  'g'
);

function convertLineBreaksOutsideMath(text) {
  let out = '';
  let last = 0;
  MATH_BLOCK_SPLIT_RE.lastIndex = 0;
  let m;
  while ((m = MATH_BLOCK_SPLIT_RE.exec(text))) {
    out += text.slice(last, m.index).replace(/\\\\/g, '<br/>');
    out += m[0];
    last = MATH_BLOCK_SPLIT_RE.lastIndex;
  }
  out += text.slice(last).replace(/\\\\/g, '<br/>');
  return out;
}

// --- LaTeX филтер функц ---
function applyLatexFilters(text) {
  if (!text) return '';
  // АНХААР: convertTabularToHTML() ЗААВАЛ sanitizeAngleBrackets()-ээс ӨМНӨ ажиллах
  // ёстой. sanitizeAngleBrackets() нь орчлон доторх "<" тэмдгийг "&lt;" болгож escape
  // хийдэг бөгөөд энэ нь шинэ "&" тэмдэг үүсгэдэг ("&lt;"). Хэрэв энэ дараа
  // convertTabularToHTML() ажиллавал тухайн эгнээг "&" (баганын тусгаарлагч) гэж
  // андуурч, "$m < 35$" гэсэн НЭГ нүдийг "$m" ба "lt; 35$" гэсэн ХОЁР нүд болгож
  // хуваачихдаг байсан (баганын тоо, эгнэлт бүгд эвдэрдэг байсан).
  let html = convertTabularToHTML(text);
  html = sanitizeAngleBrackets(html);
  html = stripTexOnlyDirectives(html);
  html = unwrapLatexFloats(html);
  html = convertLineBreaksOutsideMath(html);
  // ... (бусад replace-үүд хэвээрээ) ...
  html = convertListEnv(html, 'enumerate', 'ol');
  html = convertListEnv(html, 'itemize', 'ul');
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
    // {Нэр} аргумент заавал биш — байвал ашиглана, байхгүй бол label-аа ганцаараа харуулна.
    // Нэр өөрөө математик тэмдэглэгээ ($x^{2}$ гэх мэт) агуулж, нэг түвшний дотоод '{...}'
    // хос агуулж болно ('[^}]*' үүнийг зөв даахгүй — ХАМГИЙН ЭХНИЙ '}'-д (жиш нь "{\infty}"
    // доторх) зогсоод, нэрийг таслаж, үлдсэн хэсгийг buруу нь body-д унагаадаг байсан).
    const re = new RegExp(
      `\\\\begin\\{${bt.env}\\}(?:\\{((?:[^{}]|\\{[^{}]*\\})*)\\})?([\\s\\S]*?)\\\\end\\{${bt.env}\\}`,
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
  // 1. Текстийг [pst] / [psti] (inline хувилбар) тааг-аар салгах
  const parts = useMemo(() => {
    if (!content) return [];
    const pstRegex = /\[pst(i)?\]([\s\S]*?)\[\/pst\1\]/g;
    const result = [];
    let lastIndex = 0;
    let match;
    while ((match = pstRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        result.push({ type: 'latex', value: content.substring(lastIndex, match.index) });
      }
      result.push({ type: match[1] ? 'psti' : 'pst', value: match[2].trim() });
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
        if (part.type === 'psti') {
          // 5b. Inline PSTricks хэсэг — мөр таслахгүй, текст/элементийн урсгалд орно
          return <PSTricksRenderer key={index} code={part.value} inline />;
        }
        return null;
      })}
    </>
  );
};

export default LivePreview;
