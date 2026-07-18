import { getLocale } from 'next-intl/server';

import { LogoBetaEN, LogoBetaUK,LogoEN, LogoUK } from '@/app/images';
import { Link, LOCALE } from '@/i18n/routing';
import { env } from '@/lib/env';

export const Logo = async () => {
  const locale = await getLocale();
  const isBeta = env.NEXT_PUBLIC_BETA_LOGO === 'true';

  const renderLogo = () => {
    if (isBeta) {
      return locale === LOCALE.EN ? <LogoBetaEN /> : <LogoBetaUK />;
    }

    return locale === LOCALE.EN ? <LogoEN /> : <LogoUK />;
  };

  return <Link href="/">{renderLogo()}</Link>;
};
