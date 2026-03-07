import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useRichText } from '../src/hooks/useRichText.js';

/**
 * Minimal test wrapper — renders the contentEditable surface and exposes
 * hook actions via buttons so we can drive behaviours from tests.
 */
function TestEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (md: string) => void;
}) {
  const { editorRef, handlers, actions, state } = useRichText(value, onChange);
  return (
    <div>
      <div ref={editorRef} data-testid="editor" contentEditable {...handlers} />
      <button data-testid="bold" onClick={() => actions.format('bold')}>
        Bold
      </button>
      <button data-testid="italic" onClick={() => actions.format('italic')}>
        Italic
      </button>
      <button
        data-testid="strikethrough"
        onClick={() => actions.format('strikeThrough')}
      >
        Strike
      </button>
      <button
        data-testid="ul"
        onClick={() => actions.format('insertUnorderedList')}
      >
        UL
      </button>
      <button
        data-testid="ol"
        onClick={() => actions.format('insertOrderedList')}
      >
        OL
      </button>
      <button data-testid="link" onClick={actions.openLinkDialog}>
        Link
      </button>
      <button data-testid="close-link" onClick={actions.closeLinkDialog}>
        Close
      </button>
      {state.showLinkDialog && <div data-testid="link-dialog">Dialog</div>}
    </div>
  );
}

describe('useRichText', () => {
  let execCommandSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    // JSDOM does not implement execCommand or queryCommandState
    execCommandSpy = vi.fn().mockReturnValue(true);
    document.execCommand = execCommandSpy;
    document.queryCommandState = vi.fn().mockReturnValue(false);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  // --- Initial rendering ---

  it('renders initial markdown as HTML', () => {
    render(<TestEditor value="**bold** text" onChange={() => {}} />);
    const editor = screen.getByTestId('editor');
    expect(editor.innerHTML).toBe('<p><strong>bold</strong> text</p>');
  });

  it('renders empty string for empty value', () => {
    render(<TestEditor value="" onChange={() => {}} />);
    const editor = screen.getByTestId('editor');
    expect(editor.innerHTML).toBe('');
  });

  it('renders lists as HTML', () => {
    render(<TestEditor value={'- First\n- Second'} onChange={() => {}} />);
    const editor = screen.getByTestId('editor');
    expect(editor.innerHTML).toBe('<ul><li>First</li><li>Second</li></ul>');
  });

  it('renders links as HTML', () => {
    render(
      <TestEditor value="[click](https://example.com)" onChange={() => {}} />,
    );
    const editor = screen.getByTestId('editor');
    expect(editor.innerHTML).toBe(
      '<p><a href="https://example.com">click</a></p>',
    );
  });

  // --- Debounced onChange ---

  it('does not emit onChange immediately on input', () => {
    const onChange = vi.fn();
    render(<TestEditor value="" onChange={onChange} />);
    const editor = screen.getByTestId('editor');
    editor.innerHTML = '<p>Hello</p>';
    fireEvent.input(editor);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('emits onChange after 300ms debounce', () => {
    const onChange = vi.fn();
    render(<TestEditor value="" onChange={onChange} />);
    const editor = screen.getByTestId('editor');
    editor.innerHTML = '<p>Hello world</p>';
    fireEvent.input(editor);
    vi.advanceTimersByTime(300);
    expect(onChange).toHaveBeenCalledWith('Hello world');
  });

  it('resets debounce timer on subsequent input', () => {
    const onChange = vi.fn();
    render(<TestEditor value="" onChange={onChange} />);
    const editor = screen.getByTestId('editor');
    editor.innerHTML = '<p>First</p>';
    fireEvent.input(editor);
    vi.advanceTimersByTime(200);
    editor.innerHTML = '<p>Second</p>';
    fireEvent.input(editor);
    vi.advanceTimersByTime(200);
    expect(onChange).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(onChange).toHaveBeenCalledWith('Second');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  // --- Blur ---

  it('emits onChange immediately on blur', () => {
    const onChange = vi.fn();
    render(<TestEditor value="" onChange={onChange} />);
    const editor = screen.getByTestId('editor');
    editor.innerHTML = '<p>Blur test</p>';
    fireEvent.input(editor);
    fireEvent.blur(editor);
    expect(onChange).toHaveBeenCalledWith('Blur test');
  });

  it('cancels pending debounce on blur (no double emit)', () => {
    const onChange = vi.fn();
    render(<TestEditor value="" onChange={onChange} />);
    const editor = screen.getByTestId('editor');
    editor.innerHTML = '<p>Content</p>';
    fireEvent.input(editor);
    fireEvent.blur(editor);
    vi.advanceTimersByTime(300);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  // --- External value sync ---

  it('syncs innerHTML when value prop changes', () => {
    const { rerender } = render(
      <TestEditor value="First" onChange={() => {}} />,
    );
    const editor = screen.getByTestId('editor');
    expect(editor.innerHTML).toBe('<p>First</p>');
    rerender(<TestEditor value="Second" onChange={() => {}} />);
    expect(editor.innerHTML).toBe('<p>Second</p>');
  });

  it('does not stomp innerHTML when value matches internal state', () => {
    const onChange = vi.fn();
    render(<TestEditor value="" onChange={onChange} />);
    const editor = screen.getByTestId('editor');
    // Simulate user typing — set innerHTML and fire input
    editor.innerHTML = '<p>Typed</p>';
    fireEvent.input(editor);
    vi.advanceTimersByTime(300);
    // onChange called with 'Typed' — now rerender with that value
    expect(onChange).toHaveBeenCalledWith('Typed');
    // The internal ref tracks 'Typed', so rerender with same value should not reset
    const spy = vi.spyOn(editor, 'innerHTML', 'set');
    render(<TestEditor value="Typed" onChange={onChange} />);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  // --- HTML → Markdown conversion ---

  it('converts bold HTML to markdown', () => {
    const onChange = vi.fn();
    render(<TestEditor value="" onChange={onChange} />);
    const editor = screen.getByTestId('editor');
    editor.innerHTML = '<p><strong>bold</strong> text</p>';
    fireEvent.input(editor);
    vi.advanceTimersByTime(300);
    expect(onChange).toHaveBeenCalledWith('**bold** text');
  });

  it('converts italic HTML to markdown', () => {
    const onChange = vi.fn();
    render(<TestEditor value="" onChange={onChange} />);
    const editor = screen.getByTestId('editor');
    editor.innerHTML = '<p><em>italic</em> text</p>';
    fireEvent.input(editor);
    vi.advanceTimersByTime(300);
    expect(onChange).toHaveBeenCalledWith('*italic* text');
  });

  it('converts strikethrough HTML to markdown', () => {
    const onChange = vi.fn();
    render(<TestEditor value="" onChange={onChange} />);
    const editor = screen.getByTestId('editor');
    editor.innerHTML = '<p><del>struck</del> text</p>';
    fireEvent.input(editor);
    vi.advanceTimersByTime(300);
    expect(onChange).toHaveBeenCalledWith('~~struck~~ text');
  });

  it('converts unordered list HTML to markdown', () => {
    const onChange = vi.fn();
    render(<TestEditor value="" onChange={onChange} />);
    const editor = screen.getByTestId('editor');
    editor.innerHTML = '<ul><li>One</li><li>Two</li></ul>';
    fireEvent.input(editor);
    vi.advanceTimersByTime(300);
    expect(onChange).toHaveBeenCalledWith('- One\n- Two');
  });

  it('converts ordered list HTML to markdown', () => {
    const onChange = vi.fn();
    render(<TestEditor value="" onChange={onChange} />);
    const editor = screen.getByTestId('editor');
    editor.innerHTML = '<ol><li>One</li><li>Two</li></ol>';
    fireEvent.input(editor);
    vi.advanceTimersByTime(300);
    expect(onChange).toHaveBeenCalledWith('1. One\n2. Two');
  });

  it('converts link HTML to markdown', () => {
    const onChange = vi.fn();
    render(<TestEditor value="" onChange={onChange} />);
    const editor = screen.getByTestId('editor');
    editor.innerHTML = '<p><a href="https://example.com">click</a></p>';
    fireEvent.input(editor);
    vi.advanceTimersByTime(300);
    expect(onChange).toHaveBeenCalledWith('[click](https://example.com)');
  });

  it('converts mixed formatting to markdown', () => {
    const onChange = vi.fn();
    render(<TestEditor value="" onChange={onChange} />);
    const editor = screen.getByTestId('editor');
    editor.innerHTML =
      '<p><strong>Bold</strong> and <em>italic</em></p>' +
      '<ul><li>Item</li></ul>';
    fireEvent.input(editor);
    vi.advanceTimersByTime(300);
    expect(onChange).toHaveBeenCalledWith('**Bold** and *italic*\n\n- Item');
  });

  // --- Format commands ---

  it('calls document.execCommand when format is invoked', () => {
    render(<TestEditor value="" onChange={() => {}} />);
    fireEvent.click(screen.getByTestId('bold'));
    expect(execCommandSpy).toHaveBeenCalledWith('bold', false);
  });

  it('calls correct execCommand for each format', () => {
    render(<TestEditor value="" onChange={() => {}} />);

    fireEvent.click(screen.getByTestId('italic'));
    expect(execCommandSpy).toHaveBeenCalledWith('italic', false);

    fireEvent.click(screen.getByTestId('strikethrough'));
    expect(execCommandSpy).toHaveBeenCalledWith('strikeThrough', false);

    fireEvent.click(screen.getByTestId('ul'));
    expect(execCommandSpy).toHaveBeenCalledWith('insertUnorderedList', false);

    fireEvent.click(screen.getByTestId('ol'));
    expect(execCommandSpy).toHaveBeenCalledWith('insertOrderedList', false);
  });

  // --- Keyboard shortcuts ---

  it('handles Ctrl+B for bold', () => {
    render(<TestEditor value="" onChange={() => {}} />);
    fireEvent.keyDown(screen.getByTestId('editor'), {
      key: 'b',
      ctrlKey: true,
    });
    expect(execCommandSpy).toHaveBeenCalledWith('bold', false);
  });

  it('handles Cmd+B for bold (macOS)', () => {
    render(<TestEditor value="" onChange={() => {}} />);
    fireEvent.keyDown(screen.getByTestId('editor'), {
      key: 'b',
      metaKey: true,
    });
    expect(execCommandSpy).toHaveBeenCalledWith('bold', false);
  });

  it('handles Ctrl+I for italic', () => {
    render(<TestEditor value="" onChange={() => {}} />);
    fireEvent.keyDown(screen.getByTestId('editor'), {
      key: 'i',
      ctrlKey: true,
    });
    expect(execCommandSpy).toHaveBeenCalledWith('italic', false);
  });

  it('handles Ctrl+K to open link dialog', () => {
    render(<TestEditor value="" onChange={() => {}} />);
    expect(screen.queryByTestId('link-dialog')).not.toBeInTheDocument();
    fireEvent.keyDown(screen.getByTestId('editor'), {
      key: 'k',
      ctrlKey: true,
    });
    expect(screen.getByTestId('link-dialog')).toBeInTheDocument();
  });

  it('ignores non-modified key presses', () => {
    render(<TestEditor value="" onChange={() => {}} />);
    execCommandSpy.mockClear();
    fireEvent.keyDown(screen.getByTestId('editor'), { key: 'b' });
    expect(execCommandSpy).not.toHaveBeenCalled();
  });

  // --- Paste ---

  it('strips HTML and inserts plain text on paste', () => {
    render(<TestEditor value="" onChange={() => {}} />);
    const editor = screen.getByTestId('editor');
    const clipboardData = {
      getData: vi.fn().mockReturnValue('Plain text'),
    };
    fireEvent.paste(editor, { clipboardData });
    expect(clipboardData.getData).toHaveBeenCalledWith('text/plain');
    expect(execCommandSpy).toHaveBeenCalledWith(
      'insertText',
      false,
      'Plain text',
    );
  });

  // --- Link dialog ---

  it('opens link dialog', () => {
    render(<TestEditor value="" onChange={() => {}} />);
    expect(screen.queryByTestId('link-dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('link'));
    expect(screen.getByTestId('link-dialog')).toBeInTheDocument();
  });

  it('closes link dialog', () => {
    render(<TestEditor value="" onChange={() => {}} />);
    fireEvent.click(screen.getByTestId('link'));
    expect(screen.getByTestId('link-dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('close-link'));
    expect(screen.queryByTestId('link-dialog')).not.toBeInTheDocument();
  });
});
