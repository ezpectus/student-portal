'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import MultipleSelector from '@/components/ui/multi-select';

interface AvailableUser {
  id: number;
  name: string;
  role: string;
}

interface Props {
  users: AvailableUser[];
  onClose: () => void;
  onCreate: (name: string, memberIds: number[]) => Promise<void>;
}

export const ChatCreateDialog = ({ users, onClose, onCreate }: Props) => {
  const t = useTranslations('private.chat.create');
  const [name, setName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<{ value: string; label: string }[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || selectedMembers.length === 0) return;
    setIsCreating(true);
    try {
      await onCreate(
        name.trim(),
        selectedMembers.map((m) => Number(m.value)),
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{t('room-name')}</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('room-name-placeholder')}
              maxLength={100}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('members')}</label>
            <MultipleSelector
              value={selectedMembers}
              options={users.map((u) => ({ value: u.id.toString(), label: `${u.name} (${u.role})` }))}
              onChange={setSelectedMembers}
              placeholder={t('members-placeholder')}
              emptyIndicator={<p className="text-center text-sm text-gray-500">{t('no-users')}</p>}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="tertiary" onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button
              onClick={handleCreate}
              loading={isCreating}
              disabled={!name.trim() || selectedMembers.length === 0}
            >
              {t('create')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
