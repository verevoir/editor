import type { BlockEditorProps } from './types.js';
import { FieldRenderer } from './FieldRenderer.js';

export function BlockEditor({
  block,
  value,
  onChange,
  overrides,
}: BlockEditorProps) {
  const handleFieldChange = (fieldName: string, fieldValue: unknown) => {
    onChange({ ...value, [fieldName]: fieldValue });
  };

  return (
    <div data-block={block.name}>
      {Object.entries(block.fields).map(([fieldName, field]) => (
        <FieldRenderer
          key={fieldName}
          name={fieldName}
          field={field}
          value={value[fieldName]}
          onChange={(v) => handleFieldChange(fieldName, v)}
          overrides={overrides}
        />
      ))}
    </div>
  );
}
