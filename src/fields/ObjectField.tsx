import type { z } from 'zod';
import type { FieldEditorProps } from '../types.js';
import { unwrapSchema, inferUIHint } from '../utils.js';
import { FieldRenderer } from '../FieldRenderer.js';

type ZodInternal = {
  _zod?: { def?: { type?: string; shape?: Record<string, z.ZodType> } };
};

export function ObjectField({
  name,
  field,
  value,
  onChange,
}: FieldEditorProps<Record<string, unknown>>) {
  const data = value ?? {};
  const unwrapped = unwrapSchema(field.schema);
  const def = (unwrapped as unknown as ZodInternal)._zod?.def;
  const shape: Record<string, z.ZodType> =
    def?.type === 'object' && def.shape ? def.shape : {};

  const handleFieldChange = (fieldName: string, fieldValue: unknown) => {
    onChange({ ...data, [fieldName]: fieldValue });
  };

  return (
    <fieldset data-field={name}>
      <legend>{field.meta.label}</legend>
      {Object.entries(shape).map(([key, subSchema]) => {
        const subDef = (subSchema as unknown as ZodInternal)._zod?.def;
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
    </fieldset>
  );
}
