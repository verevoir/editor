import type { FieldEditorProps } from '../types.js';
import { useReferenceOptions } from '../ReferenceOptionsContext.js';

export function ReferenceField({
  name,
  field,
  value,
  onChange,
}: FieldEditorProps<string>) {
  const options = useReferenceOptions(field.meta.targetBlockType);

  return (
    <div data-field={name}>
      <label htmlFor={name}>{field.meta.label}</label>
      <select
        id={name}
        name={name}
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value)}
        required={field.meta.required}
      >
        <option value="">Select...</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
