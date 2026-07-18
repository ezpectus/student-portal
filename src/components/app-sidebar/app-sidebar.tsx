import { Sidebar, SidebarContent, SidebarHeader } from '@/components/ui/sidebar';
import { ModulesMenuItems } from './modules-menu-items';
import { Logo } from '../logo';
import { MenuSection } from './menu-section';
import { MenuItem } from './menu-item';
import { getTranslations } from 'next-intl/server';
import { getUserDetails } from '@/actions/auth.actions';
import { getLocalUser } from '@/actions/local-auth.actions';
import { UserCategory } from '@/types/enums/user-category';

export async function AppSidebar() {
  const t = await getTranslations('global.menu');

  const localUser = await getLocalUser();
  const remoteUser = !localUser ? await getUserDetails().catch(() => null) : null;

  const isAdmin = localUser?.role === 'ADMIN'
    || remoteUser?.userCategories?.includes(UserCategory.Admin)
    || false;

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
          {isAdmin && (
            <MenuSection>
              <MenuItem name="admin" url="/module/admin" title={t('admin')} />
            </MenuSection>
          )}
        </SidebarContent>
      </SidebarContent>
    </Sidebar>
  );
}
