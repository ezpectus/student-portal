'use client';

import { useReducer, useEffect, useRef } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2 } from 'lucide-react';
import { ArrowClockwise, Star, MagnifyingGlassRegular } from '@/app/images';
import { Input } from '@/components/ui/input';
import { getMail, getMails, markAsImportant } from '@/actions/msg.actions';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Message } from '@/types/models/message';
import { formatDate } from '@/lib/date.utils';
import { Action, State } from './types';
import { DeleteDialog } from './dialog/delete-dialog';
import { PreviewDialog } from './dialog/preview-dialog';
import { MailFilter } from '@/types/enums/mail-filter';

interface Props {
  mails: Message[];
  filter: MailFilter;
}

function reducer(state: State, action: Action) {
  switch (action.type) {
    case 'setOpenedDialog':
      return { ...state, openedDialog: action.openedDialog };
    case 'setSelectedRows':
      return { ...state, selectedRows: action.selectedRows };
    case 'setSelectedMail':
      return { ...state, selectedMail: action.selectedMail };
    case 'setIsRefreshing':
      return { ...state, isRefreshing: action.isRefreshing };
    case 'setIsLoadingMail':
      return { ...state, isLoadingMail: action.isLoadingMail };
    case 'setMails':
      return { ...state, mails: action.mails };
    case 'setSearchQuery':
      return { ...state, searchQuery: action.searchQuery };
    case 'markMailAsRead':
      return {
        ...state,
        mails: state.mails.map((m) => (m.id === action.mailId ? { ...m, isRead: true } : m)),
      };
    default:
      return state;
  }
}

export default function Inbox({ mails, filter }: Props) {
  const [state, dispatch] = useReducer(reducer, {
    mails,
    selectedRows: [],
    selectedMail: null,
    openedDialog: null,
    isRefreshing: false,
    isLoadingMail: false,
    searchQuery: '',
  });

  const { toast } = useToast();
  const t = useTranslations('private.msg.inbox');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectRow = (id: number) => {
    dispatch({
      type: 'setSelectedRows',
      selectedRows: state.selectedRows.includes(id)
        ? state.selectedRows.filter((rowId) => rowId !== id)
        : [...state.selectedRows, id],
    });
  };

  const handleDeleteClick = () => {
    dispatch({ type: 'setOpenedDialog', openedDialog: 'delete' });
  };

  const handleMarkAsImportant = async () => {
    try {
      const isImportant = state.selectedRows.some(
        (id) => !state.mails.find((message) => message.id === id)?.isImportant,
      );
      await markAsImportant(state.selectedRows, isImportant);
      toast({
        title: t('toast.success-title-mark-as-important'),
        description: t('toast.success-description-mark-as-important'),
      });
    } catch (error) {
      toast({
        title: t('toast.error-title-mark-as-important'),
        description: t('toast.error-description-mark-as-important'),
      });
    }
  };

  const handleRowClick = async (mail: Message) => {
    if (state.isLoadingMail) return;
    dispatch({ type: 'setIsLoadingMail', isLoadingMail: true });
    try {
      const mailData = await getMail(mail.id);
      dispatch({ type: 'setSelectedMail', selectedMail: { ...mailData, recipient: mail.recipient } });
      dispatch({ type: 'setOpenedDialog', openedDialog: 'preview' });

      if (!mail.isRead) {
        dispatch({ type: 'markMailAsRead', mailId: mail.id });
      }
    } catch {
      toast({
        title: t('toast.error-title-refresh'),
        description: t('toast.error-description-refresh'),
      });
    } finally {
      dispatch({ type: 'setIsLoadingMail', isLoadingMail: false });
    }
  };

  const handleRefresh = async () => {
    dispatch({ type: 'setIsRefreshing', isRefreshing: true });
    try {
      const newMails = await getMails(filter);
      dispatch({ type: 'setMails', mails: newMails });
    } catch (error) {
      toast({
        title: t('toast.error-title-refresh'),
        description: t('toast.error-description-refresh'),
      });
    } finally {
      dispatch({ type: 'setIsRefreshing', isRefreshing: false });
    }
  };

  const filteredMails = state.searchQuery.trim()
    ? state.mails.filter((mail) => {
        const query = state.searchQuery.toLowerCase();
        const nameField = filter === MailFilter.Outgoing ? mail.recipient.name : mail.sender.name;
        return (
          nameField.toLowerCase().includes(query) ||
          mail.subject.toLowerCase().includes(query)
        );
      })
    : state.mails;

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex h-6 items-center gap-3">
          {state.selectedRows.length > 0 && (
            <>
              <span className="text-muted-foreground text-sm">
                {state.selectedRows.length} {t('selected')}
              </span>
              <button type="button" onClick={handleDeleteClick} className="flex cursor-pointer items-center justify-center" aria-label={t('actions.delete')}>
                <Trash2 className="h-6 w-6 text-neutral-500" />
              </button>
              <button type="button" onClick={handleMarkAsImportant} className="flex cursor-pointer items-center justify-center" aria-label={t('actions.mark-important')}>
                <Star className="h-6 w-6 text-neutral-500" />
              </button>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <MagnifyingGlassRegular className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              ref={searchRef}
              value={state.searchQuery}
              onChange={(e) => dispatch({ type: 'setSearchQuery', searchQuery: e.target.value })}
              placeholder={t('search-placeholder')}
              className="h-9 w-48 pl-8"
              aria-label={t('search-placeholder')}
            />
          </div>
          <button type="button" onClick={handleRefresh} className="flex cursor-pointer items-center justify-center" title={t('refresh')} aria-label={t('refresh')}>
            <ArrowClockwise className={`h-5 w-5 text-neutral-500 ${state.isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={filteredMails.length > 0 && state.selectedRows.length === filteredMails.length}
                disabled={filteredMails.length === 0}
                onCheckedChange={(checked) => {
                  dispatch({ type: 'setSelectedRows', selectedRows: checked ? filteredMails.map((m) => m.id) : [] });
                }}
              />
            </TableHead>
            <TableHead className="font-semibold">
              {filter === MailFilter.Outgoing ? t('table.recipient') : t('table.sender')}
            </TableHead>
            <TableHead className="font-semibold">{t('table.message')}</TableHead>
            <TableHead className="font-semibold">{t('table.date')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredMails.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground py-12 text-center text-sm">
                {state.searchQuery ? t('no-results') : t('empty')}
              </TableCell>
            </TableRow>
          ) : (
            filteredMails.map((mail) => (
              <TableRow key={`${mail.id}-${mail.recipient.id}`} className="h-[65px] cursor-pointer">
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={state.selectedRows.includes(mail.id)}
                    onCheckedChange={() => handleSelectRow(mail.id)}
                  />
                </TableCell>
                <TableCell onClick={() => handleRowClick(mail)} className={!mail.isRead ? 'font-semibold' : ''}>
                  {filter === MailFilter.Outgoing ? mail.recipient.name : mail.sender.name}
                </TableCell>
                <TableCell onClick={() => handleRowClick(mail)}>
                  <div className="flex max-w-[600px] items-center gap-2">
                    <span className={`flex-1 overflow-hidden text-ellipsis whitespace-nowrap ${!mail.isRead ? 'font-semibold' : ''}`}>
                      {mail.subject}
                    </span>
                    {mail.isImportant && (
                      <Badge variant="neutral" className="text-brand-500 flex-shrink-0 bg-neutral-50">
                        <Star className="text-brand-500 fill-brand-500 h-4 w-4" /> {t('badge.important')}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell onClick={() => handleRowClick(mail)} className={!mail.isRead ? 'font-semibold' : ''}>
                  {formatDate(mail.createdAt)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <PreviewDialog isOpen={state.openedDialog === 'preview'} dispatch={dispatch} selectedMail={state.selectedMail} />

      <DeleteDialog selectedRows={state.selectedRows} isOpen={state.openedDialog === 'delete'} dispatch={dispatch} />
    </div>
  );
}
