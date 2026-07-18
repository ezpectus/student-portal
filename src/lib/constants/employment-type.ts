import { EmploymentType } from '@/types/enums/employment-type';

const EMPLOYMENT_TYPE_KEYS: Record<EmploymentType, string> = {
  [EmploymentType.Unknown]: 'unknown',
  [EmploymentType.FullTime]: 'full-time',
  [EmploymentType.PartTime]: 'part-time',
  [EmploymentType.PartTimeInternal]: 'part-time-internal',
  [EmploymentType.PartTimeExternal]: 'part-time-external',
};

export function getEmploymentTypeKey(type: EmploymentType): string {
  return EMPLOYMENT_TYPE_KEYS[type] ?? 'unknown';
}
