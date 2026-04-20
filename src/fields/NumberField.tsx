import type { FieldEditorProps } from '../types.js';

export function NumberField({
  name,
  field,
  value,
  onChange,
}: FieldEditorProps<number>) {
  return (
    <input
      id={name}
      type="number"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.valueAsNumber)}
      required={field.meta.required}
    />
  );
}
