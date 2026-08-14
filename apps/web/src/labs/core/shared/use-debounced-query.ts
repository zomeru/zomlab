import { useEffect, useRef, useState } from "react";

interface UseDebouncedQueryOptions {
  onQueryChange: (query: string) => void;
  query: string;
  wait?: number;
}

export function useDebouncedQuery({ onQueryChange, query, wait = 300 }: UseDebouncedQueryOptions) {
  const [queryDraft, setQueryDraft] = useState(query);
  const externalQuery = useRef(query);

  useEffect(() => {
    if (query !== externalQuery.current) {
      externalQuery.current = query;
      setQueryDraft(query);
      return;
    }

    const timeoutId = setTimeout(() => {
      if (queryDraft !== query) {
        onQueryChange(queryDraft);
      }
    }, wait);

    return () => clearTimeout(timeoutId);
  }, [onQueryChange, query, queryDraft, wait]);

  return { queryDraft, setQueryDraft };
}
