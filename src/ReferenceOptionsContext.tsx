import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

export interface ReferenceOption {
  id: string;
  label: string;
}

export type ReferenceOptionsMap = Record<string, ReferenceOption[]>;

const ReferenceOptionsContext = createContext<ReferenceOptionsMap>({});

export interface ReferenceOptionsProviderProps {
  options: ReferenceOptionsMap;
  children: ReactNode;
}

export function ReferenceOptionsProvider({
  options,
  children,
}: ReferenceOptionsProviderProps) {
  return (
    <ReferenceOptionsContext.Provider value={options}>
      {children}
    </ReferenceOptionsContext.Provider>
  );
}

export function useReferenceOptions(
  targetBlockType?: string,
): ReferenceOption[] {
  const all = useContext(ReferenceOptionsContext);
  if (!targetBlockType) return [];
  return all[targetBlockType] ?? [];
}
