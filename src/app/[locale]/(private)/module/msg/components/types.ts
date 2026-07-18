import { Message } from '@/types/models/message';

export type DialogType = 'preview' | 'delete' | null;

export interface State {
  mails: Message[];
  selectedRows: number[];
  selectedMail: Message | null;
  openedDialog: DialogType;
  isRefreshing: boolean;
  isLoadingMail: boolean;
  searchQuery: string;
}

export type Action =
  | { type: 'setOpenedDialog'; openedDialog: DialogType }
  | { type: 'setSelectedRows'; selectedRows: number[] }
  | { type: 'setSelectedMail'; selectedMail: Message | null }
  | { type: 'setIsRefreshing'; isRefreshing: boolean }
  | { type: 'setIsLoadingMail'; isLoadingMail: boolean }
  | { type: 'setMails'; mails: Message[] }
  | { type: 'markMailAsRead'; mailId: number }
  | { type: 'setSearchQuery'; searchQuery: string };
