'use client';

import { useState } from 'react';

import Image from 'next/image';

import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ArrowRight, Filter, Shield, UserCog } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { type AuditLogInfo, useAdminAuditLogs } from '@/hooks/useAdminAuditLogs';

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  'role.assign': { label: '역할 변경', color: 'bg-blue-500/10 text-blue-600' },
  'plan.change': { label: '플랜 변경', color: 'bg-green-500/10 text-green-600' },
};

const ENTITY_LABELS: Record<string, string> = {
  User: '사용자',
  Role: '역할',
  Plan: '플랜',
};

function ActionIcon({ action }: { action: string }) {
  if (action === 'role.assign') {
    return <Shield className='size-4' />;
  }
  if (action === 'plan.change') {
    return <UserCog className='size-4' />;
  }
  return <Filter className='size-4' />;
}

function UserAvatar({ user }: { user: { name: string | null; email: string | null; image: string | null } | null }) {
  if (!user) {
    return <div className='size-8 rounded-full bg-muted flex items-center justify-center text-xs'>?</div>;
  }

  if (user.image) {
    return (
      <Image
        src={user.image}
        alt=''
        width={32}
        height={32}
        className='size-8 rounded-full'
        unoptimized
      />
    );
  }

  return (
    <div className='size-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium'>
      {user.name?.charAt(0) ?? user.email?.charAt(0) ?? '?'}
    </div>
  );
}

function AuditLogItem({ log }: { log: AuditLogInfo }) {
  const actionInfo = ACTION_LABELS[log.action] ?? { label: log.action, color: 'bg-muted text-muted-foreground' };

  function renderValueChange() {
    const oldVal = typeof log.oldValue === 'string' ? log.oldValue : JSON.stringify(log.oldValue);
    const newVal = typeof log.newValue === 'string' ? log.newValue : JSON.stringify(log.newValue);

    if (!oldVal && !newVal) return null;

    return (
      <div className='flex items-center gap-2 text-sm mt-2'>
        {oldVal && (
          <Badge
            variant='outline'
            className='font-normal'
          >
            {oldVal}
          </Badge>
        )}
        {oldVal && newVal && <ArrowRight className='size-3 text-muted-foreground' />}
        {newVal && (
          <Badge
            variant='secondary'
            className='font-normal'
          >
            {newVal}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className='flex gap-4 py-4 border-b border-border last:border-0'>
      <div className='flex-shrink-0'>
        <UserAvatar user={log.actor} />
      </div>
      <div className='flex-1 min-w-0'>
        <div className='flex items-center gap-2 flex-wrap'>
          <span className='font-medium text-sm'>{log.actor?.name ?? log.actor?.email ?? '시스템'}</span>
          <Badge className={`text-xs ${actionInfo.color}`}>
            <ActionIcon action={log.action} />
            <span className='ml-1'>{actionInfo.label}</span>
          </Badge>
        </div>
        <div className='text-sm text-muted-foreground mt-1'>
          <span className='font-medium text-foreground'>
            {log.targetUser?.name ?? log.targetUser?.email ?? log.targetId}
          </span>
          {log.entityType && <span> ({ENTITY_LABELS[log.entityType] ?? log.entityType})</span>}
        </div>
        {renderValueChange()}
        <div className='text-xs text-muted-foreground mt-2'>
          {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: ko })}
        </div>
      </div>
    </div>
  );
}

function TimelineSkeleton() {
  return (
    <div className='space-y-4'>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className='flex gap-4 py-4 border-b border-border'
        >
          <Skeleton className='size-8 rounded-full' />
          <div className='flex-1 space-y-2'>
            <Skeleton className='h-4 w-32' />
            <Skeleton className='h-4 w-48' />
            <Skeleton className='h-3 w-24' />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AuditLogTimeline() {
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');

  const filters = {
    ...(actionFilter !== 'all' && { action: actionFilter }),
    ...(entityFilter !== 'all' && { entityType: entityFilter }),
  };

  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } = useAdminAuditLogs(filters);

  const logs = data?.pages.flatMap((p) => p.logs) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle>감사 로그</CardTitle>
            <CardDescription>시스템의 모든 권한 및 설정 변경 이력</CardDescription>
          </div>
          {!isLoading && <span className='text-sm text-muted-foreground'>총 {total}건</span>}
        </div>
        <div className='flex gap-2 pt-2'>
          <Select
            value={actionFilter}
            onValueChange={setActionFilter}
          >
            <SelectTrigger className='w-[140px]'>
              <SelectValue placeholder='액션 필터' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>모든 액션</SelectItem>
              <SelectItem value='role.assign'>역할 변경</SelectItem>
              <SelectItem value='plan.change'>플랜 변경</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={entityFilter}
            onValueChange={setEntityFilter}
          >
            <SelectTrigger className='w-[140px]'>
              <SelectValue placeholder='대상 필터' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>모든 대상</SelectItem>
              <SelectItem value='User'>사용자</SelectItem>
              <SelectItem value='Role'>역할</SelectItem>
              <SelectItem value='Plan'>플랜</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <TimelineSkeleton />
        ) : isError ? (
          <div className='rounded-lg border border-border p-6 text-center text-muted-foreground'>
            감사 로그를 불러올 수 없습니다.
          </div>
        ) : logs.length === 0 ? (
          <div className='rounded-lg border border-border p-6 text-center text-muted-foreground'>
            감사 로그가 없습니다.
          </div>
        ) : (
          <>
            <div className='divide-y divide-border'>
              {logs.map((log) => (
                <AuditLogItem
                  key={log.id}
                  log={log}
                />
              ))}
            </div>
            {hasNextPage && (
              <div className='flex justify-center pt-4'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? '로딩 중...' : '더 보기'}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
