import type { FieldEditorProps } from '../types.js';

export function TextField({
  name,
  field,
  value,
  onChange,
}: FieldEditorProps<string>) {
  return (
    <div data-field={name}>
      <label htmlFor={name}>{field.meta.label}</label>
      <input
        id={name}
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        required={field.meta.required}
      />
    </div>
  );
}
