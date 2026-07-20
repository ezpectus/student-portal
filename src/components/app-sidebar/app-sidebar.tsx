import { getTranslations } from 'next-intl/server';

import { getUserDetails } from '@/actions/auth.actions';
import { getLocalUser } from '@/actions/local-user.actions';
import { Sidebar, SidebarContent, SidebarHeader } from '@/components/ui/sidebar';
import { UserCategory } from '@/types/enums/user-category';

import { Logo } from '../logo';
import { MenuItem } from './menu-item';
import { MenuSection } from './menu-section';
import { ModulesMenuItems } from './modules-menu-items';

export async function AppSidebar() {
  const t = await getTranslations('global.menu');

  const localUser = await getLocalUser();
  const remoteUser = !localUser ? await getUserDetails().catch(() => null) : null;

  const isAdmin = localUser?.role === 'ADMIN'
    || remoteUser?.userCategories?.includes(UserCategory.Admin)
    || false;

  const isTeacher = localUser?.role === 'TEACHER' || false;
  const isParent = localUser?.role === 'PARENT' || false;

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarContent>
        <SidebarHeader className="px-[calc(16px+0.5rem)] py-[16px]">
          <Logo />
        </SidebarHeader>
        <SidebarContent className="gap-0">
          <MenuSection>
            <MenuItem name="main" url="/" title={t('main')} />
          </MenuSection>
          <MenuSection>
            <MenuItem name="profile" url="/profile" title={t('profile')} />
            <MenuItem name="settings" url="/settings" title={t('settings')} />
          </MenuSection>
          <MenuSection>
            <ModulesMenuItems />
          </MenuSection>
          {isTeacher && (
            <MenuSection>
              <MenuItem name="grading" url="/module/grading" title={t('grading')} />
            </MenuSection>
          )}
          {isParent && (
            <MenuSection>
              <MenuItem name="parent" url="/module/parent" title={t('parent')} />
            </MenuSection>
          )}
          {isAdmin && (
            <MenuSection>
              <MenuItem name="admin" url="/module/admin" title={t('admin')} />
              <MenuItem name="analytics" url="/module/analytics" title={t('analytics')} />
            </MenuSection>
          )}
        </SidebarContent>
      </SidebarContent>
    </Sidebar>
  );
}
