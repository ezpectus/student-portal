import { env } from '@/lib/env';

export type FeatureName =
  | 'darkMode'
  | 'commandPalette'
  | 'dashboard'
  | 'realtimeNotifications'
  | 'dataExport'
  | 'adminPanel'
  | 'onboardingWizard'
  | 'skeletonLoaders'
  | 'announcementsEditor'
  | 'monitoring'
  | 'rating'
  | 'studysheet'
  | 'attestation'
  | 'certificates'
  | 'facultyCertificates'
  | 'messages'
  | 'curator'
  | 'colleagueContacts'
  | 'schedule';

const DEFAULT_TOGGLES: Record<FeatureName, boolean> = {
  darkMode: true,
  commandPalette: true,
  dashboard: true,
  realtimeNotifications: true,
  dataExport: true,
  adminPanel: true,
  onboardingWizard: true,
  skeletonLoaders: true,
  announcementsEditor: true,
  monitoring: true,
  rating: true,
  studysheet: true,
  attestation: true,
  certificates: true,
  facultyCertificates: true,
  messages: true,
  curator: true,
  colleagueContacts: true,
  schedule: true,
};

const ENV_OVERRIDES: Partial<Record<FeatureName, boolean>> = {
  darkMode: env.NEXT_PUBLIC_FEATURE_DARK_MODE === 'false' ? false : undefined,
  commandPalette: env.NEXT_PUBLIC_FEATURE_COMMAND_PALETTE === 'false' ? false : undefined,
  realtimeNotifications: env.NEXT_PUBLIC_FEATURE_REALTIME_NOTIFICATIONS === 'false' ? false : undefined,
  adminPanel: env.NEXT_PUBLIC_FEATURE_ADMIN_PANEL === 'false' ? false : undefined,
};

const resolvedToggles: Record<FeatureName, boolean> = {
  ...DEFAULT_TOGGLES,
  ...Object.fromEntries(Object.entries(ENV_OVERRIDES).filter(([, v]) => v !== undefined)),
};

export const isFeatureEnabled = (feature: FeatureName): boolean => {
  return resolvedToggles[feature] ?? false;
};

export const getEnabledFeatures = (): FeatureName[] => {
  return (Object.keys(resolvedToggles) as FeatureName[]).filter((f) => resolvedToggles[f]);
};
