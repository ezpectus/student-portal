'use client';

import { useEffect, useRef, useState } from 'react';
import { LocaleSwitch } from '@/components/ui/locale-switch';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ProfilePicture } from '@/components/ui/profile-picture';
import { useIsMobile } from '@/hooks/use-mobile';
import { Show } from '@/components/utils/show';
import { cn, getUniqueUserPhotoUrl } from '@/lib/utils';
import { User } from '@/types/models/user';
import { Button } from '@/components/ui/button';
import { logout } from '@/actions/auth.actions';
import { useTranslations } from 'next-intl';
import { SignOut } from '@/app/images';
import { Paragraph } from '@/components/typography/paragraph';
import { USER_CATEGORIES } from '@/lib/constants/user-category';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { ThemeToggle } from '@/components/theme-toggle';

interface Props {
  user: User;
}

export const Header = ({ user }: Props) => {
  const isMobile = useIsMobile();

  const t = useTranslations('private.profile');
  const tUserCategory = useTranslations('global.user-category');
  const [profilePhoto, setProfilePhoto] = useState('');
  const firstRender = useRef(true);

  // This is to update profile picture when it's been uploaded in profile settings.
  // Photo is cached on CDN level, but the link to it is always the same.
  // We need to wait several seconds after image upload. During this time the cache is purged.
  // Then we re-render component with an updated link with a random parameter, which is
  // propagated to CDN url via campus backend.
  useEffect(() => {
    const setProfilePhotoUrl = () => setProfilePhoto(getUniqueUserPhotoUrl(user.photo));
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (firstRender.current) {
      setProfilePhotoUrl();
      firstRender.current = false;
    } else {
      timer = setTimeout(() => setProfilePhotoUrl(), 5000);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [user]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header
      className={cn('bg-background sticky top-0 flex h-[80px] items-center justify-between border-b border-border px-6', {
        'justify-end': !isMobile,
      })}
    >
      <Show when={isMobile}>
        <SidebarTrigger />
      </Show>
      <div className="flex items-center gap-8">
        <ThemeToggle />
        <LocaleSwitch />
        <NotificationCenter />
        <div className="flex items-center gap-3">
          <ProfilePicture size="sm" src={profilePhoto} />
          <div className="hidden flex-col md:flex">
            <Paragraph className="m-0 text-base font-medium">{user?.username}</Paragraph>
            {user?.userCategories.map((category) => (
              <Paragraph className="m-0 text-base font-semibold" key={category}>
                {tUserCategory(USER_CATEGORIES[category])}
              </Paragraph>
            ))}
            {user?.schoolName && (
              <Paragraph className="m-0 text-xs text-muted-foreground">{user.schoolName}</Paragraph>
            )}
          </div>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary" icon={<SignOut />} onClick={handleLogout} aria-label={t('button.logout')} />
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('button.logout')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  );
};
