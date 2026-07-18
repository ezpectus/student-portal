'use server';

import { ColleagueContact } from '@/types/models/colleague-contact';
import { ContactType } from '@/types/models/contact';
import { apiFetch } from '@/lib/client';

export async function getColleagueContacts() {
  try {
    const response = await apiFetch<ColleagueContact[]>('contacts');

    if (!response.ok) {
      return [];
    }

    return (await response.json()) as ColleagueContact[];
  } catch {
    return [];
  }
}

export async function getColleagueContactTypes() {
  try {
    const response = await apiFetch<ContactType[]>('contacts/types');

    if (!response.ok) {
      return [];
    }

    return (await response.json()) as ContactType[];
  } catch {
    return [];
  }
}
