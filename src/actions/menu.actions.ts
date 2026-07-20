'use server';

import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { group } from 'radash';

import { TOKEN_COOKIE_NAME } from '@/lib/constants/cookies';
import { MODULES } from '@/lib/constants/modules';
import { getJWTPayload } from '@/lib/jwt';
import { CampusJwtPayload } from '@/types/campus-jwt-payload';
import { MenuGroup } from '@/types/menu-item-meta';
import { Module } from '@/types/module';

import { getUserDetails } from './auth.actions';

type Translation = Awaited<ReturnType<typeof getTranslations>>;

const byTitle = (a: MenuGroup, b: MenuGroup) => a.title.localeCompare(b.title);

const composeUrl = (module: Module) => `/module/${module.name}`;

const getModuleMenuItemComposer =
  (translation: Translation) =>
  (module: Module): MenuGroup => ({
    name: module.name,
    title: translation(module.name),
    url: composeUrl(module),
    external: false,
  });

const getMenuGroupComposer = (translation: Translation) => (modules: Module[]) => {
  const composeModuleMenuItem = getModuleMenuItemComposer(translation);

  return modules.map((module) => composeModuleMenuItem(module));
};

export const getModuleMenuSection = async (): Promise<MenuGroup[]> => {
  try {
    const resolvedCookies = await cookies();
    const jwt = resolvedCookies.get(TOKEN_COOKIE_NAME)?.value;

    if (!jwt) {
      return [];
    }

    const jwtPayload = await getJWTPayload<CampusJwtPayload>(jwt);

    if (!jwtPayload) {
      return [];
    }

    const userDetails = await getUserDetails();

    if (!userDetails) {
      return [];
    }

    const t = await getTranslations('global.modules');
    const isEmployee = !userDetails.studentProfile;
    const availableModules = MODULES.filter((module) => jwtPayload.modules.includes(module.name));
    const groups = group(availableModules, (module) => module.group || module.name);

    const composeMenuGroup = getMenuGroupComposer(t);
    const composeModuleMenuItem = getModuleMenuItemComposer(t);

    const menuItems = Object.entries(groups).reduce((acc: MenuGroup[], [groupName, modules]) => {
      if (!modules) {
        return acc;
      }

      if (modules.length === 1) {
        return [...acc, composeModuleMenuItem(modules[0])];
      }

      const menuGroupItems = composeMenuGroup(modules);

      return [
        ...acc,
        {
          name: `_group.${groupName}`,
          title: t(`_groups.${groupName}`),
          url: `#${groupName}`,
          submenu: menuGroupItems,
        } satisfies MenuGroup,
      ];
    }, []);

    return isEmployee ? menuItems.sort(byTitle) : menuItems;
  } catch (error) {
    return [];
  }
};
