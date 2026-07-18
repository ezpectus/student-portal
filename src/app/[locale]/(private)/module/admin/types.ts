export interface AdminUser {
  id: number;
  username: string;
  fullName: string;
  email: string;
  photo: string;
  role: string;
  faculty: string | null;
  speciality: string | null;
  groupName: string | null;
  studyForm: string | null;
  status: string | null;
  studyYear: number;
  gpa: number;
  createdAt: Date;
  lastActiveAt: Date;
}

export interface AdminUserFilters {
  search: string;
  role: string;
  status: string;
  faculty: string;
}

export interface AdminUserDetail extends AdminUser {
  phone: string | null;
  address: string | null;
  birthDate: string | null;
  gradeBookNumber: string | null;
  codeOfHonorSigned: boolean;
  courses: { id: number; name: string; grade: number; credits: number }[];
  attendance: { id: number; month: string; present: number; total: number }[];
}
