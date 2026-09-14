"use client";

import { useEffect, useState } from "react";

/**
 * Trails `value` by `delay`, so typing in a search box issues one request when
 * the user pauses rather than one per keystroke.
 */
export function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
