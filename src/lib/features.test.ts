import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_FEATURE_DARK_MODE: 'true',
    NEXT_PUBLIC_FEATURE_COMMAND_PALETTE: 'true',
    NEXT_PUBLIC_FEATURE_REALTIME_NOTIFICATIONS: 'true',
    NEXT_PUBLIC_FEATURE_ADMIN_PANEL: 'true',
  },
}));

import { type FeatureName, getEnabledFeatures, isFeatureEnabled } from '@/lib/features';

describe('feature-toggles', () => {
  it('returns true for enabled features by default', () => {
    expect(isFeatureEnabled('darkMode')).toBe(true);
    expect(isFeatureEnabled('dashboard')).toBe(true);
    expect(isFeatureEnabled('messages')).toBe(true);
  });

  it('returns false for unknown features', () => {
    expect(isFeatureEnabled('nonExistent' as FeatureName)).toBe(false);
  });

  it('getEnabledFeatures returns array of enabled features', () => {
    const enabled = getEnabledFeatures();
    expect(Array.isArray(enabled)).toBe(true);
    expect(enabled.length).toBeGreaterThan(0);
    expect(enabled).toContain('darkMode');
    expect(enabled).toContain('dashboard');
  });

  it('all known features are enabled by default', () => {
    const knownFeatures: FeatureName[] = [
      'darkMode',
      'commandPalette',
      'dashboard',
      'realtimeNotifications',
      'dataExport',
      'adminPanel',
      'onboardingWizard',
      'skeletonLoaders',
      'messages',
      'certificates',
      'rating',
      'monitoring',
    ];
    for (const feature of knownFeatures) {
      expect(isFeatureEnabled(feature)).toBe(true);
    }
  });
});
