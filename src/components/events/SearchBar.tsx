'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';

/**
 * Hero search box. Keeps the query in the URL (?q=) so searches are
 * shareable/bookmarkable and the server component does the actual filtering.
 */
export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get('q') ?? '';

  const [value, setValue] = useState(urlQuery);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Sync from the URL (back/forward navigation) unless the user is mid-typing.
  useEffect(() => {
    if (document.activeElement !== inputRef.current) setValue(urlQuery);
  }, [urlQuery]);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const commit = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = next.trim();
    if (trimmed) params.set('q', trimmed);
    else params.delete('q');
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : '/', { scroll: false });
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setValue(next);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => commit(next), 350);
  };

  const onClear = () => {
    clearTimeout(debounceRef.current);
    setValue('');
    commit('');
    inputRef.current?.focus();
  };

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        clearTimeout(debounceRef.current);
        commit(value);
        inputRef.current?.blur();
      }}
      className="flex w-full max-w-2xl items-center gap-2 rounded-xl border border-border bg-background py-2.5 pl-4 pr-2 shadow-sm transition-shadow focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20"
    >
      <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={onChange}
        placeholder="Search events, artists, or venues…"
        aria-label="Search events"
        className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}
