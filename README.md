# @verevoir/editor

Lightweight React components that auto-render content editing forms from [`@verevoir/schema`](https://github.com/verevoir/schema-engine) block definitions. Pass a `BlockDefinition` and data; the editor renders correct inputs based on each field's `UIHint`.

No validation logic lives here — the schema engine handles that. No storage dependency — the editor is pure UI.

## Install

```bash
npm install @verevoir/editor
```

**Peer dependencies:** `react`, `react-dom`, and `zod` must be installed in your project to avoid duplicate instances.

## Quick Start

```tsx
import { defineBlock, text, richText, boolean } from '@verevoir/schema';
import { BlockEditor, useBlockForm } from '@verevoir/editor';

const hero = defineBlock({
  name: 'hero',
  fields: {
    title: text('Title'),
    body: richText('Body'),
    visible: boolean('Visible'),
  },
});

function HeroEditor() {
  const [state, actions] = useBlockForm(hero, {
    title: '',
    body: '',
    visible: true,
  });
  return (
    <BlockEditor block={hero} value={state.value} onChange={actions.onChange} />
  );
}
```

## Preview Frame

Viewport-switching preview container with zoom control. Renders children in a scaled, width-constrained surface — no knowledge of content blocks.

```tsx
import { PreviewFrame } from '@verevoir/editor';

<PreviewFrame defaultViewport="Tablet">
  <h1>{page.title}</h1>
  <div dangerouslySetInnerHTML={{ __html: page.body }} />
</PreviewFrame>;
```

Custom viewports:

```tsx
<PreviewFrame
  viewports={[
    { label: 'Small', width: 320 },
    { label: 'Large', width: 1440 },
  ]}
  defaultViewport="Large"
>
  {children}
</PreviewFrame>
```

## Example Styles

The editor renders unstyled HTML with `data-` attributes. Optional CSS files provide a sensible starting point — import them to use, or copy and adapt:

```tsx
// Style BlockEditor form fields
import '@verevoir/editor/styles/editor-form.css';

// Style PreviewFrame
import '@verevoir/editor/styles/preview-frame.css';
```

For `editor-form.css`, wrap your `BlockEditor` in a container with `data-editor-form`:

```tsx
<div data-editor-form>
  <BlockEditor block={block} value={value} onChange={onChange} />
</div>
```

## Architecture

| File                        | Responsibility                                                                                     |
| --------------------------- | -------------------------------------------------------------------------------------------------- |
| `src/types.ts`              | Shared prop types — `FieldEditorProps`, `BlockEditorProps`, `FieldOverrides`                       |
| `src/utils.ts`              | `unwrapSchema()` strips ZodOptional/ZodDefault wrappers; `inferUIHint()` maps Zod types to UIHints |
| `src/BlockEditor.tsx`       | Top-level component — takes `BlockDefinition`, iterates fields, delegates to `FieldRenderer`       |
| `src/FieldRenderer.tsx`     | Dispatch — maps UIHint to field component, resolves overrides (field-name > UIHint > default)      |
| `src/PreviewFrame.tsx`      | Viewport-switching preview with zoom — renders children in a scaled, width-constrained surface     |
| `src/fields/*.tsx`          | Eight built-in field components: Text, RichText, Number, Boolean, Select, Array, Object, Reference |
| `src/hooks/useBlockForm.ts` | Optional hook — manages form state, validation via schema engine, dirty tracking                   |
| `src/styles/*.css`          | Optional example CSS for PreviewFrame and BlockEditor forms                                        |

## Design Decisions

- **Fully controlled components** — no internal form state; `BlockEditor` takes `value` + `onChange`.
- **Rich text = textarea for v1** — overridable via the override mechanism.
- **Override mechanism** — `overrides` prop maps field names or UIHints to custom components.
- **Zod introspection** — SelectField reads `ZodEnum.options`, ArrayField reads `ZodArray.element`, ObjectField reads `ZodObject.shape`.
- **No `<form>` tag** — the developer controls form submission, styling, and layout.

## Development

```bash
npm install    # Install dependencies (links @verevoir/schema from ../schema-engine)
make build     # Compile via tsup (ESM + CJS + .d.ts)
make test      # Run vitest (jsdom, no Docker needed)
make lint      # Check formatting
```
