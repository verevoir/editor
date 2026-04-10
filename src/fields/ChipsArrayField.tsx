import { useState, type KeyboardEvent } from 'react';
import type { FieldEditorProps } from '../types.js';

/**
 * Inline tag/chip input for arrays of scalar values (strings, numbers).
 *
 * Type a value, press Enter or comma to add. Existing values render
 * as chips with a × button. Backspace on an empty input removes the
 * last chip. Faster than a drill-down for tag-style data.
 */
export function ChipsArrayField({
  name,
  field,
  value,
  onChange,
}: FieldEditorProps<unknown[]>) {
  const items = value ?? [];
  const [draft, setDraft] = useState('');

  const commit = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (items.includes(trimmed)) {
      setDraft('');
      return;
    }
    onChange([...items, trimmed]);
    setDraft('');
  };

  const removeAt = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit();
      return;
    }
    if (e.key === 'Backspace' && draft === '' && items.length > 0) {
      e.preventDefault();
      removeAt(items.length - 1);
    }
  };

  return (
    <div data-field={name} data-array-display="chips">
      <label htmlFor={`${name}-input`}>{field.meta.label}</label>
      <div data-chips-container>
        {items.map((item, index) => (
          <span key={index} data-chip={index}>
            <span data-chip-label>{String(item)}</span>
            <button
              type="button"
              onClick={() => removeAt(index)}
              aria-label={`Remove ${String(item)}`}
              data-chip-remove
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={`${name}-input`}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commit}
          placeholder={items.length === 0 ? 'Add item…' : ''}
          data-chip-input
        />
      </div>
    </div>
  );
}
