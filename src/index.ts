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
export { ReferenceField } from './fields/ReferenceField.js';

// Reference context
export {
  ReferenceOptionsProvider,
  useReferenceOptions,
} from './ReferenceOptionsContext.js';

// Link search context
export { LinkSearchProvider, useLinkSearch } from './LinkSearchContext.js';

// Hooks
export { useBlockForm } from './hooks/useBlockForm.js';
export { useRichText } from './hooks/useRichText.js';

// Preview
export { PreviewFrame } from './PreviewFrame.js';

// Markdown utilities
export { markdownToHtml, htmlToMarkdown } from './markdown.js';

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
export type {
  RichTextActions,
  RichTextState,
  RichTextHandlers,
} from './hooks/useRichText.js';
export type {
  ReferenceOption,
  ReferenceOptionsMap,
  ReferenceOptionsProviderProps,
} from './ReferenceOptionsContext.js';

export type {
  LinkSearchResult,
  LinkSearchFn,
  LinkSearchProviderProps,
} from './LinkSearchContext.js';

export type { Viewport, PreviewFrameProps } from './PreviewFrame.js';
