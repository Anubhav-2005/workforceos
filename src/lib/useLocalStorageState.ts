"use client";

import { useEffect, useState } from "react";

type LocalStorageOptions<T> = {
  validate?: (value: unknown) => value is T;
};

export function useLocalStorageState<T>(key: string, initialValue: T, options: LocalStorageOptions<T> = {}) {
  const { validate } = options;
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(key);
        if (saved) {
          const parsed: unknown = JSON.parse(saved);
          if (!validate || validate(parsed)) {
            setValue(parsed as T);
          } else {
            window.localStorage.removeItem(key);
          }
        }
      } catch {
        try {
          window.localStorage.removeItem(key);
        } catch {
          // Storage can be unavailable in privacy-restricted browser contexts.
        }
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [key, validate]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Keep the in-memory state usable when storage quota or browser policy blocks persistence.
    }
  }, [hydrated, key, value]);

  return [value, setValue, hydrated] as const;
}
