# Intent — @verevoir/editor

## Purpose

Auto-render content editing forms from schema engine block definitions so developers get a working editor UI without writing form code. The editor is a thin React layer — it maps field types to input components and gets out of the way.

## Goals

- Zero-config default: pass a block definition and data, get a working form
- Override anything — field-level and hint-level overrides let developers swap components without forking
- Fully controlled components — no hidden form state; the developer owns `value` and `onChange`
- Stay thin — the editor renders inputs, it does not validate, persist, or route

## Non-goals

- Own form state — `useBlockForm` is a convenience hook, not a requirement
- Validate data — validation is the schema engine's job; the editor calls it, not implements it
- Include storage logic — no fetch, no save, no API calls
- Provide layout or styling — the developer controls form structure, CSS, and submission
- Be framework-agnostic — React is the target; other frameworks would be separate packages

## Key design decisions

- **UIHint dispatch.** The editor reads each field's `UIHint` and maps it to a component. This is the only coupling to the schema engine — the editor never inspects Zod internals except for structural introspection (enum options, array element type, object shape).
- **Override mechanism.** `overrides` prop maps field names or UIHints to custom components. Field-name overrides take priority over UIHint overrides. This lets developers replace one field without touching others.
- **No `<form>` tag.** The developer controls form submission, enabling use cases where the editor is embedded in a larger page with its own form or save logic.
- **Peer dependencies.** React, react-dom, and zod are peer deps to avoid duplicate instances in the bundle. The schema engine is a git dependency.

## Constraints

- React is the only UI framework dependency
- No runtime dependency on `@verevoir/storage` or `@verevoir/access`
- Rich text is a textarea in v1 — the override mechanism is the escape hatch for richer editors
