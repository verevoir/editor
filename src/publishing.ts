import { text, select } from '@verevoir/schema';

/**
 * Shared fields for any publishable block.
 *
 * Spread into a block definition:
 *   defineBlock({ name: 'page', fields: { title: text('Title'), ...publishFields() } })
 *
 * - status: editorial workflow state (draft → published → archived)
 * - publishFrom: optional embargo date (ISO string). Null = immediate.
 * - publishTo: optional expiry date (ISO string). Null = forever.
 *
 * Status and time window are independent axes. A version can be archived
 * at any time regardless of the window. The window is only consulted
 * when status is 'published'.
 */
export function publishFields() {
  return {
    status: select('Status', ['draft', 'published', 'archived']).default(
      'draft',
    ),
    publishFrom: text('Publish From').optional(),
    publishTo: text('Publish To').optional(),
  };
}

/**
 * Check whether a document is currently live (visible to the public).
 *
 * A document is live when:
 *   1. status === 'published'
 *   2. publishFrom is null or in the past
 *   3. publishTo is null or in the future
 *
 * Works on the document's data object — pass `doc.data` directly.
 */
export function isLive(
  data: { status?: unknown; publishFrom?: unknown; publishTo?: unknown },
  now: Date = new Date(),
): boolean {
  if (data.status !== 'published') return false;
  if (data.publishFrom && new Date(String(data.publishFrom)) > now)
    return false;
  if (data.publishTo && new Date(String(data.publishTo)) < now) return false;
  return true;
}
