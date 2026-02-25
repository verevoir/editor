import { useState, useCallback, useRef } from 'react';
import type { BlockDefinition, FieldRecord } from '@nextlake/schema';

/** Current state of a block form managed by {@link useBlockForm}. */
export interface BlockFormState {
  value: Record<string, unknown>;
  /** Field-path → error message. Empty when valid. Populated after `validate()` fails. */
  errors: Record<string, string>;
  /** `true` once `onChange` has been called at least once since the last reset. */
  dirty: boolean;
  /** `true` when `errors` is empty. Does not eagerly re-validate — reflects the last `validate()` call. */
  valid: boolean;
}

/** Actions returned by {@link useBlockForm} to mutate form state. */
export interface BlockFormActions {
  onChange: (data: Record<string, unknown>) => void;
  /** Run block validation. Returns `true` if valid, `false` if not (and populates `errors`). */
  validate: () => boolean;
  /** Reset to the initial data passed to the hook. Clears errors and dirty flag. */
  reset: () => void;
}

/**
 * React hook that manages form state for a block definition.
 * Returns `[state, actions]` — pass `state.value` and `actions.onChange` to `BlockEditor`.
 * Validation is explicit: call `actions.validate()` to populate `state.errors`.
 */
export function useBlockForm(
  block: BlockDefinition<FieldRecord>,
  initialData: Record<string, unknown>,
): [BlockFormState, BlockFormActions] {
  const [value, setValue] = useState<Record<string, unknown>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const initialRef = useRef(initialData);

  const onChange = useCallback((data: Record<string, unknown>) => {
    setValue(data);
    setDirty(true);
    setErrors({});
  }, []);

  const validate = useCallback((): boolean => {
    try {
      block.validate(value);
      setErrors({});
      return true;
    } catch (err: unknown) {
      if (isZodError(err)) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of err.issues) {
          const path = issue.path.join('.');
          if (!fieldErrors[path]) {
            fieldErrors[path] = issue.message;
          }
        }
        setErrors(fieldErrors);
      }
      return false;
    }
  }, [block, value]);

  const reset = useCallback(() => {
    setValue(initialRef.current);
    setErrors({});
    setDirty(false);
  }, []);

  const valid = Object.keys(errors).length === 0;

  return [
    { value, errors, dirty, valid },
    { onChange, validate, reset },
  ];
}

/** Duck-type check for ZodError to work across Zod instances */
function isZodError(
  err: unknown,
): err is { issues: Array<{ path: (string | number)[]; message: string }> } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'issues' in err &&
    Array.isArray((err as Record<string, unknown>).issues)
  );
}
