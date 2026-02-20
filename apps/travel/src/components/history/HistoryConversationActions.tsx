'use client';

import { AlertTriangle, Check, Pencil, Trash2, X } from 'lucide-react';
import type { MouseEvent } from 'react';

interface HistoryConversationActionsProps {
  conversationId: string;
  conversationTitle: string | null;
  historyEditEnabled: boolean;
  isEditing: boolean;
  isPendingDelete: boolean;
  hasPendingDelete: boolean;
  onStartEdit: (conversationId: string, currentTitle: string | null) => void;
  onCancelEdit: () => void;
  onSaveTitle: (conversationId: string) => Promise<void>;
  onDeleteRequest: (conversationId: string) => void;
  onDeleteConfirm: (conversationId: string) => Promise<void>;
  onDeleteCancel: () => void;
}

function stopPropagation(event: MouseEvent<HTMLButtonElement>) {
  event.stopPropagation();
}

export function HistoryConversationActions({
  conversationId,
  conversationTitle,
  historyEditEnabled,
  isEditing,
  isPendingDelete,
  hasPendingDelete,
  onStartEdit,
  onCancelEdit,
  onSaveTitle,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
}: HistoryConversationActionsProps) {
  if (isEditing) {
    return (
      <>
        <button
          type='button'
          onClick={(event) => {
            stopPropagation(event);
            void onSaveTitle(conversationId);
          }}
          disabled={hasPendingDelete}
          className='p-1.5 rounded-md hover:bg-emerald-100 text-muted-foreground hover:text-emerald-600 transition-colors disabled:opacity-50 disabled:pointer-events-none'
          aria-label='제목 저장'
        >
          <Check className='h-4 w-4' />
        </button>
        <button
          type='button'
          onClick={(event) => {
            stopPropagation(event);
            onCancelEdit();
          }}
          className='p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors'
          aria-label='제목 수정 취소'
        >
          <X className='h-4 w-4' />
        </button>
      </>
    );
  }

  if (isPendingDelete) {
    return (
      <div className='flex items-center gap-1'>
        <AlertTriangle className='h-3.5 w-3.5 text-destructive shrink-0' aria-hidden />
        <button
          type='button'
          onClick={(event) => {
            stopPropagation(event);
            void onDeleteConfirm(conversationId);
          }}
          className='rounded-md bg-destructive px-2 py-1 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors'
          aria-label='삭제 확인'
        >
          삭제
        </button>
        <button
          type='button'
          onClick={(event) => {
            stopPropagation(event);
            onDeleteCancel();
          }}
          className='rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground hover:bg-muted/80 transition-colors'
          aria-label='삭제 취소'
        >
          취소
        </button>
      </div>
    );
  }

  return (
    <>
      {historyEditEnabled && (
        <button
          type='button'
          onClick={(event) => {
            stopPropagation(event);
            onStartEdit(conversationId, conversationTitle);
          }}
          className='p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100'
          aria-label='제목 수정'
        >
          <Pencil className='h-4 w-4' />
        </button>
      )}
      <button
        type='button'
        onClick={(event) => {
          stopPropagation(event);
          onDeleteRequest(conversationId);
        }}
        className='p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100'
        aria-label='삭제'
      >
        <Trash2 className='h-4 w-4' />
      </button>
    </>
  );
}
