import { getModuleMenuSection } from '@/actions/menu.actions';
import { MenuGroup } from '@/types/menu-item-meta';

import { CollapsibleMenuItem } from './collapsible-menu-item';
import { MenuItem } from './menu-item';
import { UnreadMailBadge } from './unread-mail-badge';

export async function ModulesMenuItems() {
  const moduleMenuSection = await getModuleMenuSection();

  const renderMenuItem = (menuGroup: MenuGroup) => {
    return (
      <MenuItem
        key={menuGroup.url}
        name={menuGroup.name}
        url={menuGroup.url}
        title={menuGroup.title}
        isExternal={menuGroup.external}
        badge={menuGroup.name === 'msg' ? <UnreadMailBadge /> : undefined}
      />
    );
  };

  return (
    <>
      {moduleMenuSection.map((menuGroup) => {
        if (menuGroup.submenu && !!menuGroup.submenu.length) {
          return (
            <CollapsibleMenuItem key={menuGroup.name} title={menuGroup.title} name={menuGroup.name}>
              {menuGroup.submenu.map(renderMenuItem)}
            </CollapsibleMenuItem>
          );
        }

        return renderMenuItem(menuGroup);
      })}
    </>
  );
}
