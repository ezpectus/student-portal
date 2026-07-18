'use client';

import { useEffect, useState } from 'react';

import { getUnreadMailCount } from '@/actions/msg.actions';
import { Badge } from '@/components/ui/badge';
import { Show } from '@/components/utils/show';

export const UnreadMailBadge = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchCount = async () => {
      const n = await getUnreadMailCount();
      if (!cancelled) setCount(n);
    };

    fetchCount();
    const interval = setInterval(fetchCount, 60_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <Show when={count > 0}>
      <Badge variant="error" className="h-5 min-w-5 px-1.5 text-xs">
        {count > 99 ? '99+' : count}
      </Badge>
    </Show>
  );
};
