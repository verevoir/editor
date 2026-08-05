# @verevoir/editor

Auto-generated React editing UI for [`@verevoir/schema`](https://www.npmjs.com/package/@verevoir/schema) block definitions. Pass a block and its data, get a working form. Swap or extend any field component without touching the schema.

```bash
npm install @verevoir/editor @verevoir/schema
```

**Peers:** `react`, `react-dom`, `zod` — provide your own to avoid duplicate instances.

## Quick start

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

That's the whole loop. Every field in the schema renders an appropriate input, labelled from `.label`, hinted via `.hint()`, wrapped in a fieldset legend with an optional help-icon popover.

## What's in it

### Field components

Ten built-in fields covering the schema's UI hints:

- **`TextField`**, **`RichTextField`**, **`NumberField`**, **`BooleanField`**, **`SelectField`** — single-value inputs
- **`DateTimeField`** — natural-language date input ("tomorrow", "tuesday", "4 June") resolved on blur + native time picker, stored as UTC ISO
- **`LinkField`** — single input that auto-detects internal-vs-external, with a Browse dropdown for picking internal documents
- **`ReferenceField`** — picker that surfaces options via `ReferenceOptionsProvider` context
- **`ArrayField`** — dispatcher that picks the right variant:
  - `ChipsArrayField` for scalar arrays (strings, numbers)
  - `TableArrayField` for arrays of small objects (list + modal editing, drag-and-drop reorder)
  - `CardGridArrayField` for arrays of medium objects (5+ fields or richer content)
  - `DrilldownArrayField` as the fallback
- **`ObjectField`** — nested fieldset for composite fields

Route to a different variant per field with `.display('cards')` / `.display('table')` in the schema, or override wholesale via `BlockEditor`'s `overrides` prop.

### Augmentation helpers

Drop-in field sets that compose into any block:

```typescript
import { publishFields, tagsField } from '@verevoir/editor';
import { defineBlock, text, richText } from '@verevoir/schema';

const article = defineBlock({
  name: 'article',
  fields: {
    title: text('Title'),
    body: richText('Body'),
    ...publishFields(), // status, publishFrom, publishTo
    ...tagsField(), // tags: string[]
  },
});
```

- **`publishFields()`** — adds `status` (`'draft' | 'published' | 'archived'`), `publishFrom`, `publishTo`. Pair with `isLive(data)` on public renders so drafts don't leak.
- **`tagsField()`** — adds `tags: string[]` with the chip input. `collectTags(docs)` and `filterByTag(docs, name)` are pure app-level helpers for autocomplete and query.

The pattern: editor-layer features are schema augmentations, not storage primitives. Storage stays shape-agnostic; resolution functions read the fields at runtime.

### Rich-text context providers

Optional integrations for richer editing inside `RichTextField`:

- **`ReferenceOptionsProvider`** — supplies id/label pairs for reference pickers
- **`LinkSearchProvider`** — supplies an async search function for internal linking inside markdown
- **`CopyAssistProvider`** — supplies an async "generate copy" function; the editor calls it, the app owns the LLM and the prompt

All three are thin context surfaces — the app owns the data and the policy, the editor owns the UI.

### Preview frame

```tsx
import { PreviewFrame } from '@verevoir/editor';

<PreviewFrame defaultViewport="Tablet">
  <h1>{page.title}</h1>
  <div dangerouslySetInnerHTML={{ __html: page.body }} />
</PreviewFrame>;
```

Viewport-switching container with zoom. Content is arbitrary React — the frame knows nothing about content blocks.

### Controls

Three ready-made content blocks (`heroBlock`, `contentBlock`, `carouselBlock`) with matching renderers. Use as examples for your own blocks, or import them directly.

## Styling

Field markup uses `data-` attributes exclusively — no class names to lock onto. Optional CSS files provide sensible starting points:

```tsx
import '@verevoir/editor/styles/editor-form.css';
import '@verevoir/editor/styles/preview-frame.css';
```

Or write your own against the documented data attributes. [`@verevoir/admin`](https://www.npmjs.com/package/@verevoir/admin) ships a heavier theme you can copy.

## Design decisions

- **Fully controlled.** `BlockEditor` takes `value` + `onChange`. No internal form state; consumer owns the data.
- **Schema introspection.** `SelectField` reads `ZodEnum.options`. `ArrayField` dispatches based on `ZodArray.element`'s shape. `ObjectField` reads `ZodObject.shape`. A `getZodDef(schema)` helper tolerates both live zod instances and JSON-roundtripped schemas (for Astro `client:only` islands and similar).
- **Override mechanism.** `overrides` prop on `BlockEditor` maps field names or UI hints to custom components. Field name wins over UI hint wins over default.
- **No `<form>` tag.** The developer controls submission, validation timing, layout.

## See it in a real app

The [Verevoir starter](https://github.com/verevoir/astro-sanity-starter) embeds this editor inside [`@verevoir/admin`](https://www.npmjs.com/package/@verevoir/admin) with a live preview iframe and tag-based release scheduling.

## Docs

- [Getting started](https://verevoir.io/docs/getting-started)
- [Content controls](https://verevoir.io/docs/content-controls) — polymorphic sections for page builders
- [Integration guide](https://verevoir.io/docs/integration)

## License

MIT
