'use client';

import { useTranslations } from 'next-intl';
import { debounce } from 'radash';
import { useCallback, useEffect, useRef, useState } from 'react';

import { searchByGroupName } from '@/actions/group.actions';
import { MagnifyingGlassRegular } from '@/app/images';
import { Input } from '@/components/ui/input';
import { Show } from '@/components/utils/show';
import { useServerErrorToast } from '@/hooks/use-server-error-toast';
import { Group } from '@/types/models/group';

import { CuratorSearchItem } from './curator-search-item';
import { EmptyPlaceholder } from './empty-placeholder';

export const CuratorSearch = () => {
  const t = useTranslations('public.curator-search');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const { errorToast } = useServerErrorToast();

  const unknownValue = t('unknown-value');
  const requestIdRef = useRef(0);

  const searchGroups = useCallback(async (name: string) => {
    const currentRequestId = ++requestIdRef.current;
    try {
      setIsLoading(true);

      const response = name ? await searchByGroupName(name) : [];

      if (currentRequestId !== requestIdRef.current) return;

      setGroups(response);
    } catch (error) {
      if (currentRequestId !== requestIdRef.current) return;
      errorToast();
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    searchGroups(search);
  }, [search, searchGroups]);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
  };

  return (
    <div className="flex w-full grow flex-col gap-4 rounded-lg border border-solid border-neutral-200 p-4">
      <Input
        placeholder={t('search-placeholder')}
        icon={<MagnifyingGlassRegular />}
        onChange={debounce({ delay: 200 }, handleChange)}
      />
      <div className="relative grow">
        <Show when={!search && !groups.length}>
          <EmptyPlaceholder text={t('search-default')} />
        </Show>
        <Show when={!!search && !groups.length}>
          <Show when={isLoading} fallback={<EmptyPlaceholder text={t('not-found')} />}>
            <EmptyPlaceholder text={t('searching')} />
          </Show>
        </Show>
        <Show when={!!groups.length}>
          <div className="absolute inset-0 overflow-y-auto">
            {groups.map((group) => (
              <CuratorSearchItem
                key={group.id}
                group={group.name}
                department={group.cathedra?.name || unknownValue}
                curatorName={group.curator?.fullName || unknownValue}
                link={group.curator?.profile}
              />
            ))}
          </div>
        </Show>
      </div>
    </div>
  );
};
