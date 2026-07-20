'use client';

import { Dispatch, SetStateAction,useCallback, useEffect, useState } from 'react';

type DefaultValue<T> = T | (() => T);

export const useLocalStorage = <T extends Object>(
  key: string,
  defaultValue?: DefaultValue<T>,
): [T | undefined, Dispatch<SetStateAction<T | undefined>>, () => void] => {
  const [value, setValue] = useState<T | undefined>(() => {
    if (typeof defaultValue === 'function') {
      return (defaultValue as Function)() as T;
    }
    return defaultValue;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const storageValue = window.localStorage.getItem(key);
      if (storageValue) {
        setValue(JSON.parse(storageValue) as T);
      }
    } catch {
      // ignore
    }
  }, [key]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (value === undefined) {
      return window.localStorage.removeItem(key);
    }

    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  const remove = useCallback(() => {
    setValue(undefined);
  }, []);

  return [value, setValue, remove];
};
