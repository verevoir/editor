import type { FieldDefinition, FieldRecord } from '@verevoir/schema';
import type { z } from 'zod';
import type { FieldEditorProps } from '../types.js';
import { FieldRenderer } from '../FieldRenderer.js';
import { unwrapSchema } from '../utils.js';

type ZodInternal = {
  _zod?: { def?: { type?: string; element?: z.ZodType } };
};

type Row = Record<string, unknown>;

/**
 * Inline editable table for arrays of small object items.
 *
 * Each row is one item; each column is one field of the item's schema.
 * Edit values directly in the cells — no drill-down, no modal, no
 * context switch. Works best for items with ≤4 simple scalar fields
 * (e.g. action buttons with `label`/`url`/`theme`, nav links).
 *
 * Cell inputs are rendered via FieldRenderer so the same field
 * components used elsewhere (TextField, SelectField, BooleanField,
 * NumberField) handle each cell. Field hints render below the table
 * as a footnote, not per-cell, to keep the table compact.
 */
export function TableArrayField({
  name,
  field,
  value,
  onChange,
}: FieldEditorProps<unknown[]>) {
  const items = (value ?? []) as Row[];
  // The dispatcher passes us through with `unknown[]`; cast on the way
  // out so callers can keep their stricter types if they want.
  const emit = (next: Row[]) => (onChange as (v: unknown[]) => void)(next);

  // The columns come from the item's objectFields metadata. This is
  // populated by `object()` in @verevoir/schema and propagated through
  // `array()`'s itemMeta.
  const columns: FieldRecord = field.meta.itemMeta?.objectFields ?? {};
  const columnEntries = Object.entries(columns);

  // Element schema (the inner zod object) — used to seed new rows
  // with sensible defaults.
  const unwrapped = unwrapSchema(field.schema);
  const def = (unwrapped as unknown as ZodInternal)._zod?.def;
  const elementSchema: z.ZodType | undefined =
    def?.type === 'array' ? def.element : undefined;

  const handleCellChange = (rowIndex: number, key: string, v: unknown) => {
    const next = items.map((row, i) =>
      i === rowIndex ? { ...row, [key]: v } : row,
    );
    emit(next);
  };

  const handleAdd = () => {
    const newRow: Row = {};
    for (const [key, fieldDef] of columnEntries) {
      newRow[key] = defaultForField(fieldDef);
    }
    emit([...items, newRow]);
  };

  const handleRemove = (index: number) => {
    emit(items.filter((_, i) => i !== index) as Row[]);
  };

  const handleMove = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    emit(next);
  };

  const fieldsWithHints = columnEntries.filter(([, f]) => f.meta.hint);

  if (columnEntries.length === 0) {
    // Fallback if we don't have column info — shouldn't happen if the
    // schema was built with object() inside array(). Render a note so
    // the developer knows what's wrong rather than silently dropping
    // the data.
    return (
      <div data-field={name} data-array-display="table">
        <label>{field.meta.label}</label>
        <p>
          Cannot render as table — no field metadata available. Use{' '}
          <code>array(...)</code> with an <code>object(...)</code> item to
          enable table editing, or remove{' '}
          <code>.display(&quot;table&quot;)</code> to fall back to drill-down
          editing.
        </p>
      </div>
    );
  }

  return (
    <div data-field={name} data-array-display="table">
      <label>{field.meta.label}</label>
      <table data-array-table>
        <thead>
          <tr>
            {columnEntries.map(([key, fieldDef]) => (
              <th key={key} data-table-column={key}>
                {fieldDef.meta.label}
                {fieldDef.meta.required && <span data-required> *</span>}
              </th>
            ))}
            <th data-table-column-actions />
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr data-table-empty>
              <td colSpan={columnEntries.length + 1}>
                No items. Click &quot;Add&quot; to create one.
              </td>
            </tr>
          ) : (
            items.map((row, rowIndex) => (
              <tr key={rowIndex} data-table-row={rowIndex}>
                {columnEntries.map(([key, fieldDef]) => (
                  <td key={key} data-table-cell={key}>
                    <FieldRenderer
                      name={`${name}.${rowIndex}.${key}`}
                      field={{
                        schema: fieldDef.schema,
                        // Strip the column-level label so the cell input
                        // doesn't render its own header (the column header
                        // already shows it). Also strip the hint —
                        // hints render below the table.
                        meta: {
                          ...fieldDef.meta,
                          label: '',
                          hint: undefined,
                        },
                      }}
                      value={row[key]}
                      onChange={(v) => handleCellChange(rowIndex, key, v)}
                      blockValue={row}
                    />
                  </td>
                ))}
                <td data-table-row-actions>
                  <button
                    type="button"
                    onClick={() => handleMove(rowIndex, rowIndex - 1)}
                    disabled={rowIndex === 0}
                    aria-label="Move up"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(rowIndex, rowIndex + 1)}
                    disabled={rowIndex === items.length - 1}
                    aria-label="Move down"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(rowIndex)}
                    aria-label="Remove row"
                    title="Remove row"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <button type="button" onClick={handleAdd} data-table-add>
        + Add {field.meta.label}
      </button>
      {fieldsWithHints.length > 0 && (
        <dl data-table-hints>
          {fieldsWithHints.map(([key, fieldDef]) => (
            <div key={key}>
              <dt>{fieldDef.meta.label}</dt>
              <dd>{fieldDef.meta.hint}</dd>
            </div>
          ))}
        </dl>
      )}
      {/* Stop unused-import warning if z import is otherwise unused */}
      <span hidden data-zod-marker={String(typeof elementSchema)} />
    </div>
  );
}

function defaultForField(field: FieldDefinition): unknown {
  switch (field.meta.ui) {
    case 'text':
    case 'rich-text':
    case 'select':
    case 'reference':
      return '';
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'array':
      return [];
    case 'object':
      return {};
    default:
      return '';
  }
}
