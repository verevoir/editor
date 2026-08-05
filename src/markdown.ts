/**
 * Lightweight markdown ↔ HTML converter for the rich text editor.
 *
 * Supports a limited subset of markdown:
 *   - **bold**, *italic*, ~~strikethrough~~
 *   - Unordered lists (- item)
 *   - Ordered lists (1. item)
 *   - Links [text](url)
 *   - Paragraphs (blank-line separated)
 *
 * This is intentionally minimal — the vocabulary limitation is a security
 * feature. No raw HTML passthrough, no headings, no code blocks.
 */

// --- Markdown → HTML ---

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * URL schemes that `[text](url)` is allowed to emit as a live `<a href>`.
 * Anything else (javascript:, data:, vbscript:, file:, blob:, filesystem:,
 * exotic handlers like `intent:` / `tg:` / `slack:`) falls through as plain
 * escaped text.
 *
 * Included schemes:
 * - `http:` / `https:` — external web links
 * - `mailto:` / `tel:` — contact affordances
 * - `doc:` — Verevoir's internal document reference scheme (resolved by
 *   the renderer, not the browser)
 * - `//` protocol-relative, `/` root-relative, `#` in-page anchors
 */
const SAFE_URL_SCHEMES = /^(?:https?:|mailto:|tel:|doc:|\/\/|\/|#)/i;

function isSafeUrl(url: string): boolean {
  // Strip control characters (tab, newline, NULL, etc.) that attackers
  // use to bypass scheme checks — e.g. `java\tscript:alert(1)`. These
  // get ignored by browsers during URL parsing, so a scheme check that
  // doesn't normalise them is unsafe.
  // Matching control characters is the point here: they are exactly what
  // we strip, so the rule does not apply.
  // eslint-disable-next-line no-control-regex
  const normalised = url.replace(/[\x00-\x1f\x7f]/g, '').trim();
  if (normalised === '') return false;
  return SAFE_URL_SCHEMES.test(normalised);
}

function processInline(text: string): string {
  let result = escapeHtml(text);
  // Bold: **text** (must be before italic)
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic: *text* (after bold, so ** is already consumed)
  result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Strikethrough: ~~text~~
  result = result.replace(/~~(.+?)~~/g, '<del>$1</del>');
  // Links: [text](url) — the URL is already HTML-escaped by escapeHtml
  // above. We ALSO check the scheme against SAFE_URL_SCHEMES so that
  // `[click](javascript:...)` and friends don't become live links. An
  // unsafe URL falls through as the raw markdown text — the user sees
  // `[click](javascript:...)` on the page, which is the right failure
  // mode: visibly broken, not silently exploitable.
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, href) =>
    isSafeUrl(href)
      ? `<a href="${href}" rel="noopener noreferrer">${label}</a>`
      : match,
  );
  return result;
}

export function markdownToHtml(md: string): string {
  if (!md) return '';

  const lines = md.split('\n');
  const blocks: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Unordered list
    if (/^[-*+]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+]\s/.test(lines[i])) {
        items.push(processInline(lines[i].replace(/^[-*+]\s/, '')));
        i++;
      }
      blocks.push(
        '<ul>' + items.map((item) => `<li>${item}</li>`).join('') + '</ul>',
      );
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(processInline(lines[i].replace(/^\d+\.\s/, '')));
        i++;
      }
      blocks.push(
        '<ol>' + items.map((item) => `<li>${item}</li>`).join('') + '</ol>',
      );
      continue;
    }

    // Empty line — paragraph separator
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Paragraph — collect consecutive non-empty, non-list lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^[-*+]\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push('<p>' + paraLines.map(processInline).join('<br>') + '</p>');
  }

  return blocks.join('');
}

// --- HTML → Markdown ---

function processNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    // Replace non-breaking spaces with regular spaces
    return (node.textContent ?? '').replace(/\u00a0/g, ' ');
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const el = node as Element;
  const tag = el.tagName.toLowerCase();
  const childText = () => Array.from(el.childNodes).map(processNode).join('');

  switch (tag) {
    case 'p':
    case 'div':
      return childText() + '\n\n';
    case 'br':
      return '\n';
    case 'strong':
    case 'b':
      return `**${childText()}**`;
    case 'em':
    case 'i':
      return `*${childText()}*`;
    case 'del':
    case 's':
    case 'strike':
      return `~~${childText()}~~`;
    case 'a': {
      const href = el.getAttribute('href') ?? '';
      return `[${childText()}](${href})`;
    }
    case 'ul':
      return (
        Array.from(el.children)
          .map((li) => `- ${processNode(li).trimEnd()}`)
          .join('\n') + '\n\n'
      );
    case 'ol':
      return (
        Array.from(el.children)
          .map((li, idx) => `${idx + 1}. ${processNode(li).trimEnd()}`)
          .join('\n') + '\n\n'
      );
    case 'li':
      return childText();
    default:
      return childText();
  }
}

export function htmlToMarkdown(element: Element): string {
  return processNode(element)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
