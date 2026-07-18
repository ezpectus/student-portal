import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}`,
}));

vi.mock('./use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

import { useServerErrorToast } from '@/hooks/use-server-error-toast';

describe('useServerErrorToast', () => {
  it('returns an errorToast function', () => {
    const { result } = renderHook(() => useServerErrorToast());
    expect(typeof result.current.errorToast).toBe('function');
  });

  it('calls toast with destructive variant and translated strings', () => {
    const { toast } = require('./use-toast');
    const { result } = renderHook(() => useServerErrorToast());

    result.current.errorToast();

    expect(toast).toHaveBeenCalledWith({
      variant: 'destructive',
      title: 'global.server-error.title',
      description: 'global.server-error.description',
    });
  });
});
