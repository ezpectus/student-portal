'use client';

import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dim' | 'dark';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial: Theme = stored === 'light' || stored === 'dim' || stored === 'dark'
      ? stored
      : prefersDark ? 'dark' : 'light';
    setTheme(initial);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('dim', theme === 'dim');
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  const toggle = () => setTheme((prev) => (
    prev === 'light' ? 'dim' : prev === 'dim' ? 'dark' : 'light'
  ));

  return { theme, toggle, mounted };
};
