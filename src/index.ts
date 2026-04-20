// Components
export { BlockEditor } from './BlockEditor.js';
export { FieldRenderer } from './FieldRenderer.js';
export { FieldShell } from './FieldShell.js';
export type { FieldShellProps } from './FieldShell.js';

// Field components
export { TextField } from './fields/TextField.js';
export { RichTextField } from './fields/RichTextField.js';
export { NumberField } from './fields/NumberField.js';
export { BooleanField } from './fields/BooleanField.js';
export { SelectField } from './fields/SelectField.js';
export { ArrayField } from './fields/ArrayField.js';
export { ChipsArrayField } from './fields/ChipsArrayField.js';
export { TableArrayField } from './fields/TableArrayField.js';
export { CardGridArrayField } from './fields/CardGridArrayField.js';
export { DrilldownArrayField } from './fields/DrilldownArrayField.js';
export { ObjectField } from './fields/ObjectField.js';
export { ReferenceField } from './fields/ReferenceField.js';
export { LinkField } from './fields/LinkField.js';
export { DateTimeField } from './fields/DateTimeField.js';

// Reference context
export {
  ReferenceOptionsProvider,
  useReferenceOptions,
} from './ReferenceOptionsContext.js';

// Link search context
export { LinkSearchProvider, useLinkSearch } from './LinkSearchContext.js';

// Copy assist context
export { CopyAssistProvider, useCopyAssist } from './CopyAssistContext.js';

// Hooks
export { useBlockForm } from './hooks/useBlockForm.js';
export { useRichText } from './hooks/useRichText.js';

// Preview
export { PreviewFrame } from './PreviewFrame.js';

// Markdown utilities
export { markdownToHtml, htmlToMarkdown } from './markdown.js';

// Controls
export {
  heroBlock,
  HeroRenderer,
  heroControl,
  contentBlock,
  ContentRenderer,
  contentControl,
  carouselBlock,
  CarouselRenderer,
  carouselControl,
} from './controls/index.js';

// Publishing
export { publishFields, isLive } from './publishing.js';

// Tagging
export { tagsField, collectTags, filterByTag } from './tagging.js';

// Natural-language date parsing (internal to DateTimeField; exposed
// so tests and consumers can reuse — future home is @verevoir/time).
export { parseNaturalDate } from './parse-date.js';

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

export type {
  CopyAssistRequest,
  CopyAssistFn,
  CopyAssistProviderProps,
} from './CopyAssistContext.js';

export type { Viewport, PreviewFrameProps } from './PreviewFrame.js';

export type {
  ControlDefinition,
  ContentBlock,
  HeroData,
  ContentData,
  CarouselData,
  CarouselSlide,
} from './controls/index.js';
