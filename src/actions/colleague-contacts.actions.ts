'use server';

import { apiFetch } from '@/lib/client';
import { ColleagueContact } from '@/types/models/colleague-contact';
import { ContactType } from '@/types/models/contact';

export async function getColleagueContacts() {
  try {
    const response = await apiFetch('contacts');

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
    const response = await apiFetch('contacts/types');

    if (!response.ok) {
      return [];
    }

    return (await response.json()) as ContactType[];
  } catch {
    return [];
  }
}
