import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { calculateStrength,PasswordStrengthIndicator } from '@/components/auth/password-strength-indicator';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('calculateStrength', () => {
  it('returns empty for empty string', () => {
    expect(calculateStrength('')).toEqual({ level: 'empty', score: 0 });
  });

  it('returns weak for very short password', () => {
    const result = calculateStrength('abc');
    expect(result.score).toBe(1);
    expect(result.level).toBe('weak');
  });

  it('awards points for length >= 8', () => {
    const result = calculateStrength('abcdefgh');
    expect(result.score).toBeGreaterThanOrEqual(2);
  });

  it('awards extra point for length >= 12', () => {
    const result = calculateStrength('abcdefghijkl');
    expect(result.score).toBeGreaterThanOrEqual(3);
  });

  it('awards point for uppercase letters', () => {
    const noUpper = calculateStrength('abcdef12');
    const withUpper = calculateStrength('Abcdef12');
    expect(withUpper.score).toBe(noUpper.score + 1);
  });

  it('awards point for lowercase letters', () => {
    const noLower = calculateStrength('ABCDEF12');
    const withLower = calculateStrength('ABCDEF1a');
    expect(withLower.score).toBe(noLower.score + 1);
  });

  it('awards point for digits', () => {
    const noDigit = calculateStrength('Abcdefgh');
    const withDigit = calculateStrength('Abcdefg1');
    expect(withDigit.score).toBe(noDigit.score + 1);
  });

  it('awards point for special characters', () => {
    const noSpecial = calculateStrength('Abcdef12');
    const withSpecial = calculateStrength('Abcdef1!');
    expect(withSpecial.score).toBe(noSpecial.score + 1);
  });

  it('returns weak for score <= 2', () => {
    expect(calculateStrength('abc').level).toBe('weak');
    expect(calculateStrength('ab').level).toBe('weak');
  });

  it('returns fair for score 3', () => {
    expect(calculateStrength('abcdef12').level).toBe('fair');
  });

  it('returns good for score 4', () => {
    expect(calculateStrength('Abcdef12').level).toBe('good');
  });

  it('returns strong for score >= 5', () => {
    expect(calculateStrength('Abcdef12!').level).toBe('strong');
    expect(calculateStrength('Str0ng!Passw0rd#2024').level).toBe('strong');
  });

  it('max score is 6 for all criteria met', () => {
    const result = calculateStrength('Str0ng!Passw0rd#2024');
    expect(result.score).toBe(6);
  });
});

describe('PasswordStrengthIndicator', () => {
  it('renders nothing when password is empty', () => {
    const { container } = render(<PasswordStrengthIndicator password="" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders weak strength for short simple passwords', () => {
    render(<PasswordStrengthIndicator password="abc" />);
    expect(screen.getByText('weak')).toBeTruthy();
  });

  it('renders fair strength for medium passwords', () => {
    render(<PasswordStrengthIndicator password="abcdef12" />);
    expect(screen.getByText('fair')).toBeTruthy();
  });

  it('renders strong strength for complex passwords', () => {
    render(<PasswordStrengthIndicator password="Str0ng!Passw0rd#2024" />);
    expect(screen.getByText('strong')).toBeTruthy();
  });

  it('renders 4 strength bars', () => {
    const { container } = render(<PasswordStrengthIndicator password="abc" />);
    const bars = container.querySelectorAll('.h-1\\.5');
    expect(bars.length).toBe(4);
  });
});
