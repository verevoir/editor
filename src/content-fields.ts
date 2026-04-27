/**
 * Server-safe entry — re-exports the React-free schema augmentation
 * helpers (`publishFields`, `tagsField`, `isLive`, `collectTags`,
 * `filterByTag`) so server-side code (Next.js route handlers, Astro
 * endpoints, schema registries pulled into route graphs) can import
 * them without dragging the editor's React modules into the server
 * bundle.
 *
 * The same identifiers are still exported from the main entry for
 * client-side consumers — this subpath is purely an isolation layer
 * for graph-coloured frameworks (React Server Components, Astro
 * client islands, etc.).
 */

export { publishFields, isLive } from './publishing.js';
export { tagsField, collectTags, filterByTag } from './tagging.js';
