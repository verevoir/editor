import type { FieldEditorProps } from '../types.js';
import { ChipsArrayField } from './ChipsArrayField.js';
import { TableArrayField } from './TableArrayField.js';
import { DrilldownArrayField } from './DrilldownArrayField.js';

const SCALAR_UI_HINTS = new Set(['text', 'number']);
const TABLE_MAX_COLUMNS = 4;

/**
 * Dispatcher for array fields. Picks the right renderer based on:
 *
 * 1. Explicit `display` hint on the field metadata (`.display(...)` in
 *    the schema). Wins if present and recognised.
 * 2. Otherwise auto-detects from the item shape:
 *    - scalar items (text, number) → ChipsArrayField
 *    - object items with ≤4 simple fields → TableArrayField
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
    const columnCount = Object.keys(itemMeta.objectFields).length;
    if (columnCount > 0 && columnCount <= TABLE_MAX_COLUMNS) {
      // Only pick the table if every column is a simple input —
      // nested arrays/objects in a cell would render badly.
      const allSimple = Object.values(itemMeta.objectFields).every((f) => {
        const ui = f.meta.ui;
        return (
          ui === 'text' ||
          ui === 'number' ||
          ui === 'boolean' ||
          ui === 'select' ||
          ui === 'reference'
        );
      });
      if (allSimple) return TableArrayField;
    }
  }

  return DrilldownArrayField;
}
