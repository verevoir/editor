import type { z } from 'zod';
import type { UIHint } from '@verevoir/schema';

/**
 * Zod 4 stores its def under the non-enumerable `_zod` namespace, but
 * also mirrors `def` to the top level as an enumerable property. When
 * the schema is JSON-roundtripped (e.g. Astro's `client:only` props
 * serialization), `_zod` is stripped but the top-level `def` survives.
 * Read from either so the editor works in both contexts.
 */
export interface ZodDef {
  type?: string;
  entries?: Record<string, string>;
  element?: z.ZodType;
  shape?: Record<string, z.ZodType>;
  innerType?: z.ZodType;
}

export function getZodDef(schema: unknown): ZodDef | undefined {
  const s = schema as { _zod?: { def?: ZodDef }; def?: ZodDef } | null;
  return s?._zod?.def ?? s?.def;
}

function typeName(schema: z.ZodType): string {
  return getZodDef(schema)?.type ?? '';
}

/** Strip ZodOptional and ZodDefault wrappers to get the inner schema */
export function unwrapSchema(schema: z.ZodType): z.ZodType {
  const def = getZodDef(schema);
  if (def?.type === 'optional' || def?.type === 'default') {
    const inner = def.innerType;
    if (inner) return unwrapSchema(inner);
  }
  return schema;
}

/** Infer a UIHint from a raw Zod schema type. Used for nested fields inside arrays/objects that lack FieldMeta. Falls back to `'text'`. */
export function inferUIHint(schema: z.ZodType): UIHint {
  const unwrapped = unwrapSchema(schema);
  const name = typeName(unwrapped);

  if (name === 'enum') return 'select';
  if (name === 'array') return 'array';
  if (name === 'object') return 'object';
  if (name === 'boolean') return 'boolean';
  if (name === 'number') return 'number';
  if (name === 'string') return 'text';

  return 'text';
}
