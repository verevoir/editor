import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

export interface LinkSearchResult {
  id: string;
  url: string;
  title: string;
  blockType: string;
}

/**
 * Async search function for finding internal documents to link to.
 * Returns matching documents for the given query string.
 */
export type LinkSearchFn = (query: string) => Promise<LinkSearchResult[]>;

const LinkSearchContext = createContext<LinkSearchFn | null>(null);

export interface LinkSearchProviderProps {
  search: LinkSearchFn;
  children: ReactNode;
}

/**
 * Provides an async search function for internal document linking
 * in the RichTextField. If not provided, only external URLs are available.
 */
export function LinkSearchProvider({
  search,
  children,
}: LinkSearchProviderProps) {
  return (
    <LinkSearchContext.Provider value={search}>
      {children}
    </LinkSearchContext.Provider>
  );
}

export function useLinkSearch(): LinkSearchFn | null {
  return useContext(LinkSearchContext);
}
