import type { FieldEditorProps } from "../types.js";

export function NumberField({ name, field, value, onChange }: FieldEditorProps<number>) {
  return (
    <div data-field={name}>
      <label htmlFor={name}>{field.meta.label}</label>
      <input
        id={name}
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.valueAsNumber)}
        required={field.meta.required}
      />
    </div>
  );
}
