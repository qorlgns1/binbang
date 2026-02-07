'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserActivity } from '@/hooks/useUserActivity';
import type { ActivityType } from '@/types/activity';

import { ActivityItem } from './activityItem';

interface Props {
  userId: string;
}

function TimelineSkeleton() {
  return (
    <div className='space-y-4'>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className='flex gap-4 py-4 border-b border-border'
        >
          <Skeleton className='size-8 rounded-full flex-shrink-0' />
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

export function UserActivityTimeline({ userId }: Props) {
  const [typeFilter, setTypeFilter] = useState<ActivityType | 'all'>('all');

  const filters = {
    ...(typeFilter !== 'all' && { type: typeFilter }),
  };

  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } = useUserActivity(userId, filters);

  const activities = data?.pages.flatMap((p) => p.activities) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle>활동 이력</CardTitle>
            <CardDescription>사용자의 모든 활동 타임라인</CardDescription>
          </div>
          {!isLoading && <span className='text-sm text-muted-foreground'>총 {total}건</span>}
        </div>
        <div className='flex gap-2 pt-2'>
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as ActivityType | 'all')}
          >
            <SelectTrigger className='w-[160px]'>
              <SelectValue placeholder='활동 유형' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>모든 활동</SelectItem>
              <SelectItem value='audit'>권한 변경</SelectItem>
              <SelectItem value='check'>숙소 체크</SelectItem>
              <SelectItem value='accommodation'>숙소 등록</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <TimelineSkeleton />
        ) : isError ? (
          <div className='rounded-lg border border-border p-6 text-center text-muted-foreground'>
            활동 이력을 불러올 수 없습니다.
          </div>
        ) : activities.length === 0 ? (
          <div className='rounded-lg border border-border p-6 text-center text-muted-foreground'>
            활동 이력이 없습니다.
          </div>
        ) : (
          <>
            <div className='divide-y divide-border'>
              {activities.map((activity) => (
                <ActivityItem
                  key={activity.id}
                  activity={activity}
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
