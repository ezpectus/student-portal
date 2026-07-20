'use server';

import queryString from 'query-string';

import { apiFetch } from '@/lib/client';
import { env } from '@/lib/env';
import { Group } from '@/types/models/group';

export async function searchByGroupName(search: string) {
  if (env.NEXT_PUBLIC_LOCAL_AUTH === 'true') {
    return [];
  }

  try {
    const query = queryString.stringify({ name: search });

    const response = await apiFetch(`group/find?${query}`);

    if (!response.ok) {
      return [];
    }

    return (await response.json()) as Group[];
  } catch {
    return [];
  }
}
