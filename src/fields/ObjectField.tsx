import type { z } from 'zod';
import type { FieldEditorProps } from '../types.js';
import { unwrapSchema, inferUIHint } from '../utils.js';
import { FieldRenderer } from '../FieldRenderer.js';

export function ObjectField({
  name,
  field,
  value,
  onChange,
}: FieldEditorProps<Record<string, unknown>>) {
  const data = value ?? {};
  const unwrapped = unwrapSchema(field.schema);
  const shape: Record<string, z.ZodTypeAny> =
    unwrapped._def?.typeName === 'ZodObject' ? unwrapped._def.shape() : {};

  const handleFieldChange = (fieldName: string, fieldValue: unknown) => {
    onChange({ ...data, [fieldName]: fieldValue });
  };

  return (
    <fieldset data-field={name}>
      <legend>{field.meta.label}</legend>
      {Object.entries(shape).map(([key, subSchema]) => (
        <FieldRenderer
          key={key}
          name={`${name}.${key}`}
          field={{
            schema: subSchema,
            meta: {
              label: key,
              ui: inferUIHint(subSchema),
              required: subSchema._def?.typeName !== 'ZodOptional',
            },
          }}
          value={data[key]}
          onChange={(v) => handleFieldChange(key, v)}
        />
      ))}
    </fieldset>
  );
}
