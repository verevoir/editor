import type { FieldEditorProps } from '../types.js';
import { unwrapSchema } from '../utils.js';

export function SelectField({
  name,
  field,
  value,
  onChange,
}: FieldEditorProps<string>) {
  const unwrapped = unwrapSchema(field.schema);
  const options: string[] =
    unwrapped._def?.typeName === 'ZodEnum' ? unwrapped._def.values : [];

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
