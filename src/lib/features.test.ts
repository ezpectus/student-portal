import { describe, it, expect } from 'vitest';
import { isFeatureEnabled, getEnabledFeatures, type FeatureName } from '@/lib/features';

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
