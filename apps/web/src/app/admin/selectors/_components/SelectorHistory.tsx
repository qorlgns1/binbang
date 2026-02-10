'use client';

import { useState } from 'react';

import { useSelectorHistory } from '@/hooks/useSelectorHistory';

const ACTION_LABELS: Record<string, string> = {
  create: '생성',
  update: '수정',
  delete: '삭제',
  toggle: '활성화 토글',
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
  PlatformSelector: '셀렉터',
  PlatformPattern: '패턴',
};

export function SelectorHistory() {
  const [entityType, setEntityType] = useState<'PlatformSelector' | 'PlatformPattern' | ''>('');
  const [limit] = useState(20);

  const { data, isLoading, error } = useSelectorHistory({
    entityType: entityType || undefined,
    limit,
  });

  if (isLoading) {
    return <div className='py-8 text-center text-muted-foreground'>로딩 중...</div>;
  }

  if (error) {
    return <div className='py-8 text-center text-destructive'>오류: {error.message}</div>;
  }

  return (
    <div className='space-y-4'>
      {/* Filters */}
      <div className='flex items-center gap-4'>
        <select
          value={entityType}
          onChange={(e) => setEntityType(e.target.value as 'PlatformSelector' | 'PlatformPattern' | '')}
          className='rounded-md border border-input bg-background px-3 py-1.5 text-sm'
        >
          <option value=''>전체</option>
          <option value='PlatformSelector'>셀렉터</option>
          <option value='PlatformPattern'>패턴</option>
        </select>
      </div>

      {/* History List */}
      <div className='rounded-lg border border-border bg-card'>
        <div className='divide-y divide-border'>
          {data?.logs.map((log) => (
            <div key={log.id} className='px-4 py-3'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                      log.action === 'create'
                        ? 'bg-status-success text-status-success-foreground'
                        : log.action === 'delete'
                          ? 'bg-status-error text-status-error-foreground'
                          : 'bg-info text-info-foreground'
                    }`}
                  >
                    {ACTION_LABELS[log.action] || log.action}
                  </span>
                  <span className='rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground'>
                    {ENTITY_TYPE_LABELS[log.entityType] || log.entityType}
                  </span>
                  {log.field && <span className='text-sm text-muted-foreground'>필드: {log.field}</span>}
                </div>
                <span className='text-xs text-muted-foreground'>{new Date(log.createdAt).toLocaleString('ko-KR')}</span>
              </div>

              {/* Change Details */}
              {(log.oldValue || log.newValue) && (
                <div className='mt-2 rounded bg-muted/50 p-2 font-mono text-xs'>
                  {log.oldValue && (
                    <div className='text-status-error-foreground'>
                      - {log.oldValue.length > 100 ? `${log.oldValue.slice(0, 100)}...` : log.oldValue}
                    </div>
                  )}
                  {log.newValue && (
                    <div className='text-status-success-foreground'>
                      + {log.newValue.length > 100 ? `${log.newValue.slice(0, 100)}...` : log.newValue}
                    </div>
                  )}
                </div>
              )}

              {/* Changed By */}
              <div className='mt-2 text-xs text-muted-foreground'>변경자: {log.changedBy?.name || '알 수 없음'}</div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {(!data?.logs || data.logs.length === 0) && (
          <div className='py-8 text-center text-muted-foreground'>변경 이력이 없습니다.</div>
        )}

        {/* Load More */}
        {data?.nextCursor && (
          <div className='border-t border-border px-4 py-3 text-center'>
            <button type='button' className='text-sm text-primary hover:underline'>
              더 보기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
