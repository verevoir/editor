import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

/**
 * Request passed to the copy generation function.
 *
 * - `fieldName` — the field key (e.g. "bio", "abstract")
 * - `fieldLabel` — the human-readable label (e.g. "Speaker Bio")
 * - `hint` — per-field directive from the content model (e.g. "Third person, 2-3 sentences")
 * - `currentValue` — the existing content (markdown), empty string if blank
 * - `context` — sibling field values from the same block, for additional context
 */
export interface CopyAssistRequest {
  fieldName: string;
  fieldLabel: string;
  hint?: string;
  currentValue: string;
  context: Record<string, unknown>;
}

/**
 * Async function that generates suggested copy.
 * The implementation is owned by the app — the editor doesn't know about LLMs.
 */
export type CopyAssistFn = (request: CopyAssistRequest) => Promise<string>;

const CopyAssistContext = createContext<CopyAssistFn | null>(null);

export interface CopyAssistProviderProps {
  generate: CopyAssistFn;
  children: ReactNode;
}

/**
 * Provides an async copy generation function to rich text fields.
 * If not provided, the suggest button is not shown.
 */
export function CopyAssistProvider({
  generate,
  children,
}: CopyAssistProviderProps) {
  return (
    <CopyAssistContext.Provider value={generate}>
      {children}
    </CopyAssistContext.Provider>
  );
}

export function useCopyAssist(): CopyAssistFn | null {
  return useContext(CopyAssistContext);
}
