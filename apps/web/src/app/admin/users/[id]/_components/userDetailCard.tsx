'use client';

import Image from 'next/image';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarDays, Home, Mail, User } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { AdminUserInfo } from '@/types/admin';

interface Props {
  user: AdminUserInfo | null;
  isLoading: boolean;
  isError: boolean;
}

function RoleBadges({ roles }: { roles: string[] }) {
  return (
    <div className='flex gap-1 flex-wrap'>
      {roles.map((role) =>
        role === 'ADMIN' ? (
          <Badge
            key={role}
            className='bg-status-warning text-status-warning-foreground'
          >
            Admin
          </Badge>
        ) : (
          <Badge
            key={role}
            variant='secondary'
          >
            User
          </Badge>
        ),
      )}
    </div>
  );
}

function CardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className='flex items-center gap-4'>
          <Skeleton className='size-16 rounded-full' />
          <div className='space-y-2'>
            <Skeleton className='h-5 w-32' />
            <Skeleton className='h-4 w-48' />
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-4 w-3/4' />
      </CardContent>
    </Card>
  );
}

export function UserDetailCard({ user, isLoading, isError }: Props) {
  if (isLoading) {
    return <CardSkeleton />;
  }

  if (isError || !user) {
    return (
      <Card>
        <CardContent className='pt-6'>
          <div className='text-center text-muted-foreground py-8'>사용자 정보를 불러올 수 없습니다.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center gap-4'>
          {user.image ? (
            <Image
              src={user.image}
              alt=''
              width={64}
              height={64}
              className='size-16 rounded-full'
              unoptimized
            />
          ) : (
            <div className='size-16 rounded-full bg-muted flex items-center justify-center'>
              <User className='size-8 text-muted-foreground' />
            </div>
          )}
          <div>
            <CardTitle className='text-xl'>{user.name ?? '이름 없음'}</CardTitle>
            <p className='text-sm text-muted-foreground'>{user.email ?? '-'}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid gap-3'>
          <div className='flex items-center gap-3'>
            <Mail className='size-4 text-muted-foreground flex-shrink-0' />
            <span className='text-sm'>{user.email ?? '-'}</span>
          </div>
          <div className='flex items-center gap-3'>
            <CalendarDays className='size-4 text-muted-foreground flex-shrink-0' />
            <span className='text-sm'>{format(new Date(user.createdAt), 'yyyy년 M월 d일 가입', { locale: ko })}</span>
          </div>
          <div className='flex items-center gap-3'>
            <Home className='size-4 text-muted-foreground flex-shrink-0' />
            <span className='text-sm'>등록된 숙소 {user._count.accommodations}개</span>
          </div>
        </div>

        <div className='border-t pt-4 space-y-3'>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-muted-foreground'>역할</span>
            <RoleBadges roles={user.roles} />
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-muted-foreground'>플랜</span>
            <Badge
              variant='outline'
              className='text-xs'
            >
              {user.planName ?? '-'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
