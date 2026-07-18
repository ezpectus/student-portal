'use client';

import { Contrast, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';

export const ThemeToggle = () => {
  const { theme, toggle, mounted } = useTheme();

  if (!mounted) {
    return <div className="h-9 w-9" />;
  }

  return (
    <Button
      variant="tertiary"
      size="small"
      onClick={toggle}
      aria-label={`Theme: ${theme}. Switch theme`}
      title={`Theme: ${theme}`}
    >
      {theme === 'light' ? <Moon size={18} /> : theme === 'dim' ? <Contrast size={18} /> : <Sun size={18} />}
    </Button>
  );
};
