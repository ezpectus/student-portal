import { HTMLAttributeAnchorTarget } from 'react';
import { Link } from '@/i18n/routing';

interface PublicLinkProps {
  icon: React.ReactNode;
  href: string;
  target?: HTMLAttributeAnchorTarget;
  children: React.ReactNode;
}

export const PublicLink = ({ children, icon, href, target }: PublicLinkProps) => {
  const rel = target === '_blank' ? 'noopener noreferrer' : undefined;
  return (
    <Link href={href} target={target} rel={rel} className="flex flex-col items-center gap-2">
      {icon}
      <span className="text-center">{children}</span>
    </Link>
  );
};
