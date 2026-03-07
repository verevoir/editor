import { describe, it, expect } from 'vitest';
import { markdownToHtml, htmlToMarkdown } from '../src/markdown.js';
import { JSDOM } from 'jsdom';

function parseHtml(html: string): Element {
  const dom = new JSDOM(`<div>${html}</div>`);
  return dom.window.document.querySelector('div')!;
}

describe('markdownToHtml', () => {
  it('returns empty string for empty input', () => {
    expect(markdownToHtml('')).toBe('');
  });

  it('wraps plain text in a paragraph', () => {
    expect(markdownToHtml('Hello world')).toBe('<p>Hello world</p>');
  });

  it('separates paragraphs on blank lines', () => {
    expect(markdownToHtml('First\n\nSecond')).toBe('<p>First</p><p>Second</p>');
  });

  it('joins consecutive lines with <br> within a paragraph', () => {
    expect(markdownToHtml('Line one\nLine two')).toBe(
      '<p>Line one<br>Line two</p>',
    );
  });

  it('converts **bold** to <strong>', () => {
    expect(markdownToHtml('**bold** text')).toBe(
      '<p><strong>bold</strong> text</p>',
    );
  });

  it('converts *italic* to <em>', () => {
    expect(markdownToHtml('*italic* text')).toBe('<p><em>italic</em> text</p>');
  });

  it('converts ~~strikethrough~~ to <del>', () => {
    expect(markdownToHtml('~~strike~~ text')).toBe(
      '<p><del>strike</del> text</p>',
    );
  });

  it('handles bold and italic together', () => {
    expect(markdownToHtml('**bold** and *italic*')).toBe(
      '<p><strong>bold</strong> and <em>italic</em></p>',
    );
  });

  it('converts links', () => {
    expect(markdownToHtml('[click](https://example.com)')).toBe(
      '<p><a href="https://example.com">click</a></p>',
    );
  });

  it('converts internal links', () => {
    expect(markdownToHtml('[Page](doc:abc-123)')).toBe(
      '<p><a href="doc:abc-123">Page</a></p>',
    );
  });

  it('converts unordered lists', () => {
    expect(markdownToHtml('- First\n- Second')).toBe(
      '<ul><li>First</li><li>Second</li></ul>',
    );
  });

  it('converts ordered lists', () => {
    expect(markdownToHtml('1. First\n2. Second')).toBe(
      '<ol><li>First</li><li>Second</li></ol>',
    );
  });

  it('handles inline formatting in list items', () => {
    expect(markdownToHtml('- **bold** item')).toBe(
      '<ul><li><strong>bold</strong> item</li></ul>',
    );
  });

  it('handles mixed paragraphs and lists', () => {
    expect(markdownToHtml('Intro\n\n- One\n- Two\n\nEnd')).toBe(
      '<p>Intro</p><ul><li>One</li><li>Two</li></ul><p>End</p>',
    );
  });

  it('escapes HTML entities', () => {
    expect(markdownToHtml('a < b & c > d')).toBe(
      '<p>a &lt; b &amp; c &gt; d</p>',
    );
  });

  it('escapes HTML tags in markdown', () => {
    expect(markdownToHtml('<script>alert("xss")</script>')).toBe(
      '<p>&lt;script&gt;alert("xss")&lt;/script&gt;</p>',
    );
  });
});

describe('htmlToMarkdown', () => {
  it('converts a paragraph', () => {
    expect(htmlToMarkdown(parseHtml('<p>Hello</p>'))).toBe('Hello');
  });

  it('converts multiple paragraphs', () => {
    expect(htmlToMarkdown(parseHtml('<p>First</p><p>Second</p>'))).toBe(
      'First\n\nSecond',
    );
  });

  it('converts <strong> to **bold**', () => {
    expect(htmlToMarkdown(parseHtml('<p><strong>bold</strong></p>'))).toBe(
      '**bold**',
    );
  });

  it('converts <b> to **bold**', () => {
    expect(htmlToMarkdown(parseHtml('<p><b>bold</b></p>'))).toBe('**bold**');
  });

  it('converts <em> to *italic*', () => {
    expect(htmlToMarkdown(parseHtml('<p><em>italic</em></p>'))).toBe(
      '*italic*',
    );
  });

  it('converts <i> to *italic*', () => {
    expect(htmlToMarkdown(parseHtml('<p><i>italic</i></p>'))).toBe('*italic*');
  });

  it('converts <del> to ~~strikethrough~~', () => {
    expect(htmlToMarkdown(parseHtml('<p><del>strike</del></p>'))).toBe(
      '~~strike~~',
    );
  });

  it('converts <s> to ~~strikethrough~~', () => {
    expect(htmlToMarkdown(parseHtml('<p><s>strike</s></p>'))).toBe(
      '~~strike~~',
    );
  });

  it('converts links to markdown', () => {
    expect(
      htmlToMarkdown(
        parseHtml('<p><a href="https://example.com">link</a></p>'),
      ),
    ).toBe('[link](https://example.com)');
  });

  it('converts unordered lists', () => {
    expect(htmlToMarkdown(parseHtml('<ul><li>One</li><li>Two</li></ul>'))).toBe(
      '- One\n- Two',
    );
  });

  it('converts ordered lists', () => {
    expect(htmlToMarkdown(parseHtml('<ol><li>One</li><li>Two</li></ol>'))).toBe(
      '1. One\n2. Two',
    );
  });

  it('converts <div> as paragraph (Chrome contentEditable)', () => {
    expect(htmlToMarkdown(parseHtml('<div>First</div><div>Second</div>'))).toBe(
      'First\n\nSecond',
    );
  });

  it('converts <br> to newline', () => {
    expect(htmlToMarkdown(parseHtml('<p>Line one<br>Line two</p>'))).toBe(
      'Line one\nLine two',
    );
  });

  it('handles mixed content', () => {
    const html =
      '<p><strong>Bold</strong> and <em>italic</em></p>' +
      '<ul><li>Item</li></ul>';
    expect(htmlToMarkdown(parseHtml(html))).toBe(
      '**Bold** and *italic*\n\n- Item',
    );
  });
});

describe('round-trip', () => {
  const cases = [
    'Simple text',
    '**bold** text',
    '*italic* text',
    '~~strikethrough~~',
    '[link](https://example.com)',
    '[internal](doc:abc-123)',
    '- First\n- Second',
    '1. First\n2. Second',
  ];

  for (const md of cases) {
    it(`round-trips: ${md}`, () => {
      const html = markdownToHtml(md);
      const el = parseHtml(html);
      expect(htmlToMarkdown(el)).toBe(md);
    });
  }
});
