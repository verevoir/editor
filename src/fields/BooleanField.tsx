import type { FieldEditorProps } from '../types.js';

/**
 * Boolean fields render in `bare` shell mode (see FieldRenderer):
 * the FieldShell does not draw a fieldset around them. Instead the
 * field renders its own inline label next to the checkbox so the
 * control reads as one unit ("☑ Append site title suffix").
 */
export function BooleanField({
  name,
  field,
  value,
  onChange,
}: FieldEditorProps<boolean>) {
  return (
    <label htmlFor={name} data-boolean-label>
      <input
        id={name}
        type="checkbox"
        checked={value ?? false}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{field.meta.label}</span>
    </label>
  );
}
