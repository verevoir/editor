import { useEffect, useRef, useState } from 'react';
import type { FieldDefinition, FieldRecord } from '@verevoir/schema';
import type { z } from 'zod';
import type { FieldEditorProps } from '../types.js';
import { FieldRenderer } from '../FieldRenderer.js';
import { unwrapSchema, getZodDef } from '../utils.js';

type Row = Record<string, unknown>;

/**
 * List editor for arrays of small object items (action buttons, nav
 * links, anything else with a handful of scalar fields).
 *
 * Each row shows a drag handle, a primary/secondary preview of the
 * row's content, and stacked up/down controls. Clicking a row opens
 * a modal dialog with the full edit form (driven by the same
 * FieldRenderer used everywhere else) plus a delete button. Inline
 * editing is deliberately not offered — modal editing keeps the row
 * compact and lets richer fields (link pickers, etc.) work properly.
 *
 * Reorder is via drag-and-drop or the up/down buttons. Native HTML5
 * drag for zero deps; the buttons stay so keyboard users have a
 * path. (No touchscreen support — admin is laptop-first.)
 */
export function TableArrayField({
  name,
  field,
  value,
  onChange,
}: FieldEditorProps<unknown[]>) {
  const items = (value ?? []) as Row[];
  const emit = (next: Row[]) => (onChange as (v: unknown[]) => void)(next);

  const columns: FieldRecord = field.meta.itemMeta?.objectFields ?? {};
  const columnEntries = Object.entries(columns);

  // Element schema (the inner zod object) — kept around so the
  // dispatcher hook below can reuse it for default values when a row
  // is added.
  const unwrapped = unwrapSchema(field.schema);
  const def = getZodDef(unwrapped);
  const elementSchema: z.ZodType | undefined =
    def?.type === 'array' ? def.element : undefined;

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);

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
    // Open the modal on the new row so the user lands in edit mode
    // immediately — saves a click, and an empty row in the list
    // would look broken.
    setEditingIndex(items.length);
  };

  const handleRemove = (index: number) => {
    emit(items.filter((_, i) => i !== index) as Row[]);
    if (editingIndex === index) setEditingIndex(null);
    else if (editingIndex !== null && editingIndex > index)
      setEditingIndex(editingIndex - 1);
  };

  const handleMove = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    emit(next);
    if (editingIndex === from) setEditingIndex(to);
  };

  const dropAt = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const adjusted = targetIndex > dragIndex ? targetIndex - 1 : targetIndex;
    handleMove(dragIndex, adjusted);
  };

  if (columnEntries.length === 0) {
    return (
      <div data-array-display="list">
        <p>
          Cannot render — no field metadata available. Use{' '}
          <code>array(...)</code> with an <code>object(...)</code> item.
        </p>
      </div>
    );
  }

  // Pick a primary preview field (label-ish) and an optional
  // secondary (url-ish) for the row summary. Falls through to the
  // first text field, then anything, so unusual schemas still render
  // *something* meaningful.
  const primaryKey =
    pickKey(columnEntries, 'label', 'name', 'title', 'heading') ??
    columnEntries.find(([, f]) => isTextish(f))?.[0] ??
    columnEntries[0][0];
  const secondaryKey =
    pickKey(columnEntries, 'url', 'href', 'link', 'description') ??
    columnEntries.find(([k, f]) => k !== primaryKey && isTextish(f))?.[0];

  const editingRow = editingIndex !== null ? items[editingIndex] : null;

  return (
    <div data-array-display="list">
      <ol data-list-array>
        {items.length === 0 ? (
          <li data-list-array-empty>
            No items. Click &quot;Add&quot; to create one.
          </li>
        ) : (
          items.map((row, index) => {
            const primary = formatValue(row[primaryKey]) || '(untitled)';
            const secondary = secondaryKey
              ? formatValue(row[secondaryKey])
              : '';
            return (
              <li
                key={index}
                data-list-array-item
                data-list-array-dragging={
                  dragIndex === index ? 'true' : undefined
                }
                data-list-array-drop-target={
                  dropTarget === index && dragIndex !== index
                    ? 'true'
                    : undefined
                }
                onDragOver={(e) => {
                  if (dragIndex === null) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (dropTarget !== index) setDropTarget(index);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  dropAt(index);
                  setDragIndex(null);
                  setDropTarget(null);
                }}
                onDragLeave={(e) => {
                  if (e.currentTarget.contains(e.relatedTarget as Node | null))
                    return;
                  if (dropTarget === index) setDropTarget(null);
                }}
              >
                <span
                  data-list-array-grip
                  aria-label="Drag to reorder"
                  title="Drag to reorder"
                  role="button"
                  tabIndex={-1}
                  draggable
                  onDragStart={(e) => {
                    setDragIndex(index);
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', String(index));
                  }}
                  onDragEnd={() => {
                    setDragIndex(null);
                    setDropTarget(null);
                  }}
                >
                  <GripDots />
                </span>
                <button
                  type="button"
                  data-list-array-row
                  onClick={() => setEditingIndex(index)}
                >
                  <span data-list-array-primary>{primary}</span>
                  {secondary && (
                    <span data-list-array-secondary>{secondary}</span>
                  )}
                </button>
                <div data-list-array-controls>
                  <button
                    type="button"
                    onClick={() => handleMove(index, index - 1)}
                    disabled={index === 0}
                    aria-label="Move up"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(index, index + 1)}
                    disabled={index === items.length - 1}
                    aria-label="Move down"
                    title="Move down"
                  >
                    ↓
                  </button>
                </div>
              </li>
            );
          })
        )}
      </ol>
      <button type="button" onClick={handleAdd} data-list-array-add>
        + Add {field.meta.itemMeta?.label ?? field.meta.label}
      </button>

      {editingIndex !== null && editingRow && (
        <ItemModal
          name={`${name}.${editingIndex}`}
          row={editingRow}
          columns={columnEntries}
          onChange={(key, v) => handleCellChange(editingIndex, key, v)}
          onDelete={() => handleRemove(editingIndex)}
          onClose={() => setEditingIndex(null)}
        />
      )}

      {/* Marker keeps elementSchema referenced — strict TS would
         otherwise warn. The default-row helper is the only caller. */}
      <span hidden data-zod-marker={String(typeof elementSchema)} />
    </div>
  );
}

interface ItemModalProps {
  name: string;
  row: Row;
  columns: [string, FieldDefinition][];
  onChange: (key: string, value: unknown) => void;
  onDelete: () => void;
  onClose: () => void;
}

function ItemModal({
  name,
  row,
  columns,
  onChange,
  onDelete,
  onClose,
}: ItemModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Use the native <dialog> showModal API for proper modal behaviour
  // (focus trap, ::backdrop, esc-to-close). React's controlled props
  // don't trigger it — call the imperative API once on mount.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    const handleClose = () => onClose();
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  return (
    <dialog ref={dialogRef} data-list-array-dialog>
      <form
        method="dialog"
        data-list-array-dialog-form
        onSubmit={(e) => e.preventDefault()}
      >
        <div data-list-array-dialog-fields>
          {columns.map(([key, fieldDef]) => (
            <FieldRenderer
              key={key}
              name={`${name}.${key}`}
              field={fieldDef}
              value={row[key]}
              onChange={(v) => onChange(key, v)}
              blockValue={row}
            />
          ))}
        </div>
        <div data-list-array-dialog-actions>
          <button
            type="button"
            data-list-array-dialog-delete
            onClick={() => {
              if (confirm('Delete this item?')) onDelete();
            }}
          >
            Delete
          </button>
          <button type="button" data-list-array-dialog-done onClick={onClose}>
            Done
          </button>
        </div>
      </form>
    </dialog>
  );
}

function GripDots() {
  return (
    <svg
      viewBox="0 0 12 20"
      width="12"
      height="20"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="3" cy="3" r="1.2" />
      <circle cx="9" cy="3" r="1.2" />
      <circle cx="3" cy="7" r="1.2" />
      <circle cx="9" cy="7" r="1.2" />
      <circle cx="3" cy="11" r="1.2" />
      <circle cx="9" cy="11" r="1.2" />
      <circle cx="3" cy="15" r="1.2" />
      <circle cx="9" cy="15" r="1.2" />
      <circle cx="3" cy="19" r="1.2" />
      <circle cx="9" cy="19" r="1.2" />
    </svg>
  );
}

function pickKey(
  entries: [string, FieldDefinition][],
  ...candidates: string[]
): string | undefined {
  for (const candidate of candidates) {
    const found = entries.find(([k]) => k === candidate);
    if (found) return found[0];
  }
  return undefined;
}

function isTextish(field: FieldDefinition): boolean {
  return (
    field.meta.ui === 'text' ||
    field.meta.ui === 'link' ||
    field.meta.ui === 'rich-text'
  );
}

function formatValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  return '';
}

function defaultForField(field: FieldDefinition): unknown {
  switch (field.meta.ui) {
    case 'text':
    case 'rich-text':
    case 'select':
    case 'reference':
    case 'link':
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
