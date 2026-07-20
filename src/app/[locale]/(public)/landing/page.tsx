import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';

import {
  CalendarBlank,
  ChartBarHorizontal,
  ChatsTeardrop,
  EnvelopeSimple,
  GraduationCap,
  UserCircle,
} from '@/app/images';
import { Logo } from '@/components/logo';
import { Heading1, Heading2, Heading3 } from '@/components/typography/headers';
import { Paragraph } from '@/components/typography/paragraph';
import { Button } from '@/components/ui/button';
import { LocaleSwitch } from '@/components/ui/locale-switch';
import { Link } from '@/i18n/routing';
import { LocaleProps } from '@/types/locale-props';

const INTL_NAMESPACE = 'landing';

export async function generateMetadata({ params }: LocaleProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: INTL_NAMESPACE });

  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

export default async function LandingPage({ params }: LocaleProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations(INTL_NAMESPACE);

  const features = [
    { icon: <GraduationCap />, title: t('features.grades.title'), description: t('features.grades.description') },
    { icon: <CalendarBlank />, title: t('features.schedule.title'), description: t('features.schedule.description') },
    { icon: <EnvelopeSimple />, title: t('features.messages.title'), description: t('features.messages.description') },
    { icon: <ChartBarHorizontal />, title: t('features.analytics.title'), description: t('features.analytics.description') },
    { icon: <UserCircle />, title: t('features.profile.title'), description: t('features.profile.description') },
    { icon: <ChatsTeardrop />, title: t('features.notifications.title'), description: t('features.notifications.description') },
  ];

  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-between px-6 py-4 md:px-12">
        <Logo />
        <div className="flex items-center gap-4">
          <Suspense fallback={<span className="text-xs uppercase text-neutral-500">···</span>}>
            <LocaleSwitch />
          </Suspense>
          <Link href="/login">
            <Button variant="secondary" size="small">{t('nav.login')}</Button>
          </Link>
          <Link href="/register">
            <Button variant="primary" size="small">{t('nav.register')}</Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-20 text-center md:py-32">
        <Heading1 className="mb-6 text-4xl font-bold tracking-tight text-neutral-900 md:text-6xl">
          {t('hero.title')}
        </Heading1>
        <Paragraph className="mx-auto mb-10 max-w-2xl text-lg text-neutral-600 md:text-xl">
          {t('hero.description')}
        </Paragraph>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/register">
            <Button variant="primary" size="big">{t('hero.cta.register')}</Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" size="big">{t('hero.cta.login')}</Button>
          </Link>
        </div>
      </section>

      <section className="bg-neutral-50 px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <Heading2 className="mb-12 text-center text-3xl font-bold text-neutral-900">
            {t('features.title')}
          </Heading2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-neutral-200 bg-white p-8 transition-shadow hover:shadow-lg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100">
                  {feature.icon}
                </div>
                <Heading3 className="mb-2 text-xl font-semibold text-neutral-900">
                  {feature.title}
                </Heading3>
                <Paragraph className="text-neutral-600">
                  {feature.description}
                </Paragraph>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 text-center md:py-28">
        <Heading2 className="mb-6 text-3xl font-bold text-neutral-900">
          {t('cta.title')}
        </Heading2>
        <Paragraph className="mx-auto mb-10 max-w-2xl text-lg text-neutral-600">
          {t('cta.description')}
        </Paragraph>
        <Link href="/register">
          <Button variant="primary" size="big">{t('cta.button')}</Button>
        </Link>
      </section>

      <footer className="border-t border-neutral-200 px-6 py-8 text-center md:px-12">
        <Paragraph className="text-sm text-neutral-500">
          {t('footer.copyright', { year: new Date().getFullYear() })}
        </Paragraph>
      </footer>
    </div>
  );
}
