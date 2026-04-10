import type { FieldEditorProps } from '../types.js';
import { ChipsArrayField } from './ChipsArrayField.js';
import { TableArrayField } from './TableArrayField.js';
import { CardGridArrayField } from './CardGridArrayField.js';
import { DrilldownArrayField } from './DrilldownArrayField.js';

const SCALAR_UI_HINTS = new Set(['text', 'number']);
const SIMPLE_CELL_HINTS = new Set([
  'text',
  'number',
  'boolean',
  'select',
  'reference',
  'link',
]);
const TABLE_MAX_COLUMNS = 4;

/**
 * Dispatcher for array fields. Picks the right renderer based on:
 *
 * 1. Explicit `display` hint on the field metadata (`.display(...)` in
 *    the schema). Wins if present and recognised.
 * 2. Otherwise auto-detects from the item shape:
 *    - scalar items (text, number) → ChipsArrayField
 *    - object items with ≤4 simple fields → TableArrayField
 *    - object items with more fields, or any non-simple field → CardGridArrayField
 *    - everything else → DrilldownArrayField (the fallback)
 *
 * Each variant is a real field component — this dispatcher just picks
 * one and forwards. To use a custom renderer, pass it via `overrides`
 * on BlockEditor.
 */
export function ArrayField(props: FieldEditorProps<unknown[]>) {
  /* eslint-disable react-hooks/static-components */
  const Component = pickArrayComponent(props);
  return <Component {...props} />;
  /* eslint-enable react-hooks/static-components */
}

function pickArrayComponent(props: FieldEditorProps<unknown[]>) {
  const display = props.field.meta.display;

  // Explicit hint wins
  if (display === 'chips') return ChipsArrayField;
  if (display === 'table') return TableArrayField;
  if (display === 'cards') return CardGridArrayField;
  if (display === 'drilldown') return DrilldownArrayField;
  // Unknown values silently fall through to auto-detection (forwards
  // compatible with hint values not yet implemented).

  // Auto-detect from item shape
  const itemMeta = props.field.meta.itemMeta;
  const itemUi = itemMeta?.ui;

  if (itemUi && SCALAR_UI_HINTS.has(itemUi)) {
    return ChipsArrayField;
  }

  if (itemUi === 'object' && itemMeta?.objectFields) {
    const fields = Object.values(itemMeta.objectFields);
    if (fields.length === 0) return DrilldownArrayField;

    const allSimple = fields.every((f) => SIMPLE_CELL_HINTS.has(f.meta.ui));

    if (allSimple && fields.length <= TABLE_MAX_COLUMNS) {
      return TableArrayField;
    }

    // Object items that don't fit a table — too many fields, or
    // contain nested arrays/objects/rich-text. Fall through to
    // cards instead of drilldown — the cards view is friendlier.
    return CardGridArrayField;
  }

  return DrilldownArrayField;
}
