import { useEffect, useMemo, useRef, useState } from 'react';
import type { FieldEditorProps } from '../types.js';
import { useLinkSearch, type LinkSearchResult } from '../LinkSearchContext.js';

type LinkKind = 'empty' | 'external' | 'internal';

const EXTERNAL_PROTOCOL =
  /^(?:https?|mailto|tel|ftp|sms|geo|news|nntp|gopher|wais|telnet):/i;

function classify(value: string): LinkKind {
  if (!value) return 'empty';
  if (EXTERNAL_PROTOCOL.test(value)) return 'external';
  return 'internal';
}

const ALL_TYPES = '__all__';

/**
 * Link field — typeahead combobox.
 *
 * Two visual modes:
 *
 * - **Resolved**: an internal page is selected. The chip shows the
 *   page's block type (small uppercase label) and title. A clear
 *   button reverts to picking mode.
 * - **Picking** (default): an editable text input on the left, a type
 *   filter `<select>` and a "Browse" toggle on the right. As the
 *   value changes, a dropdown lists matching internal pages plus an
 *   "External link" row at the top showing the literal URL — picking
 *   it (or just leaving the value) commits the URL as-is.
 *
 * The type filter's options are discovered from the consumer's
 * search results — every new `blockType` (page, asset, etc.) appears
 * as a filter automatically, so wiring an asset adapter doesn't
 * require any change here.
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

  const [resolved, setResolved] = useState<LinkSearchResult | null>(null);
  const [results, setResults] = useState<LinkSearchResult[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>(ALL_TYPES);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  /** Search query inside the dropdown — independent of the URL input. */
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Resolve internal slugs to a title — the consumer's search returns
  // a list; we pick the one whose URL matches exactly.
  useEffect(() => {
    if (kind !== 'internal' || !search) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear stale resolution
      setResolved(null);
      return;
    }
    let cancelled = false;
    search(currentValue).then((r) => {
      if (cancelled) return;
      const exact = r.find((entry) => entry.url === currentValue);
      setResolved(exact ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [currentValue, kind, search]);

  // Browse search — driven by the dropdown's OWN search input, NOT
  // the URL input. Only runs while the dropdown is open. Empty query
  // is a "show me everything" signal — the consumer's search decides
  // what that means.
  useEffect(() => {
    if (!search || !dropdownOpen) return;
    let cancelled = false;
    search(searchQuery.trim()).then((r) => {
      if (!cancelled) setResults(r);
    });
    return () => {
      cancelled = true;
    };
  }, [searchQuery, search, dropdownOpen]);

  // Click-outside closes the dropdown.
  useEffect(() => {
    if (!dropdownOpen) return;
    const onPointer = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, [dropdownOpen]);

  // Available type options come from the union of result blockTypes
  // — that way an asset adapter that returns `blockType: 'asset'`
  // surfaces an "asset" filter immediately, no UI change needed.
  const availableTypes = useMemo(() => {
    const set = new Set<string>();
    for (const r of results) if (r.blockType) set.add(r.blockType);
    return Array.from(set).sort();
  }, [results]);

  const filteredResults = useMemo(() => {
    if (typeFilter === ALL_TYPES) return results;
    return results.filter((r) => r.blockType === typeFilter);
  }, [results, typeFilter]);

  const pickResult = (result: LinkSearchResult) => {
    onChange(result.url);
    setDropdownOpen(false);
    setSearchQuery('');
    inputRef.current?.blur();
  };

  const openBrowse = () => {
    setDropdownOpen(true);
    setSearchQuery('');
    // Focus the dropdown's search input so the user can start typing
    // a page name immediately. requestAnimationFrame waits for the
    // dropdown to render.
    requestAnimationFrame(() => searchInputRef.current?.focus());
  };

  // Resolved internal — chip with clear button.
  if (kind === 'internal' && resolved) {
    return (
      <div data-link-field data-link-kind={kind} ref={containerRef}>
        <div data-link-resolved>
          <div data-link-resolved-content>
            <div data-link-type>
              {(resolved.blockType ?? 'internal').toUpperCase()}
            </div>
            <div data-link-title>{resolved.title}</div>
          </div>
          <button
            type="button"
            data-link-clear
            aria-label="Clear link"
            title="Clear link"
            onClick={() => onChange('')}
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  // Picking mode — input + filter + browse + dropdown.
  return (
    <div data-link-field data-link-kind={kind} ref={containerRef}>
      <div data-link-edit>
        <input
          ref={inputRef}
          id={`${name}-input`}
          type="text"
          value={currentValue}
          onChange={(e) => onChange(e.target.value)}
          required={field.meta.required}
          placeholder="https://example.com or /about"
          data-link-input
          autoComplete="off"
        />
        {search && (
          <button
            type="button"
            onClick={() =>
              dropdownOpen ? setDropdownOpen(false) : openBrowse()
            }
            aria-label="Browse pages"
            title="Browse pages"
            data-link-browse
          >
            Browse
          </button>
        )}
      </div>

      {dropdownOpen && search && (
        <div data-link-dropdown role="listbox">
          <div data-link-dropdown-controls>
            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by name…"
              data-link-dropdown-search
              autoComplete="off"
            />
            {availableTypes.length > 0 && (
              <select
                data-link-type-filter
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                aria-label="Filter by type"
                title="Filter by type"
              >
                <option value={ALL_TYPES}>All types</option>
                {availableTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div data-link-dropdown-results>
            {filteredResults.map((r) => (
              <button
                key={r.id}
                type="button"
                role="option"
                data-link-dropdown-result
                onClick={() => pickResult(r)}
              >
                {r.blockType && (
                  <span data-link-dropdown-type>
                    {r.blockType.toUpperCase()}
                  </span>
                )}
                <span data-link-dropdown-title>{r.title}</span>
              </button>
            ))}
            {filteredResults.length === 0 && (
              <div data-link-dropdown-empty>
                {results.length === 0
                  ? 'No pages available.'
                  : 'No matches for this filter.'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
