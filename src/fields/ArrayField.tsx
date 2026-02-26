import type { z } from 'zod';
import type { FieldEditorProps } from '../types.js';
import { unwrapSchema, inferUIHint } from '../utils.js';
import { FieldRenderer } from '../FieldRenderer.js';

export function ArrayField({
  name,
  field,
  value,
  onChange,
}: FieldEditorProps<unknown[]>) {
  const items = value ?? [];
  const unwrapped = unwrapSchema(field.schema);
  const elementSchema: z.ZodTypeAny | undefined =
    unwrapped._def?.typeName === 'ZodArray' ? unwrapped._def.type : undefined;
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
    <div data-field={name}>
      <label>{field.meta.label}</label>
      {items.map((item, index) => (
        <div key={index} data-array-item={index}>
          {elementSchema && (
            <FieldRenderer
              name={`${name}.${index}`}
              field={{
                schema: elementSchema,
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

function getDefault(schema: z.ZodTypeAny | undefined): unknown {
  if (!schema) return '';
  const unwrapped = unwrapSchema(schema);
  const name = unwrapped._def?.typeName ?? '';
  if (name === 'ZodString') return '';
  if (name === 'ZodNumber') return 0;
  if (name === 'ZodBoolean') return false;
  if (name === 'ZodArray') return [];
  if (name === 'ZodObject') return {};
  return '';
}
