import type { FieldEditorProps } from "../types.js";

export function RichTextField({ name, field, value, onChange }: FieldEditorProps<string>) {
  return (
    <div data-field={name}>
      <label htmlFor={name}>{field.meta.label}</label>
      <textarea
        id={name}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        required={field.meta.required}
        rows={5}
      />
    </div>
  );
}
