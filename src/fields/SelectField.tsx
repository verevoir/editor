import type { z } from 'zod';
import type { FieldEditorProps } from '../types.js';
import { unwrapSchema } from '../utils.js';

type ZodInternal = {
  _zod?: { def?: { type?: string; entries?: Record<string, string> } };
};

export function SelectField({
  name,
  field,
  value,
  onChange,
}: FieldEditorProps<string>) {
  const unwrapped: z.ZodType = unwrapSchema(field.schema);
  const def = (unwrapped as unknown as ZodInternal)._zod?.def;
  const options: string[] =
    def?.type === 'enum' && def.entries ? Object.values(def.entries) : [];

  return (
    <div data-field={name}>
      <label htmlFor={name}>{field.meta.label}</label>
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
    </div>
  );
}
