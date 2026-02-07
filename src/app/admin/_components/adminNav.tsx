'use client';

import { useState } from 'react';

import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { LogOut, Menu } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/admin/monitoring', label: 'Monitoring' },
  { href: '/admin/heartbeat', label: 'Heartbeat' },
  { href: '/admin/throughput', label: 'Throughput' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/plans', label: 'Plans' },
  { href: '/admin/audit-logs', label: 'Audit' },
  { href: '/admin/settings', label: '설정' },
] as const;

interface AdminNavProps {
  userName: string | null;
}

export function AdminNav({ userName }: AdminNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop Navigation */}
      <nav className='hidden md:flex gap-1'>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md transition-colors',
                isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Mobile Navigation - 우측 고정 배치 */}
      <div className='md:hidden fixed top-3 right-4 z-50'>
        <Sheet
          open={open}
          onOpenChange={setOpen}
        >
          <SheetTrigger asChild>
            <Button
              variant='outline'
              size='icon'
            >
              <Menu className='size-5' />
              <span className='sr-only'>메뉴 열기</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side='right'
            className='w-72'
          >
            <SheetHeader>
              <SheetTitle>Admin Menu</SheetTitle>
            </SheetHeader>

            {/* 유저 정보 */}
            {userName && (
              <div className='py-4 border-b'>
                <p className='text-sm text-muted-foreground'>로그인</p>
                <p className='font-medium'>{userName}</p>
              </div>
            )}

            {/* 네비게이션 */}
            <nav className='flex flex-col gap-1 py-4'>
              {NAV_ITEMS.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'px-3 py-2 text-sm rounded-md transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* 하단 액션 */}
            <div className='border-t pt-4 space-y-2'>
              <Button
                variant='outline'
                className='w-full justify-start'
                asChild
              >
                <Link
                  href='/dashboard'
                  onClick={() => setOpen(false)}
                >
                  Dashboard로 이동
                </Link>
              </Button>
              <Button
                variant='ghost'
                className='w-full justify-start text-destructive hover:text-destructive'
                onClick={() => signOut({ callbackUrl: '/login' })}
              >
                <LogOut className='size-4 mr-2' />
                로그아웃
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
