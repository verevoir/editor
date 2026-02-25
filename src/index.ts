// Components
export { BlockEditor } from './BlockEditor.js';
export { FieldRenderer } from './FieldRenderer.js';

// Field components
export { TextField } from './fields/TextField.js';
export { RichTextField } from './fields/RichTextField.js';
export { NumberField } from './fields/NumberField.js';
export { BooleanField } from './fields/BooleanField.js';
export { SelectField } from './fields/SelectField.js';
export { ArrayField } from './fields/ArrayField.js';
export { ObjectField } from './fields/ObjectField.js';

// Hooks
export { useBlockForm } from './hooks/useBlockForm.js';

// Utilities
export { unwrapSchema, inferUIHint } from './utils.js';

// Types
export type {
  FieldEditorProps,
  FieldChangeHandler,
  BlockEditorProps,
  FieldOverrides,
} from './types.js';

export type { FieldRendererProps } from './FieldRenderer.js';
export type { BlockFormState, BlockFormActions } from './hooks/useBlockForm.js';
