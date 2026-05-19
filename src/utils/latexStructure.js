/**
 * LaTeX бүтцийн командуудыг HTML болгон хөрвүүлэх.
 *
 * Дэмжих командууд:
 *   \section{...}       → <h2>
 *   \subsection{...}    → <h3>
 *   \subsubsection{...} → <h4>
 *   \paragraph{...}     → <h5>
 *   \begin{itemize}...\end{itemize}    → <ul>
 *   \begin{enumerate}...\end{enumerate} → <ol>
 *   \item               → <li>
 *   \textbf{...}        → <strong>
 *   \textit{...} / \emph{...} → <em>
 *   \underline{...}     → <u>
 *   \newline / \\       → <br>
 */

/**
 * Нэр бүхий бүлгийн дотоод агуулгыг авах (nested braces дэмждэг).
 * Жишээ: \section{a {b} c}  →  "a {b} c"
 */
function extractBraceContent(str, start) {
  let depth = 0;
  let i = start;
  let content = '';
  while (i < str.length) {
    const ch = str[i];
    if (ch === '{') {
      if (depth > 0) content += ch;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) return { content, end: i + 1 };
      content += ch;
    } else {
      content += ch;
    }
    i++;
  }
  return { content, end: i };
}

/**
 * \begin{env}...\end{env} блокуудыг HTML болгон хөрвүүлэх.
 */
function convertEnvironments(html) {
  // itemize → ul
  html = html.replace(
    /\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g,
    (_, body) => `<ul>${convertItems(body)}</ul>`
  );
  // enumerate → ol
  html = html.replace(
    /\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g,
    (_, body) => `<ol>${convertItems(body)}</ol>`
  );
  return html;
}

function convertItems(body) {
  // \item текст → <li>текст</li>
  const parts = body.split(/\\item\b/);
  return parts
    .slice(1)
    .map((t) => `<li>${t.trim()}</li>`)
    .join('');
}

/**
 * Нэг аргументтай командыг (<cmd>{content}) HTML тагаар хөрвүүлэх.
 * Math блок ($...$, $$...$$) дотрыг алгасна.
 */
function convertCommand(html, cmd, tag, extraAttrs = '') {
  const re = new RegExp(`\\\\${cmd}\\{`, 'g');
  let result = '';
  let lastIndex = 0;
  let match;
  while ((match = re.exec(html)) !== null) {
    const braceStart = match.index + match[0].length - 1; // '{' байршил
    const { content, end } = extractBraceContent(html, braceStart);
    result += html.slice(lastIndex, match.index);
    const attrs = extraAttrs ? ` ${extraAttrs}` : '';
    result += `<${tag}${attrs}>${content}</${tag}>`;
    lastIndex = end;
    re.lastIndex = end;
  }
  result += html.slice(lastIndex);
  return result;
}

/**
 * <p> дотор орсон heading командыг <p>-аас гадагшлуулах.
 * Жишээ: <p>\section{Foo}</p>  →  <h2 ...>Foo</h2>
 */
function unwrapParagraph(html) {
  return html.replace(
    /<p[^>]*>\s*(<h[2-6][^>]*>[\s\S]*?<\/h[2-6]>)\s*<\/p>/gi,
    '$1'
  );
}

/**
 * Үндсэн функц: LaTeX бүтцийн командуудыг HTML болгон хөрвүүлэх.
 * Math блокуудыг ($...$, $$...$$) хамгаалж, зөвхөн текстэн хэсгийг боловсруулна.
 */
export function convertLatexStructure(html) {
  if (!html) return html;

  // 1. Math блокуудыг placeholder-аар солих (боловсруулалтаар гэмтэхгүйн тулд)
  const mathBlocks = [];
  let processed = html.replace(
    /(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g,
    (m) => {
      mathBlocks.push(m);
      return `\x00MATH${mathBlocks.length - 1}\x00`;
    }
  );

  // 2. Environment блокууд (\begin{itemize} гэх мэт)
  processed = convertEnvironments(processed);

  // 3. Heading командууд
  processed = convertCommand(processed, 'section',        'h2', 'class="article-section mt-4 mb-2"');
  processed = convertCommand(processed, 'subsection',     'h3', 'class="article-subsection mt-3 mb-2"');
  processed = convertCommand(processed, 'subsubsection',  'h4', 'class="article-subsubsection mt-3 mb-1"');
  processed = convertCommand(processed, 'paragraph',      'h5', 'class="article-paragraph mt-2 mb-1"');

  // 4. Inline формат командууд
  processed = convertCommand(processed, 'textbf',   'strong');
  processed = convertCommand(processed, 'textit',   'em');
  processed = convertCommand(processed, 'emph',     'em');
  processed = convertCommand(processed, 'underline','u');

  // 5. Мөр солих
  processed = processed.replace(/\\newline\b/g, '<br>');
  processed = processed.replace(/\\\\(?!\s*[\w{])/g, '<br>');

  // 6. <p> бүрхүүлээс гадагшлуулах
  processed = unwrapParagraph(processed);

  // 7. Math блокуудыг сэргээх
  // eslint-disable-next-line no-control-regex
  processed = processed.replace(/\x00MATH(\d+)\x00/g, (_, i) => mathBlocks[+i]);

  return processed;
}
