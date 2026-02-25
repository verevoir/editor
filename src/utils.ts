import type { z } from 'zod';
import type { UIHint } from '@nextlake/schema';

/**
 * Get the Zod type name from a schema's _def.
 * Uses string comparison instead of instanceof to work across Zod instances.
 */
function typeName(schema: z.ZodTypeAny): string {
  return schema._def?.typeName ?? '';
}

/** Strip ZodOptional and ZodDefault wrappers to get the inner schema */
export function unwrapSchema(schema: z.ZodTypeAny): z.ZodTypeAny {
  const name = typeName(schema);
  if (name === 'ZodOptional' || name === 'ZodDefault') {
    return unwrapSchema(schema._def.innerType);
  }
  return schema;
}

/** Infer a UIHint from a raw Zod schema type. Used for nested fields inside arrays/objects that lack FieldMeta. Falls back to `'text'`. */
export function inferUIHint(schema: z.ZodTypeAny): UIHint {
  const unwrapped = unwrapSchema(schema);
  const name = typeName(unwrapped);

  if (name === 'ZodEnum') return 'select';
  if (name === 'ZodArray') return 'array';
  if (name === 'ZodObject') return 'object';
  if (name === 'ZodBoolean') return 'boolean';
  if (name === 'ZodNumber') return 'number';
  if (name === 'ZodString') return 'text';

  return 'text';
}
