'use client';

import { Keyboard } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ShortcutItem {
  keys: string;
  description: string;
}

interface ShortcutGroup {
  label: string;
  items: ShortcutItem[];
}

export const KeyboardShortcutsHelp = () => {
  const t = useTranslations('commandPalette');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '?' && e.shiftKey) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const groups: ShortcutGroup[] = [
    {
      label: t('shortcuts.groups.general'),
      items: [
        { keys: '⌘ K', description: t('shortcuts.items.command-palette') },
        { keys: '⇧ ?', description: t('shortcuts.items.help') },
        { keys: 'ESC', description: t('shortcuts.items.close') },
      ],
    },
    {
      label: t('shortcuts.groups.navigation'),
      items: [
        { keys: '⌘ K → Home', description: t('shortcuts.items.home') },
        { keys: '⌘ K → Profile', description: t('shortcuts.items.profile') },
        { keys: '⌘ K → Settings', description: t('shortcuts.items.settings') },
      ],
    },
    {
      label: t('shortcuts.groups.actions'),
      items: [
        { keys: '/', description: t('shortcuts.items.search-messages') },
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            {t('shortcuts.title')}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 text-sm font-medium text-muted-foreground">{group.label}</p>
              <div className="flex flex-col gap-1.5">
                {group.items.map((item) => (
                  <div key={item.keys} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{item.description}</span>
                    <kbd className="rounded border border-border bg-muted px-2 py-0.5 font-sans text-xs">
                      {item.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
