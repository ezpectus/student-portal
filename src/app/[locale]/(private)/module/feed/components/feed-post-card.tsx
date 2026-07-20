'use client';

import dayjs from 'dayjs';
import { Heart, MessageCircle, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { type FeedPostItem } from '@/actions/feed.actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Show } from '@/components/utils/show';

interface Props {
  post: FeedPostItem;
  currentUserId: number;
  isAdmin: boolean;
  onLike: () => void;
  onComment: (content: string) => void;
  onDelete: () => void;
}

export const FeedPostCard = ({ post, currentUserId, isAdmin, onLike, onComment, onDelete }: Props) => {
  const t = useTranslations('private.feed');
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);

  const handleComment = () => {
    if (!commentText.trim()) return;
    onComment(commentText.trim());
    setCommentText('');
  };

  const canDelete = currentUserId === post.authorId || isAdmin;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.authorPhoto || undefined} />
              <AvatarFallback>{post.authorName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{post.authorName}</p>
              <p className="text-muted-foreground text-xs">
                {dayjs(post.createdAt).format('DD.MM.YYYY HH:mm')}
              </p>
            </div>
          </div>
          <Show when={canDelete}>
            <button
              onClick={onDelete}
              className="text-muted-foreground hover:text-destructive"
              aria-label={t('delete')}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </Show>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm whitespace-pre-wrap">{post.content}</p>
        <Show when={!!post.imageUrl}>
          <div className="relative max-h-96 w-full overflow-hidden rounded-lg">
            <Image
              src={post.imageUrl!}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 672px"
            />
          </div>
        </Show>
        <div className="flex items-center gap-4 border-t pt-3">
          <button
            onClick={onLike}
            className={`flex items-center gap-1.5 text-sm transition-colors ${
              post.likedByMe ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
            }`}
          >
            <Heart className={`h-4 w-4 ${post.likedByMe ? 'fill-current' : ''}`} />
            {post.likeCount}
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <MessageCircle className="h-4 w-4" />
            {post.comments.length}
          </button>
        </div>
        <Show when={showComments}>
          <div className="flex flex-col gap-2 border-t pt-3">
            {post.comments.map((c) => (
              <div key={c.id} className="flex gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback>{c.authorName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 rounded-lg bg-muted px-3 py-2">
                  <span className="text-xs font-medium">{c.authorName}</span>
                  <p className="text-sm">{c.content}</p>
                </div>
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <Input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleComment();
                  }
                }}
                placeholder={t('comment-placeholder')}
                maxLength={1000}
              />
              <Button size="small" onClick={handleComment} disabled={!commentText.trim()}>
                {t('comment')}
              </Button>
            </div>
          </div>
        </Show>
      </CardContent>
    </Card>
  );
};
