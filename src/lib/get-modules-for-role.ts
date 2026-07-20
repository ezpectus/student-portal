/**
 * Get accessible modules for a given role.
 * Non-async — must NOT be in a 'use server' file.
 */
export const getModulesForRole = (role: string): string[] => {
  const commonModules = ['studysheet', 'rating', 'certificates', 'announcementseditor', 'msg', 'calendar', 'chat', 'feed', 'ai-chat'];
  if (role === 'ADMIN') return ['admin', ...commonModules, 'grading', 'analytics'];
  if (role === 'TEACHER') return [...commonModules, 'grading', 'analytics'];
  if (role === 'PARENT') return ['parent', 'msg', 'calendar', 'chat'];
  return commonModules;
};
