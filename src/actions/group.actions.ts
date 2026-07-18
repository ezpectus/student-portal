'use server';

import queryString from 'query-string';

import { apiFetch } from '@/lib/client';
import { Group } from '@/types/models/group';

export async function searchByGroupName(search: string) {
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
