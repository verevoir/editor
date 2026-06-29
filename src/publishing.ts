import {
  text,
  select,
  type FieldDefinition,
  type StringField,
  type UIHint,
} from '@verevoir/schema';

/**
 * Local `datetime` helper — lives here instead of in @verevoir/schema
 * because the schema engine currently publishes UIHint as a strict
 * union that doesn't include `'datetime'`. This patch injects the
 * hint onto the StringField's meta so the editor's FieldRenderer
 * dispatches to DateTimeField by string key. Storage treats the
 * field as plain text. When the schema engine cuts a release with
 * `'datetime'` in UIHint, this helper should move there.
 */
function datetime(label: string): StringField {
  const field = text(label);
  (field.meta as { ui: UIHint }).ui = 'datetime' as UIHint;
  return field;
}

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
export function publishFields(): {
  status: FieldDefinition;
  publishFrom: FieldDefinition;
  publishTo: FieldDefinition;
} {
  return {
    status: select('Status', ['draft', 'published', 'archived']).default(
      'draft',
    ),
    publishFrom: datetime('Publish From').optional(),
    publishTo: datetime('Publish To').optional(),
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
