import { useEffect, useState } from 'react';
import type { FieldEditorProps } from '../types.js';
import { useRichText } from '../hooks/useRichText.js';
import { useLinkSearch } from '../LinkSearchContext.js';
import type { LinkSearchResult } from '../LinkSearchContext.js';

export function RichTextField({
  name,
  field,
  value,
  onChange,
}: FieldEditorProps<string>) {
  const { editorRef, handlers, actions, state } = useRichText(
    value ?? '',
    onChange,
  );

  return (
    <div data-field={name}>
      <label>{field.meta.label}</label>
      <div data-rich-text>
        <div
          data-rich-text-toolbar
          role="toolbar"
          aria-label="Text formatting"
          onMouseDown={(e) => e.preventDefault()}
        >
          <button
            type="button"
            onClick={() => actions.format('bold')}
            title="Bold (Ctrl+B)"
            data-active={state.activeFormats.has('bold') || undefined}
            aria-pressed={state.activeFormats.has('bold')}
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            onClick={() => actions.format('italic')}
            title="Italic (Ctrl+I)"
            data-active={state.activeFormats.has('italic') || undefined}
            aria-pressed={state.activeFormats.has('italic')}
          >
            <em>I</em>
          </button>
          <button
            type="button"
            onClick={() => actions.format('strikeThrough')}
            title="Strikethrough"
            data-active={state.activeFormats.has('strikethrough') || undefined}
            aria-pressed={state.activeFormats.has('strikethrough')}
          >
            <del>S</del>
          </button>
          <span data-rich-text-separator />
          <button
            type="button"
            onClick={() => actions.format('insertUnorderedList')}
            title="Bullet list"
            data-active={state.activeFormats.has('ul') || undefined}
            aria-pressed={state.activeFormats.has('ul')}
          >
            &#8226;
          </button>
          <button
            type="button"
            onClick={() => actions.format('insertOrderedList')}
            title="Numbered list"
            data-active={state.activeFormats.has('ol') || undefined}
            aria-pressed={state.activeFormats.has('ol')}
          >
            1.
          </button>
          <span data-rich-text-separator />
          <button
            type="button"
            onClick={actions.openLinkDialog}
            title="Link (Ctrl+K)"
            data-active={state.getActiveLink() !== null || undefined}
          >
            &#128279;
          </button>
        </div>
        <div
          ref={editorRef}
          data-rich-text-content
          contentEditable
          role="textbox"
          aria-multiline="true"
          aria-label={field.meta.label}
          {...handlers}
        />
      </div>
      {state.showLinkDialog && (
        <LinkDialog
          currentUrl={state.getActiveLink()}
          onConfirm={actions.insertLink}
          onRemove={actions.removeLink}
          onCancel={actions.closeLinkDialog}
        />
      )}
    </div>
  );
}

// --- Link Dialog ---

interface LinkDialogProps {
  currentUrl: string | null;
  onConfirm: (url: string) => void;
  onRemove: () => void;
  onCancel: () => void;
}

function LinkDialog({
  currentUrl,
  onConfirm,
  onRemove,
  onCancel,
}: LinkDialogProps) {
  const search = useLinkSearch();
  const [mode, setMode] = useState<'external' | 'internal'>(
    search ? 'internal' : 'external',
  );
  const [url, setUrl] = useState(currentUrl ?? '');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LinkSearchResult[]>([]);

  useEffect(() => {
    let cancelled = false;
    const pending =
      mode === 'internal' && search && query.trim()
        ? search(query.trim())
        : Promise.resolve([]);
    pending.then((r) => {
      if (!cancelled) setResults(r);
    });
    return () => {
      cancelled = true;
    };
  }, [query, mode, search]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) onConfirm(url.trim());
  };

  return (
    <div data-rich-text-link-dialog>
      {search && (
        <div data-rich-text-link-tabs>
          <button
            type="button"
            onClick={() => setMode('internal')}
            data-active={mode === 'internal' || undefined}
          >
            Internal
          </button>
          <button
            type="button"
            onClick={() => setMode('external')}
            data-active={mode === 'external' || undefined}
          >
            External
          </button>
        </div>
      )}

      {mode === 'external' ? (
        <form onSubmit={handleSubmit}>
          <input
            type="url"
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            autoFocus
          />
          <div data-rich-text-link-actions>
            <button type="submit">Insert</button>
            {currentUrl && (
              <button type="button" onClick={onRemove}>
                Remove
              </button>
            )}
            <button type="button" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div>
          <input
            type="text"
            placeholder="Search documents..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {results.length > 0 && (
            <div data-rich-text-link-results>
              {results.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onConfirm(r.url)}
                >
                  <span>{r.title}</span>
                  <span data-rich-text-link-type>{r.blockType}</span>
                </button>
              ))}
            </div>
          )}
          {query.trim() && results.length === 0 && (
            <p data-rich-text-link-empty>No results</p>
          )}
          <div data-rich-text-link-actions>
            {currentUrl && (
              <button type="button" onClick={onRemove}>
                Remove
              </button>
            )}
            <button type="button" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
