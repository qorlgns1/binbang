'use client';

import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { AlertTriangle, Check, MessageSquare, Pencil, Trash2, X } from 'lucide-react';

import type { HistoryConversation } from '@/components/history/historySidebarTypes';

interface HistoryConversationItemProps {
  conversation: HistoryConversation;
  editingConversationId: string | null;
  editingTitle: string;
  pendingDeleteId: string | null;
  historyEditEnabled: boolean;
  setEditingTitle: (value: string) => void;
  onSelect: (conversationId: string) => void;
  onStartEdit: (conversationId: string, currentTitle: string | null) => void;
  onCancelEdit: () => void;
  onSaveTitle: (conversationId: string) => Promise<void>;
  onDeleteRequest: (conversationId: string) => void;
  onDeleteConfirm: (conversationId: string) => Promise<void>;
  onDeleteCancel: () => void;
}

export function HistoryConversationItem({
  conversation,
  editingConversationId,
  editingTitle,
  pendingDeleteId,
  historyEditEnabled,
  setEditingTitle,
  onSelect,
  onStartEdit,
  onCancelEdit,
  onSaveTitle,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
}: HistoryConversationItemProps) {
  const isEditing = historyEditEnabled && editingConversationId === conversation.id;
  const isPendingDelete = pendingDeleteId === conversation.id;

  return (
    // biome-ignore lint/a11y/useSemanticElements: 내부에 편집/삭제 button이 있어 진짜 button으로 감싸면 HTML 규격 위반(중첩 button). div+role=button+onKeyDown으로 접근성 확보.
    <div
      role='button'
      tabIndex={0}
      className='w-full p-4 border-b border-border hover:bg-muted cursor-pointer transition-colors group text-left'
      onClick={() => {
        if (!isEditing) {
          onSelect(conversation.id);
        }
      }}
      onKeyDown={(e) => {
        if (e.key !== 'Enter' && e.key !== ' ') {
          return;
        }

        e.preventDefault();
        if (!isEditing) {
          onSelect(conversation.id);
        }
      }}
    >
      <div className='flex items-start justify-between gap-2'>
        <div className='flex-1 min-w-0'>
          {isEditing ? (
            <input
              type='text'
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  void onSaveTitle(conversation.id);
                }
                if (e.key === 'Escape') {
                  onCancelEdit();
                }
              }}
              className='w-full rounded-md border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber'
              maxLength={100}
            />
          ) : (
            <h3 className='font-medium text-sm truncate'>{conversation.title || '제목 없음'}</h3>
          )}

          <div className='flex items-center gap-2 mt-1 text-xs text-muted-foreground'>
            <MessageSquare className='h-3 w-3' />
            <span>{conversation._count.messages}개 메시지</span>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true, locale: ko })}</span>
          </div>
        </div>

        <div className='flex items-center gap-1'>
          {isEditing ? (
            <>
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation();
                  void onSaveTitle(conversation.id);
                }}
                disabled={pendingDeleteId != null}
                className='p-1.5 rounded-md hover:bg-emerald-100 text-muted-foreground hover:text-emerald-600 transition-colors disabled:opacity-50 disabled:pointer-events-none'
                aria-label='제목 저장'
              >
                <Check className='h-4 w-4' />
              </button>
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation();
                  onCancelEdit();
                }}
                className='p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors'
                aria-label='제목 수정 취소'
              >
                <X className='h-4 w-4' />
              </button>
            </>
          ) : isPendingDelete ? (
            <div className='flex items-center gap-1'>
              <AlertTriangle className='h-3.5 w-3.5 text-destructive shrink-0' aria-hidden />
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation();
                  void onDeleteConfirm(conversation.id);
                }}
                className='rounded-md bg-destructive px-2 py-1 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors'
                aria-label='삭제 확인'
              >
                삭제
              </button>
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteCancel();
                }}
                className='rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground hover:bg-muted/80 transition-colors'
                aria-label='삭제 취소'
              >
                취소
              </button>
            </div>
          ) : (
            <>
              {historyEditEnabled && (
                <button
                  type='button'
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartEdit(conversation.id, conversation.title);
                  }}
                  className='p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100'
                  aria-label='제목 수정'
                >
                  <Pencil className='h-4 w-4' />
                </button>
              )}
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteRequest(conversation.id);
                }}
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
  );
}
