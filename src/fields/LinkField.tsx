import { useState, useEffect, useRef } from 'react';
import type { FieldEditorProps } from '../types.js';
import { useLinkSearch, type LinkSearchResult } from '../LinkSearchContext.js';

type LinkKind = 'empty' | 'external' | 'internal';

const EXTERNAL_PROTOCOL =
  /^(?:https?|mailto|tel|ftp|sms|geo|news|nntp|gopher|wais|telnet):/i;

/**
 * Classify a link value as empty, external (has a protocol),
 * or internal (a slug or relative path).
 */
function classify(value: string): LinkKind {
  if (!value) return 'empty';
  if (EXTERNAL_PROTOCOL.test(value)) return 'external';
  return 'internal';
}

/**
 * Link field — a single text input that accepts a URL or a slug
 * and auto-detects which.
 *
 * UX states:
 * - Empty: text input + "browse" button. Type a URL/slug or click
 *   browse to open the picker.
 * - Editing: text input + browse button (same as empty, but with a
 *   value).
 * - Resolved: compact display showing the link's title (for known
 *   internal pages) or the URL (for external), with an "edit"
 *   button to switch back to editing mode.
 *
 * The picker uses the same `LinkSearchContext` as the rich-text
 * editor's inline links — set up a `LinkSearchProvider` once and
 * both surfaces benefit.
 *
 * Stores as a plain string. No discriminator field, no two-question
 * flow — internal vs external is inferred from the value.
 */
export function LinkField({
  name,
  field,
  value,
  onChange,
}: FieldEditorProps<string>) {
  const search = useLinkSearch();
  const currentValue = value ?? '';
  const kind = classify(currentValue);

  const [isEditing, setIsEditing] = useState(kind === 'empty');
  const [resolved, setResolved] = useState<LinkSearchResult | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  // When the value changes (e.g. from the picker), exit editing mode
  // and clear stale resolution. Synchronising local UI state from a
  // controlled value — not a derived render.
  useEffect(() => {
    if (kind === 'empty') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync local state from controlled prop
      setIsEditing(true);
      setResolved(null);
      return;
    }
    setIsEditing(false);
  }, [currentValue, kind]);

  // Resolve internal slugs to a title when search is available.
  useEffect(() => {
    if (kind !== 'internal' || !search) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear stale resolution
      setResolved(null);
      return;
    }
    let cancelled = false;
    search(currentValue).then((results) => {
      if (cancelled) return;
      const exact = results.find((r) => r.url === currentValue);
      setResolved(exact ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [currentValue, kind, search]);

  return (
    <div data-field={name} data-link-field data-link-kind={kind}>
      <label htmlFor={isEditing ? `${name}-input` : undefined}>
        {field.meta.label}
      </label>

      {isEditing ? (
        <EditView
          name={name}
          value={currentValue}
          required={field.meta.required}
          onChange={onChange}
          onPick={search ? () => setPickerOpen(true) : undefined}
        />
      ) : (
        <ResolvedView
          value={currentValue}
          kind={kind}
          resolved={resolved}
          onEdit={() => setIsEditing(true)}
        />
      )}

      {pickerOpen && search && (
        <PickerModal
          search={search}
          onPick={(result) => {
            onChange(result.url);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

// --- Edit view --------------------------------------------------------------

interface EditViewProps {
  name: string;
  value: string;
  required: boolean;
  onChange: (v: string) => void;
  onPick: (() => void) | undefined;
}

function EditView({ name, value, required, onChange, onPick }: EditViewProps) {
  const kind = classify(value);
  return (
    <div data-link-edit>
      <input
        id={`${name}-input`}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder="https://example.com or /about"
        data-link-input
      />
      {onPick && (
        <button
          type="button"
          onClick={onPick}
          aria-label="Browse internal pages"
          title="Browse internal pages"
          data-link-browse
        >
          Browse…
        </button>
      )}
      {value && (
        <span data-link-kind-badge data-link-kind={kind}>
          {kind === 'external' ? 'external' : 'internal'}
        </span>
      )}
    </div>
  );
}

// --- Resolved view ----------------------------------------------------------

interface ResolvedViewProps {
  value: string;
  kind: LinkKind;
  resolved: LinkSearchResult | null;
  onEdit: () => void;
}

function ResolvedView({ value, kind, resolved, onEdit }: ResolvedViewProps) {
  const display =
    kind === 'internal' && resolved ? resolved.title : displayUrl(value);
  const subtitle =
    kind === 'internal' && resolved
      ? resolved.url
      : kind === 'external'
        ? 'External link'
        : value;

  return (
    <div data-link-resolved data-link-kind={kind}>
      <div data-link-resolved-content>
        <div data-link-title>{display}</div>
        <div data-link-subtitle>{subtitle}</div>
      </div>
      <button type="button" onClick={onEdit} data-link-edit-button>
        Edit
      </button>
    </div>
  );
}

function displayUrl(url: string): string {
  // Drop protocol for compactness in display.
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

// --- Picker modal -----------------------------------------------------------

interface PickerModalProps {
  search: (query: string) => Promise<LinkSearchResult[]>;
  onPick: (result: LinkSearchResult) => void;
  onClose: () => void;
}

function PickerModal({ search, onPick, onClose }: PickerModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LinkSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initial load: empty query returns the most relevant items.
  useEffect(() => {
    inputRef.current?.focus();
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async search, set in callback
    setLoading(true);
    search(query).then((r) => {
      if (cancelled) return;
      setResults(r);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [query, search]);

  return (
    <div
      role="dialog"
      aria-label="Pick a page"
      data-link-picker
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div data-link-picker-backdrop onClick={onClose} />
      <div data-link-picker-panel>
        <header data-link-picker-header>
          <strong>Pick a page</strong>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title…"
          data-link-picker-search
        />
        <div data-link-picker-results>
          {loading && <div data-link-picker-loading>Searching…</div>}
          {!loading && results.length === 0 && (
            <div data-link-picker-empty>
              {query
                ? `No matches for "${query}"`
                : 'Nothing to show — try searching.'}
            </div>
          )}
          {!loading && results.length > 0 && (
            <ul>
              {results.map((r) => (
                <li key={r.id}>
                  <button type="button" onClick={() => onPick(r)}>
                    <span data-link-picker-result-title>{r.title}</span>
                    <span data-link-picker-result-meta>
                      {r.url}
                      {r.blockType && (
                        <>
                          {' · '}
                          <span data-link-picker-result-type>
                            {r.blockType}
                          </span>
                        </>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
