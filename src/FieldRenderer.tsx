import type { FieldEditorProps, FieldOverrides } from './types.js';
import { TextField } from './fields/TextField.js';
import { RichTextField } from './fields/RichTextField.js';
import { NumberField } from './fields/NumberField.js';
import { BooleanField } from './fields/BooleanField.js';
import { SelectField } from './fields/SelectField.js';
import { ArrayField } from './fields/ArrayField.js';
import { ObjectField } from './fields/ObjectField.js';
import type { ComponentType } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const builtInFields: Record<string, ComponentType<FieldEditorProps<any>>> = {
  text: TextField,
  'rich-text': RichTextField,
  number: NumberField,
  boolean: BooleanField,
  select: SelectField,
  array: ArrayField,
  object: ObjectField,
};

export interface FieldRendererProps extends FieldEditorProps {
  overrides?: FieldOverrides;
}

/**
 * Resolves the correct field component for a field definition.
 * Resolution order: field-name override > UIHint override > built-in default.
 */
export function FieldRenderer({
  name,
  field,
  value,
  onChange,
  overrides,
}: FieldRendererProps) {
  /* eslint-disable react-hooks/static-components */
  const Component = resolveComponent(name, field.meta.ui, overrides);

  if (!Component) {
    return <div data-field={name}>Unknown field type: {field.meta.ui}</div>;
  }

  return (
    <Component name={name} field={field} value={value} onChange={onChange} />
  );
  /* eslint-enable react-hooks/static-components */
}

function resolveComponent(
  name: string,
  uiHint: string,
  overrides?: FieldOverrides,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): ComponentType<FieldEditorProps<any>> | undefined {
  if (overrides?.[name]) return overrides[name];
  if (overrides?.[uiHint]) return overrides[uiHint];
  return builtInFields[uiHint];
}
