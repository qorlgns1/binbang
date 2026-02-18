'use client';

import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { AlertTriangle, Check, MessageSquare, Pencil, Search, Trash2, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
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
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const trimmedSearchQuery = searchQuery.trim();
  const conversationsApiUrl =
    open && trimmedSearchQuery.length > 0
      ? `/api/conversations?q=${encodeURIComponent(trimmedSearchQuery)}`
      : open
        ? '/api/conversations'
        : null;
  const { data, error, mutate } = useSWR<{ conversations: Conversation[] }>(conversationsApiUrl, fetcher);

  const conversations = data?.conversations ?? [];
  const isLoading = !data && !error;

  const handleDeleteRequest = useCallback((conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingDeleteId(conversationId);
  }, []);

  const handleDeleteConfirm = useCallback(
    async (conversationId: string) => {
      try {
        const res = await fetch(`/api/conversations?id=${conversationId}`, {
          method: 'DELETE',
        });

        if (!res.ok) throw new Error('Failed to delete');

        setPendingDeleteId(null);
        await mutate();
      } catch (err) {
        console.error('Failed to delete conversation:', err);
        toast.error('삭제에 실패했습니다.');
        setPendingDeleteId(null);
      }
    },
    [mutate],
  );

  const handleDeleteCancel = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingDeleteId(null);
  }, []);

  const handleSelect = useCallback(
    (conversationId: string) => {
      onSelectConversation(conversationId);
      onClose();
    },
    [onSelectConversation, onClose],
  );

  const handleStartEdit = useCallback((conversationId: string, currentTitle: string | null, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConversationId(conversationId);
    setEditingTitle(currentTitle ?? '');
  }, []);

  const handleCancelEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConversationId(null);
    setEditingTitle('');
  }, []);

  const handleSaveTitle = useCallback(
    async (conversationId: string) => {
      const title = editingTitle.trim();
      if (!title) {
        toast.info('제목은 비어 있을 수 없습니다.');
        return;
      }

      try {
        const res = await fetch(`/api/conversations/${conversationId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title }),
        });

        if (!res.ok) throw new Error('Failed to update title');

        setEditingConversationId(null);
        setEditingTitle('');
        await mutate();
      } catch (err) {
        console.error('Failed to update conversation title:', err);
        toast.error('제목 수정에 실패했습니다.');
      }
    },
    [editingTitle, mutate],
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

          {!isLoading && !error && conversations.length === 0 && (
            <div className='p-4 text-center text-muted-foreground'>
              <p className='text-sm'>{searchQuery ? '검색 결과가 없습니다.' : '저장된 대화가 없습니다.'}</p>
            </div>
          )}

          {!isLoading &&
            !error &&
            conversations.map((conv) => (
              // biome-ignore lint/a11y/useSemanticElements: 내부에 편집/삭제 button이 있어 진짜 button으로 감싸면 HTML 규격 위반(중첩 button). div+role=button+onKeyDown으로 접근성 확보.
              <div
                key={conv.id}
                role='button'
                tabIndex={0}
                className='w-full p-4 border-b border-border hover:bg-muted cursor-pointer transition-colors group text-left'
                onClick={() => {
                  if (editingConversationId === conv.id) return;
                  handleSelect(conv.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (editingConversationId !== conv.id) handleSelect(conv.id);
                  }
                }}
              >
                <div className='flex items-start justify-between gap-2'>
                  <div className='flex-1 min-w-0'>
                    {editingConversationId === conv.id ? (
                      <input
                        type='text'
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            void handleSaveTitle(conv.id);
                          }
                          if (e.key === 'Escape') {
                            setEditingConversationId(null);
                            setEditingTitle('');
                          }
                        }}
                        className='w-full rounded-md border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber'
                        maxLength={100}
                      />
                    ) : (
                      <h3 className='font-medium text-sm truncate'>{conv.title || '제목 없음'}</h3>
                    )}
                    <div className='flex items-center gap-2 mt-1 text-xs text-muted-foreground'>
                      <MessageSquare className='h-3 w-3' />
                      <span>{conv._count.messages}개 메시지</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true, locale: ko })}</span>
                    </div>
                  </div>
                  <div className='flex items-center gap-1'>
                    {editingConversationId === conv.id ? (
                      <>
                        <button
                          type='button'
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleSaveTitle(conv.id);
                          }}
                          className='p-1.5 rounded-md hover:bg-emerald-100 text-muted-foreground hover:text-emerald-600 transition-colors'
                          aria-label='제목 저장'
                        >
                          <Check className='h-4 w-4' />
                        </button>
                        <button
                          type='button'
                          onClick={handleCancelEdit}
                          className='p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors'
                          aria-label='제목 수정 취소'
                        >
                          <X className='h-4 w-4' />
                        </button>
                      </>
                    ) : pendingDeleteId === conv.id ? (
                      /* 인라인 삭제 확인 */
                      <div className='flex items-center gap-1'>
                        <AlertTriangle className='h-3.5 w-3.5 text-destructive shrink-0' aria-hidden />
                        <button
                          type='button'
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDeleteConfirm(conv.id);
                          }}
                          className='rounded-md bg-destructive px-2 py-1 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors'
                          aria-label='삭제 확인'
                        >
                          삭제
                        </button>
                        <button
                          type='button'
                          onClick={handleDeleteCancel}
                          className='rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground hover:bg-muted/80 transition-colors'
                          aria-label='삭제 취소'
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type='button'
                          onClick={(e) => handleStartEdit(conv.id, conv.title, e)}
                          className='p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100'
                          aria-label='제목 수정'
                        >
                          <Pencil className='h-4 w-4' />
                        </button>
                        <button
                          type='button'
                          onClick={(e) => handleDeleteRequest(conv.id, e)}
                          className='p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100'
                          aria-label='삭제'
                        >
                          <Trash2 className='h-4 w-4' />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
