# @verevoir/editor

Lightweight React components that auto-render content editing forms from `@verevoir/schema` block definitions. The developer passes a `BlockDefinition` and data; the editor renders correct inputs based on each field's `UIHint`.

No validation logic lives here — the schema engine handles that. No storage dependency — the editor is pure UI.

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

## Setup

```bash
npm install        # install dependencies (links @verevoir/schema from ../schema-engine)
make build         # compile via tsup (ESM + CJS + .d.ts)
make test          # run vitest (jsdom, no Docker needed)
```

## Architecture

| File                              | Responsibility                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `src/types.ts`                    | Shared prop types — `FieldEditorProps`, `BlockEditorProps`, `FieldOverrides`                                       |
| `src/utils.ts`                    | `unwrapSchema()` strips ZodOptional/ZodDefault wrappers; `inferUIHint()` maps Zod types to UIHints                 |
| `src/BlockEditor.tsx`             | Top-level component — takes `BlockDefinition`, iterates fields, delegates to `FieldRenderer`                       |
| `src/FieldRenderer.tsx`           | Dispatch — maps UIHint to field component, resolves overrides (field-name > UIHint > default)                      |
| `src/PreviewFrame.tsx`            | Viewport-switching preview with zoom — renders children in a scaled, width-constrained surface                      |
| `src/fields/*.tsx`                | Eight built-in field components: Text, RichText, Number, Boolean, Select, Array, Object, Reference                 |
| `src/ReferenceOptionsContext.tsx` | `ReferenceOptionsProvider` + `useReferenceOptions` — React context providing reference options keyed by block type |
| `src/hooks/useBlockForm.ts`       | Optional hook — manages form state, validation via schema engine, dirty tracking                                   |
| `src/styles/*.css`                | Optional example CSS for PreviewFrame and BlockEditor forms — import to use, tree-shakes if not                    |

## Design Decisions

- **Fully controlled components** — no internal form state; `BlockEditor` takes `value` + `onChange`
- **Rich text = textarea for v1** — overridable via the override mechanism
- **Override mechanism** — `overrides` prop maps field names or UIHints to custom components
- **Zod introspection** — SelectField reads `ZodEnum.options`, ArrayField reads `ZodArray.element`, ObjectField reads `ZodObject.shape`
- **No `<form>` tag** — the developer controls form submission, styling, and layout
- **Peer deps** — react, react-dom, zod are peer dependencies to avoid duplicate instances

## Commands

- `make build` — compile TypeScript (ESM + CJS + .d.ts)
- `make test` — run tests with vitest (jsdom environment)
- `make run` — no-op (this is a library)
