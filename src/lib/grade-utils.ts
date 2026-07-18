export type GradeType = 'NUMERIC' | 'LETTER' | 'ECTS';

export const GRADE_TYPE_VALUES: Record<GradeType, string[]> = {
  NUMERIC: ['0', '100'],
  LETTER: ['A', 'B', 'C', 'D', 'F'],
  ECTS: ['A', 'B', 'C', 'D', 'E', 'FX', 'F'],
};

export const ECTS_TO_NUMERIC: Record<string, number> = {
  A: 95,
  B: 85,
  C: 75,
  D: 65,
  E: 60,
  FX: 35,
  F: 0,
};

export const LETTER_TO_NUMERIC: Record<string, number> = {
  A: 95,
  B: 85,
  C: 75,
  D: 65,
  F: 0,
};

export const NUMERIC_TO_ECTS = (grade: number): string => {
  if (grade >= 90) return 'A';
  if (grade >= 80) return 'B';
  if (grade >= 70) return 'C';
  if (grade >= 60) return 'D';
  if (grade >= 50) return 'E';
  if (grade >= 25) return 'FX';
  return 'F';
};

export const NUMERIC_TO_LETTER = (grade: number): string => {
  if (grade >= 90) return 'A';
  if (grade >= 80) return 'B';
  if (grade >= 70) return 'C';
  if (grade >= 60) return 'D';
  return 'F';
};

export const convertGrade = (grade: number, fromType: GradeType, toType: GradeType): number => {
  if (fromType === toType) return grade;

  let numeric: number;
  if (fromType === 'NUMERIC') {
    numeric = grade;
  } else if (fromType === 'ECTS') {
    numeric = ECTS_TO_NUMERIC[String(grade)] ?? 0;
  } else {
    numeric = LETTER_TO_NUMERIC[String(grade)] ?? 0;
  }

  if (toType === 'NUMERIC') return numeric;
  return numeric;
};

export const displayGrade = (grade: number, gradeType: GradeType): string => {
  if (gradeType === 'ECTS') return NUMERIC_TO_ECTS(grade);
  if (gradeType === 'LETTER') return NUMERIC_TO_LETTER(grade);
  return String(grade);
};
