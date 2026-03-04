import type { ComponentType } from 'react';
import type {
  FieldDefinition,
  FieldRecord,
  BlockDefinition,
} from '@verevoir/schema';

/** Callback for field value changes */
export type FieldChangeHandler<T = unknown> = (value: T) => void;

/** Props shared by all field editor components */
export interface FieldEditorProps<T = unknown> {
  name: string;
  field: FieldDefinition;
  value: T;
  onChange: FieldChangeHandler<T>;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Map of field names or UIHints to custom React components. Field-name keys take priority over UIHint keys. */
export type FieldOverrides = Record<
  string,
  ComponentType<FieldEditorProps<any>>
>;
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Props for the top-level BlockEditor component */
export interface BlockEditorProps {
  block: BlockDefinition<FieldRecord>;
  value: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  overrides?: FieldOverrides;
}
