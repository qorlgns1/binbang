'use client';

import { formatDistanceToNow, isValid } from 'date-fns';
import { ko } from 'date-fns/locale';
import { MessageSquare } from 'lucide-react';

interface HistoryConversationMetaProps {
  messageCount: number;
  updatedAt: string;
}

export function HistoryConversationMeta({ messageCount, updatedAt }: HistoryConversationMetaProps) {
  return (
    <div className='flex items-center gap-2 mt-1 text-xs text-muted-foreground'>
      <MessageSquare className='h-3 w-3' />
      <span>{messageCount}개 메시지</span>
      <span>•</span>
      <span>
        {(() => {
          const parsed = new Date(updatedAt);
          return isValid(parsed) ? formatDistanceToNow(parsed, { addSuffix: true, locale: ko }) : '알 수 없음';
        })()}
      </span>
    </div>
  );
}
