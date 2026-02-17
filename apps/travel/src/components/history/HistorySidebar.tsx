'use client';

import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { MessageSquare, Search, Trash2, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import useSWR from 'swr';

interface Conversation {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    messages: number;
  };
}

interface HistorySidebarProps {
  open: boolean;
  onClose: () => void;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json() as Promise<{ conversations: Conversation[] }>;
};

export function HistorySidebar({ open, onClose, onSelectConversation, onNewConversation }: HistorySidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { data, error, mutate } = useSWR<{ conversations: Conversation[] }>(
    open ? '/api/conversations' : null,
    fetcher,
  );

  const conversations = data?.conversations ?? [];
  const isLoading = !data && !error;

  const filteredConversations = conversations.filter((conv) =>
    conv.title?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleDelete = useCallback(
    async (conversationId: string, e: React.MouseEvent) => {
      e.stopPropagation();

      if (!confirm('이 대화를 삭제하시겠습니까?')) return;

      try {
        const res = await fetch(`/api/conversations?id=${conversationId}`, {
          method: 'DELETE',
        });

        if (!res.ok) throw new Error('Failed to delete');

        await mutate();
      } catch (err) {
        console.error('Failed to delete conversation:', err);
        alert('삭제에 실패했습니다.');
      }
    },
    [mutate],
  );

  const handleSelect = useCallback(
    (conversationId: string) => {
      onSelectConversation(conversationId);
      onClose();
    },
    [onSelectConversation, onClose],
  );

  if (!open) return null;

  return (
    <div className='fixed inset-0 z-40 flex'>
      {/* Overlay */}
      <button
        type='button'
        onClick={onClose}
        className='absolute inset-0 bg-black/50 backdrop-blur-sm'
        aria-label='사이드바 닫기'
      />

      {/* Sidebar */}
      <div className='relative z-10 w-80 bg-background border-r border-border shadow-2xl flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between p-4 border-b border-border'>
          <h2 className='text-lg font-semibold'>대화 히스토리</h2>
          <button
            type='button'
            onClick={onClose}
            className='p-2 rounded-full hover:bg-muted transition-colors'
            aria-label='닫기'
          >
            <X className='h-4 w-4' />
          </button>
        </div>

        {/* Search */}
        <div className='p-4 border-b border-border'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <input
              type='text'
              placeholder='대화 검색...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full pl-9 pr-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-amber'
            />
          </div>
        </div>

        {/* New conversation button */}
        <div className='p-4 border-b border-border'>
          <button
            type='button'
            onClick={() => {
              onNewConversation();
              onClose();
            }}
            className='w-full py-2 px-4 bg-brand-amber text-white rounded-lg hover:bg-brand-amber/90 transition-colors font-medium'
          >
            새 대화 시작
          </button>
        </div>

        {/* Conversation list */}
        <div className='flex-1 overflow-y-auto'>
          {isLoading && (
            <div className='p-4 text-center text-muted-foreground'>
              <p className='text-sm'>로딩 중...</p>
            </div>
          )}

          {error && (
            <div className='p-4 text-center text-destructive'>
              <p className='text-sm'>대화를 불러오지 못했습니다.</p>
            </div>
          )}

          {!isLoading && !error && filteredConversations.length === 0 && (
            <div className='p-4 text-center text-muted-foreground'>
              <p className='text-sm'>{searchQuery ? '검색 결과가 없습니다.' : '저장된 대화가 없습니다.'}</p>
            </div>
          )}

          {!isLoading &&
            !error &&
            filteredConversations.map((conv) => (
              <button
                type='button'
                key={conv.id}
                className='w-full p-4 border-b border-border hover:bg-muted cursor-pointer transition-colors group text-left'
                onClick={() => handleSelect(conv.id)}
              >
                <div className='flex items-start justify-between gap-2'>
                  <div className='flex-1 min-w-0'>
                    <h3 className='font-medium text-sm truncate'>{conv.title || '제목 없음'}</h3>
                    <div className='flex items-center gap-2 mt-1 text-xs text-muted-foreground'>
                      <MessageSquare className='h-3 w-3' />
                      <span>{conv._count.messages}개 메시지</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true, locale: ko })}</span>
                    </div>
                  </div>
                  <button
                    type='button'
                    onClick={(e) => handleDelete(conv.id, e)}
                    className='p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100'
                    aria-label='삭제'
                  >
                    <Trash2 className='h-4 w-4' />
                  </button>
                </div>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
