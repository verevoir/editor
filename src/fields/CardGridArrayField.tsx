import { useState } from 'react';
import type { FieldDefinition, FieldRecord } from '@verevoir/schema';
import type { z } from 'zod';
import type { FieldEditorProps } from '../types.js';
import { unwrapSchema, getZodDef } from '../utils.js';
import { BlockEditor } from '../BlockEditor.js';

type Item = Record<string, unknown>;

const SCALAR_PREVIEW_HINTS = new Set([
  'text',
  'rich-text',
  'select',
  'reference',
  'link',
  'number',
  'boolean',
]);

/**
 * Card grid view for arrays of medium-sized object items (5+ fields,
 * or items with nested arrays/objects). Shows each item as a compact
 * card with a summary of the first few fields; click an item to
 * expand it inline and edit the full form.
 *
 * Designed for content like cards, testimonials, gallery items —
 * anything where the items are structured but too rich to fit a
 * table row. Click-to-expand is the same pattern as the polymorphic
 * SectionsEditor in Verevoir consumer apps; here it's simpler
 * because every item has the same shape.
 *
 * Each item is rendered with the full BlockEditor (built from a
 * synthetic block definition based on the item's objectFields), so
 * nested arrays and other field types render with their own
 * specialised renderers — recursively. A cards section item with
 * its own cta array gets a TableArrayField for the cta inside the
 * expanded card.
 */
export function CardGridArrayField({
  field,
  value,
  onChange,
}: FieldEditorProps<unknown[]>) {
  const items = (value ?? []) as Item[];
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const itemFields: FieldRecord = field.meta.itemMeta?.objectFields ?? {};
  const fieldEntries = Object.entries(itemFields);
  const itemLabel = field.meta.itemMeta?.label ?? 'Item';

  // Synthesise a block definition for the item shape so we can hand
  // it to BlockEditor when an item is expanded. The schema engine's
  // BlockDefinition wraps a record of fields with a zod object schema
  // and a validate function — we don't need validate here, but the
  // shape must match.
  const unwrapped = unwrapSchema(field.schema);
  const def = getZodDef(unwrapped);
  const elementSchema: z.ZodType | undefined =
    def?.type === 'array' ? def.element : undefined;

  // Find a candidate "title" field — the first text-like field, or
  // the first field if nothing matches.
  const titleKey =
    fieldEntries.find(
      ([, f]) => f.meta.ui === 'text' || f.meta.ui === 'rich-text',
    )?.[0] ?? fieldEntries[0]?.[0];
  const subtitleKey = fieldEntries.find(
    ([key, f]) => key !== titleKey && SCALAR_PREVIEW_HINTS.has(f.meta.ui),
  )?.[0];

  const emit = (next: Item[]) => (onChange as (v: unknown[]) => void)(next);

  const handleItemChange = (index: number, next: Item) => {
    emit(items.map((item, i) => (i === index ? next : item)));
  };

  const handleAdd = () => {
    const newItem: Item = {};
    for (const [key, fieldDef] of fieldEntries) {
      newItem[key] = defaultForField(fieldDef);
    }
    emit([...items, newItem]);
    setOpenIndex(items.length);
  };

  const handleRemove = (index: number) => {
    emit(items.filter((_, i) => i !== index));
    if (openIndex === index) setOpenIndex(null);
    else if (openIndex !== null && openIndex > index)
      setOpenIndex(openIndex - 1);
  };

  const handleMove = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    emit(next);
    if (openIndex === from) setOpenIndex(to);
  };

  if (fieldEntries.length === 0) {
    return (
      <div data-array-display="cards">
        <p>
          Cannot render as cards — no field metadata available. Use{' '}
          <code>array(...)</code> with an <code>object(...)</code> item to
          enable card editing.
        </p>
      </div>
    );
  }

  return (
    <div data-array-display="cards">
      <div data-cards-header>
        <span data-cards-count>
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {items.length === 0 ? (
        <div data-cards-empty>
          <p>No {itemLabel.toLowerCase()}s yet. Add one below.</p>
        </div>
      ) : (
        <ol data-cards-list>
          {items.map((item, index) => {
            const isOpen = openIndex === index;
            const title =
              titleKey && item[titleKey]
                ? String(item[titleKey])
                : `${itemLabel} ${index + 1}`;
            const subtitle =
              subtitleKey && item[subtitleKey]
                ? truncate(String(item[subtitleKey]), 80)
                : null;

            return (
              <li
                key={index}
                data-card-item={index}
                data-card-open={isOpen ? 'true' : undefined}
              >
                <header data-card-header>
                  <button
                    type="button"
                    data-card-toggle
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                  >
                    <span data-card-title>{truncate(title, 60)}</span>
                    {subtitle && <span data-card-subtitle>{subtitle}</span>}
                  </button>
                  <div data-card-controls>
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
                    <button
                      type="button"
                      onClick={() => handleRemove(index)}
                      aria-label="Remove item"
                      title="Remove item"
                      data-card-remove
                    >
                      ×
                    </button>
                  </div>
                </header>

                {isOpen && elementSchema && (
                  <div data-card-body>
                    <BlockEditor
                      block={{
                        name: itemLabel,
                        fields: itemFields,
                        // The schema and validate are unused inside
                        // BlockEditor's iteration — it walks `fields`
                        // and renders each via FieldRenderer. We pass
                        // unknown casts here because synthesising a
                        // full BlockDefinition would require zod
                        // gymnastics for no benefit.
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        schema: elementSchema as any,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        validate: ((data: unknown) => data) as any,
                      }}
                      value={item}
                      onChange={(next) => handleItemChange(index, next)}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}

      <div data-cards-add>
        <button type="button" onClick={handleAdd} data-cards-add-button>
          + Add {itemLabel.toLowerCase()}
        </button>
      </div>
    </div>
  );
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + '…';
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
