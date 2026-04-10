import type { z } from 'zod';
import type { UIHint } from '@verevoir/schema';

/**
 * Get the Zod 4 type discriminator from a schema's `_zod.def.type`.
 * Uses string comparison instead of instanceof to work across Zod instances
 * and avoid duplicate-package issues.
 */
function typeName(schema: z.ZodType): string {
  return (
    (schema as unknown as { _zod?: { def?: { type?: string } } })._zod?.def
      ?.type ?? ''
  );
}

/** Strip ZodOptional and ZodDefault wrappers to get the inner schema */
export function unwrapSchema(schema: z.ZodType): z.ZodType {
  const name = typeName(schema);
  if (name === 'optional' || name === 'default') {
    const inner = (
      schema as unknown as { _zod: { def: { innerType: z.ZodType } } }
    )._zod.def.innerType;
    return unwrapSchema(inner);
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
