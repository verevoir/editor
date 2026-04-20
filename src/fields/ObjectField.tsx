import type { z } from 'zod';
import type { FieldEditorProps } from '../types.js';
import { unwrapSchema, inferUIHint, getZodDef } from '../utils.js';
import { FieldRenderer } from '../FieldRenderer.js';

export function ObjectField({
  name,
  field,
  value,
  onChange,
}: FieldEditorProps<Record<string, unknown>>) {
  const data = value ?? {};
  const unwrapped = unwrapSchema(field.schema);
  const def = getZodDef(unwrapped);
  const shape: Record<string, z.ZodType> =
    def?.type === 'object' && def.shape ? def.shape : {};

  const handleFieldChange = (fieldName: string, fieldValue: unknown) => {
    onChange({ ...data, [fieldName]: fieldValue });
  };

  return (
    <>
      {Object.entries(shape).map(([key, subSchema]) => {
        const subDef = getZodDef(subSchema);
        const required = subDef?.type !== 'optional';
        return (
          <FieldRenderer
            key={key}
            name={`${name}.${key}`}
            field={{
              schema: subSchema,
              meta: {
                label: key,
                ui: inferUIHint(subSchema),
                required,
              },
            }}
            value={data[key]}
            onChange={(v) => handleFieldChange(key, v)}
          />
        );
      })}
    </>
  );
}
