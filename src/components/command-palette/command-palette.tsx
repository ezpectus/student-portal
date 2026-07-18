'use client';

import { Command } from 'cmdk';
import { GraduationCap, FileText, Contact, Users, Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Books, CalendarBlank, ChartBarHorizontal, ChatsTeardrop, EnvelopeSimple, Gear, House, MagnifyingGlassBold,UserCircle } from '@/app/images';
import { useRouter } from '@/i18n/routing';

type CommandItem = {
  label: string;
  icon: React.ReactNode;
  action: () => void;
  group: string;
};

export const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const t = useTranslations('global.menu');
  const tCmd = useTranslations('commandPalette');

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const navigate = (path: string) => {
    router.push(path);
    setOpen(false);
  };

  const items: CommandItem[] = [
    { label: t('main'), icon: <House />, action: () => navigate('/'), group: tCmd('groups.navigation') },
    { label: t('profile'), icon: <UserCircle />, action: () => navigate('/profile'), group: tCmd('groups.navigation') },
    { label: t('settings'), icon: <Gear />, action: () => navigate('/settings'), group: tCmd('groups.navigation') },
    { label: tCmd('items.grades'), icon: <ChartBarHorizontal />, action: () => navigate('/module/studysheet'), group: tCmd('groups.modules') },
    { label: tCmd('items.schedule'), icon: <CalendarBlank />, action: () => navigate('/module/schedule'), group: tCmd('groups.modules') },
    { label: tCmd('items.messages'), icon: <EnvelopeSimple />, action: () => navigate('/module/msg'), group: tCmd('groups.modules') },
    { label: tCmd('items.materials'), icon: <Books />, action: () => navigate('/module/mob'), group: tCmd('groups.modules') },
    { label: tCmd('items.announcements'), icon: <ChatsTeardrop />, action: () => navigate('/module/announcementseditor'), group: tCmd('groups.modules') },
    { label: tCmd('items.grading'), icon: <GraduationCap size={16} />, action: () => navigate('/module/grading'), group: tCmd('groups.modules') },
    { label: tCmd('items.certificates'), icon: <FileText size={16} />, action: () => navigate('/module/certificates'), group: tCmd('groups.modules') },
    { label: tCmd('items.directory'), icon: <Contact size={16} />, action: () => navigate('/module/directory'), group: tCmd('groups.modules') },
    { label: t('contacts'), icon: <Users size={16} />, action: () => navigate('/contacts'), group: tCmd('groups.navigation') },
    { label: t('admin'), icon: <Shield size={16} />, action: () => navigate('/module/admin'), group: tCmd('groups.navigation') },
  ];

  if (!open) return null;

  const groups = Array.from(new Set(items.map((item) => item.group)));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[15vh]" onClick={() => setOpen(false)}>
      <Command
        className="mx-auto w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <MagnifyingGlassBold />
          <Command.Input
            placeholder={tCmd('placeholder')}
            className="h-14 w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
            autoFocus
          />
        </div>
        <Command.List className="max-h-[400px] overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-neutral-400">
            {tCmd('empty')}
          </Command.Empty>
          {groups.map((group) => (
            <Command.Group key={group} heading={group} className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-neutral-400">
              {items
                .filter((item) => item.group === group)
                .map((item) => (
                  <Command.Item
                    key={item.label}
                    onSelect={() => item.action()}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 text-sm text-foreground data-[selected=true]:bg-muted data-[selected=true]:text-foreground"
                  >
                    <span className="text-neutral-400">{item.icon}</span>
                    {item.label}
                  </Command.Item>
                ))}
            </Command.Group>
          ))}
        </Command.List>
        <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-muted-foreground">
          <span>{tCmd('hint')}</span>
          <kbd className="rounded border border-neutral-200 px-1.5 py-0.5 font-sans text-xs">ESC</kbd>
        </div>
      </Command>
    </div>
  );
};
