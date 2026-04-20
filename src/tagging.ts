import { array, text } from '@verevoir/schema';

/**
 * Shared field for any taggable block.
 *
 * Spread into a block definition:
 *   defineBlock({
 *     name: 'page',
 *     fields: { title: text('Title'), ...tagsField() },
 *   })
 *
 * Tags are stored as a plain string array inside `data`. Storage is
 * shape-agnostic and treats them like any other field — no new
 * primitives in @verevoir/storage. To query "all documents with tag
 * X", scan with `storage.list(blockType)` and filter on
 * `data.tags.includes(x)` in application code. At starter scale this
 * is fine; if it becomes a perf problem, lift to a storage-level
 * `containsAny` filter.
 *
 * The default UI is the existing ChipsArrayField — type + Enter/
 * comma to add, backspace to remove, dedupe built in. Consumers who
 * want autocomplete or a curated vocabulary can override the field
 * component via the BlockEditor's `overrides` prop.
 */
export function tagsField() {
  return {
    tags: array('Tags', text('Tag'))
      .default([])
      .hint(
        'Labels used to group documents — e.g. a release name, a workflow state, or a campaign.',
      ),
  };
}

/**
 * Harvest every unique tag used across a list of documents. Useful
 * for seeding an autocomplete list or showing "which tags are in
 * use" in the admin.
 *
 * Pure function — pass the documents you've already loaded from
 * storage. Mirrors `@verevoir/assets`' `collectExistingTags`
 * pattern: tags are app-level, storage stays dumb, scan in memory.
 */
export function collectTags(
  documents: Array<{ data: { tags?: unknown } }>,
): string[] {
  const seen = new Set<string>();
  for (const doc of documents) {
    const tags = doc.data?.tags;
    if (!Array.isArray(tags)) continue;
    for (const tag of tags) {
      if (typeof tag === 'string' && tag.length > 0) seen.add(tag);
    }
  }
  return [...seen].sort();
}

/**
 * Return documents where `data.tags` contains the given tag. Pure
 * filter over a list you've already loaded.
 */
export function filterByTag<T extends { data: { tags?: unknown } }>(
  documents: T[],
  tag: string,
): T[] {
  return documents.filter((doc) => {
    const tags = doc.data?.tags;
    return Array.isArray(tags) && tags.includes(tag);
  });
}
