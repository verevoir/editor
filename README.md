# @nextlake/editor

Lightweight React components that auto-render content editing forms from [`@nextlake/schema`](https://github.com/adsurg/next-lake-schema-engine) block definitions. Pass a `BlockDefinition` and data; the editor renders correct inputs based on each field's `UIHint`.

No validation logic lives here — the schema engine handles that. No storage dependency — the editor is pure UI.

## Install

```bash
npm install @nextlake/editor
```

**Peer dependencies:** `react`, `react-dom`, and `zod` must be installed in your project to avoid duplicate instances.

## Quick Start

```tsx
import { defineBlock, text, richText, boolean } from '@nextlake/schema';
import { BlockEditor, useBlockForm } from '@nextlake/editor';

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

## Architecture

| File                        | Responsibility                                                                                     |
| --------------------------- | -------------------------------------------------------------------------------------------------- |
| `src/types.ts`              | Shared prop types — `FieldEditorProps`, `BlockEditorProps`, `FieldOverrides`                       |
| `src/utils.ts`              | `unwrapSchema()` strips ZodOptional/ZodDefault wrappers; `inferUIHint()` maps Zod types to UIHints |
| `src/BlockEditor.tsx`       | Top-level component — takes `BlockDefinition`, iterates fields, delegates to `FieldRenderer`       |
| `src/FieldRenderer.tsx`     | Dispatch — maps UIHint to field component, resolves overrides (field-name > UIHint > default)      |
| `src/fields/*.tsx`          | Seven built-in field components: Text, RichText, Number, Boolean, Select, Array, Object            |
| `src/hooks/useBlockForm.ts` | Optional hook — manages form state, validation via schema engine, dirty tracking                   |

## Design Decisions

- **Fully controlled components** — no internal form state; `BlockEditor` takes `value` + `onChange`.
- **Rich text = textarea for v1** — overridable via the override mechanism.
- **Override mechanism** — `overrides` prop maps field names or UIHints to custom components.
- **Zod introspection** — SelectField reads `ZodEnum.options`, ArrayField reads `ZodArray.element`, ObjectField reads `ZodObject.shape`.
- **No `<form>` tag** — the developer controls form submission, styling, and layout.

## Development

```bash
npm install    # Install dependencies (links @nextlake/schema from ../schema-engine)
make build     # Compile via tsup (ESM + CJS + .d.ts)
make test      # Run vitest (jsdom, no Docker needed)
make lint      # Check formatting
```
