import type { z } from 'zod';
import type { FieldEditorProps } from '../types.js';
import { unwrapSchema, inferUIHint, getZodDef } from '../utils.js';
import { FieldRenderer } from '../FieldRenderer.js';

/**
 * Vertical drill-down list of items, each fully rendered via
 * FieldRenderer. The original "ArrayField" — fallback for arrays whose
 * shape isn't a good fit for the more specialised renderers (chips,
 * table, cards). Used as the default when an array contains deeply
 * nested data or items the dispatcher can't classify.
 */
export function DrilldownArrayField({
  name,
  field,
  value,
  onChange,
}: FieldEditorProps<unknown[]>) {
  const items = value ?? [];
  const unwrapped = unwrapSchema(field.schema);
  const def = getZodDef(unwrapped);
  const elementSchema: z.ZodType | undefined =
    def?.type === 'array' ? def.element : undefined;
  const elementHint = elementSchema ? inferUIHint(elementSchema) : 'text';

  const handleItemChange = (index: number, itemValue: unknown) => {
    const next = [...items];
    next[index] = itemValue;
    onChange(next);
  };

  const handleAdd = () => {
    onChange([...items, elementSchema ? getDefault(elementSchema) : '']);
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div data-array-display="drilldown">
      {items.map((item, index) => (
        <div key={index} data-array-item={index}>
          {elementSchema && (
            <FieldRenderer
              name={`${name}.${index}`}
              field={{
                // Cast avoids a zod 4 packaging quirk: `elementSchema`
                // comes from `getZodDef(...).element` (typed on our
                // side as v4 ZodType) but FieldDefinition here uses
                // the v3-compat ZodType shape.
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                schema: elementSchema as any,
                meta: field.meta.itemMeta
                  ? {
                      ...field.meta.itemMeta,
                      label: `${field.meta.label} ${index + 1}`,
                    }
                  : {
                      label: `${field.meta.label} ${index + 1}`,
                      ui: elementHint,
                      required: true,
                    },
              }}
              value={item}
              onChange={(v) => handleItemChange(index, v)}
            />
          )}
          <button
            type="button"
            onClick={() => handleRemove(index)}
            aria-label={`Remove ${field.meta.label} ${index + 1}`}
          >
            Remove
          </button>
        </div>
      ))}
      <button type="button" onClick={handleAdd}>
        Add {field.meta.label}
      </button>
    </div>
  );
}

function getDefault(schema: z.ZodType | undefined): unknown {
  if (!schema) return '';
  const unwrapped = unwrapSchema(schema);
  const name = getZodDef(unwrapped)?.type ?? '';
  if (name === 'string') return '';
  if (name === 'number') return 0;
  if (name === 'boolean') return false;
  if (name === 'array') return [];
  if (name === 'object') return {};
  return '';
}
