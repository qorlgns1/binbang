'use client';

import Link from 'next/link';

import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useUserDetail } from '@/hooks/useUserDetail';

import { UserActivityTimeline } from './userActivityTimeline';
import { UserDetailCard } from './userDetailCard';

interface Props {
  userId: string;
}

export function UserDetailView({ userId }: Props) {
  const { data: user, isLoading, isError } = useUserDetail(userId);

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='sm' asChild>
          <Link href='/admin/users'>
            <ArrowLeft className='size-4 mr-2' />
            사용자 목록
          </Link>
        </Button>
      </div>

      <div className='grid gap-6 lg:grid-cols-[1fr_2fr]'>
        <UserDetailCard user={user ?? null} isLoading={isLoading} isError={isError} />
        <UserActivityTimeline userId={userId} />
      </div>
    </div>
  );
}
