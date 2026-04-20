import type { FieldEditorProps, FieldOverrides } from './types.js';
import { FieldShell } from './FieldShell.js';
import { TextField } from './fields/TextField.js';
import { RichTextField } from './fields/RichTextField.js';
import { NumberField } from './fields/NumberField.js';
import { BooleanField } from './fields/BooleanField.js';
import { SelectField } from './fields/SelectField.js';
import { ArrayField } from './fields/ArrayField.js';
import { ObjectField } from './fields/ObjectField.js';
import { ReferenceField } from './fields/ReferenceField.js';
import { LinkField } from './fields/LinkField.js';
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
  reference: ReferenceField,
  link: LinkField,
};

/**
 * UI hints whose components own their entire layout (label inline,
 * special control shape, etc.) and don't want a fieldset wrapper.
 * The shell still renders, but in `bare` mode — no fieldset, no
 * legend — so the help icon and depth tracking still work.
 */
const BARE_FIELD_UIS = new Set(['boolean']);

export interface FieldRendererProps extends FieldEditorProps {
  overrides?: FieldOverrides;
}

/**
 * Resolves the correct field component for a field definition and
 * wraps it in a `<FieldShell>`. Resolution order: field-name
 * override > UIHint override > built-in default.
 *
 * The shell handles the label (rendered as a fieldset legend) and
 * the optional hint (rendered as a click-to-toggle help icon).
 * Field components themselves should not render their own label.
 */
export function FieldRenderer({
  name,
  field,
  value,
  onChange,
  overrides,
  blockValue,
}: FieldRendererProps) {
  /* eslint-disable react-hooks/static-components */
  const Component = resolveComponent(name, field.meta.ui, overrides);

  if (!Component) {
    return <div data-field={name}>Unknown field type: {field.meta.ui}</div>;
  }

  return (
    <FieldShell
      name={name}
      label={field.meta.label}
      hint={field.meta.hint}
      ui={field.meta.ui}
      bare={BARE_FIELD_UIS.has(field.meta.ui)}
    >
      <Component
        name={name}
        field={field}
        value={value}
        onChange={onChange}
        blockValue={blockValue}
      />
    </FieldShell>
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
