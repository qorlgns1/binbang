'use client';

import { useState } from 'react';

import Image from 'next/image';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import type { AdminUserInfo } from '@/types/admin';

import { RoleChangeDialog } from './roleChangeDialog';

function RoleBadges({ roles }: { roles: string[] }) {
  return (
    <div className='flex gap-1'>
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

function TableSkeleton() {
  return (
    <div className='space-y-2'>
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton
          key={i}
          className='h-10 w-full'
        />
      ))}
    </div>
  );
}

interface UsersTableProps {
  filters: { search?: string; role?: string };
}

export function UsersTable({ filters }: UsersTableProps) {
  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } = useAdminUsers(filters);
  const [selectedUser, setSelectedUser] = useState<AdminUserInfo | null>(null);

  const users = data?.pages.flatMap((p) => p.users) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  return (
    <>
      {isLoading ? (
        <TableSkeleton />
      ) : isError ? (
        <div className='rounded-lg border border-border p-6 text-center text-muted-foreground'>
          사용자 목록을 불러올 수 없습니다.
        </div>
      ) : users.length === 0 ? (
        <div className='rounded-lg border border-border p-6 text-center text-muted-foreground'>
          검색 결과가 없습니다.
        </div>
      ) : (
        <>
          <div className='text-sm text-muted-foreground'>총 {total}명</div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>사용자</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead>역할</TableHead>
                <TableHead>숙소</TableHead>
                <TableHead>가입일</TableHead>
                <TableHead>액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      {user.image ? (
                        <Image
                          src={user.image}
                          alt=''
                          width={28}
                          height={28}
                          className='size-7 rounded-full'
                          unoptimized
                        />
                      ) : (
                        <div className='size-7 rounded-full bg-muted' />
                      )}
                      <span className='font-medium'>{user.name ?? '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell className='text-sm text-muted-foreground'>{user.email ?? '-'}</TableCell>
                  <TableCell>
                    <RoleBadges roles={user.roles} />
                  </TableCell>
                  <TableCell className='text-sm'>{user._count.accommodations}</TableCell>
                  <TableCell className='text-xs text-muted-foreground'>
                    {format(new Date(user.createdAt), 'yyyy.MM.dd', { locale: ko })}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant='outline'
                      size='xs'
                      onClick={() => setSelectedUser(user)}
                    >
                      역할 변경
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {hasNextPage && (
            <div className='flex justify-center pt-2'>
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

      <RoleChangeDialog
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    </>
  );
}
