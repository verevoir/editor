import type { FieldEditorProps } from "../types.js";

export function BooleanField({ name, field, value, onChange }: FieldEditorProps<boolean>) {
  return (
    <div data-field={name}>
      <label htmlFor={name}>
        <input
          id={name}
          type="checkbox"
          checked={value ?? false}
          onChange={(e) => onChange(e.target.checked)}
        />
        {field.meta.label}
      </label>
    </div>
  );
}
