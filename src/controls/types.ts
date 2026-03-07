import type { ComponentType } from 'react';
import type { FieldRecord, BlockDefinition } from '@verevoir/schema';

/** A content control — schema + renderer for a reusable content block type */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ControlDefinition<T = any> {
  type: string;
  label: string;
  block: BlockDefinition<FieldRecord>;
  Renderer: ComponentType<{ data: T }>;
}

/** A stored content block — type discriminator + control-specific data */
export interface ContentBlock {
  type: string;
  [key: string]: unknown;
}
