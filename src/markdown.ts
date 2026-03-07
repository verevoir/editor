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

function processInline(text: string): string {
  let result = escapeHtml(text);
  // Bold: **text** (must be before italic)
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic: *text* (after bold, so ** is already consumed)
  result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Strikethrough: ~~text~~
  result = result.replace(/~~(.+?)~~/g, '<del>$1</del>');
  // Links: [text](url) — after escaping, & in URLs becomes &amp; which is
  // correct HTML for href attributes (browsers decode it)
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
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
