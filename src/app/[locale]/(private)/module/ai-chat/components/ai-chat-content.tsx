'use client';

import { Bot, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

import { type ChatMessage, getAiChatResponse } from '@/actions/ai-chat.actions';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useServerErrorToast } from '@/hooks/use-server-error-toast';
import { useLocalStorage } from '@/hooks/use-storage';

const SUGGESTIONS = [
  'exam',
  'grade',
  'deadline',
  'stress',
  'motivation',
];

export const AiChatContent = () => {
  const t = useTranslations('private.ai-chat');
  const { errorToast } = useServerErrorToast();

  const [storedMessages, setMessages] = useLocalStorage<ChatMessage[]>('ai-chat-history', [
    { role: 'assistant', content: t('welcome') },
  ]);
  const messages = storedMessages ?? [{ role: 'assistant' as const, content: t('welcome') }];
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 50);
  };

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMessage: ChatMessage = { role: 'user', content };
    setMessages((prev) => [...(prev ?? []), userMessage]);
    setInput('');
    setLoading(true);
    scrollToBottom();

    try {
      const response = await getAiChatResponse(content);
      setMessages((prev) => [...(prev ?? []), { role: 'assistant', content: response }]);
      scrollToBottom();
    } catch {
      errorToast();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-2xl flex-col gap-4">
      <Card className="flex flex-1 flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-3 overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="flex flex-col gap-3 pr-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback>
                      {msg.role === 'user' ? 'Я' : 'AI'}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-2">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg px-3 py-2 text-sm text-muted-foreground">
                    {t('thinking')}
                  </div>
                </div>
              )}
            </div>
          </div>

          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((key) => (
                <button
                  key={key}
                  onClick={() => handleSend(t(`suggestions.${key}`))}
                  className="bg-muted hover:bg-accent rounded-full px-3 py-1.5 text-xs text-muted-foreground transition-colors"
                >
                  {t(`suggestions.${key}`)}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={t('placeholder')}
              disabled={loading}
            />
            <Button onClick={() => handleSend()} loading={loading} disabled={!input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
