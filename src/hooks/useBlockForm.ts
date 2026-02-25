import { useState, useCallback, useRef } from "react";
import type { BlockDefinition, FieldRecord } from "@nextlake/schema";

export interface BlockFormState {
  value: Record<string, unknown>;
  errors: Record<string, string>;
  dirty: boolean;
  valid: boolean;
}

export interface BlockFormActions {
  onChange: (data: Record<string, unknown>) => void;
  validate: () => boolean;
  reset: () => void;
}

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
          const path = issue.path.join(".");
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

  return [{ value, errors, dirty, valid }, { onChange, validate, reset }];
}

/** Duck-type check for ZodError to work across Zod instances */
function isZodError(err: unknown): err is { issues: Array<{ path: (string | number)[]; message: string }> } {
  return (
    typeof err === "object" &&
    err !== null &&
    "issues" in err &&
    Array.isArray((err as any).issues)
  );
}
