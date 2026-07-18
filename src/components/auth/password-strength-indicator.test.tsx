import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PasswordStrengthIndicator } from '@/components/auth/password-strength-indicator';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('PasswordStrengthIndicator', () => {
  it('renders nothing when password is empty', () => {
    const { container } = render(<PasswordStrengthIndicator password="" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders weak strength for short simple passwords', () => {
    render(<PasswordStrengthIndicator password="abc" />);
    expect(screen.getByText('weak')).toBeInTheDocument();
  });

  it('renders fair strength for medium passwords', () => {
    render(<PasswordStrengthIndicator password="abcdef12" />);
    expect(screen.getByText('fair')).toBeInTheDocument();
  });

  it('renders strong strength for complex passwords', () => {
    render(<PasswordStrengthIndicator password="Str0ng!Passw0rd#2024" />);
    expect(screen.getByText('strong')).toBeInTheDocument();
  });

  it('renders 4 strength bars', () => {
    const { container } = render(<PasswordStrengthIndicator password="abc" />);
    const bars = container.querySelectorAll('.h-1\\.5');
    expect(bars.length).toBe(4);
  });
});
