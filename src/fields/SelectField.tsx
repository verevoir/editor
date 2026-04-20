import type { z } from 'zod';
import type { FieldEditorProps } from '../types.js';
import { unwrapSchema, getZodDef } from '../utils.js';

export function SelectField({
  name,
  field,
  value,
  onChange,
}: FieldEditorProps<string>) {
  const unwrapped: z.ZodType = unwrapSchema(field.schema);
  const def = getZodDef(unwrapped);
  const options: string[] =
    def?.type === 'enum' && def.entries ? Object.values(def.entries) : [];

  return (
    <select
      id={name}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      required={field.meta.required}
    >
      <option value="">Select...</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}
