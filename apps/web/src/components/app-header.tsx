'use client';

import { useState } from 'react';

import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Home, LogOut, Menu, Settings, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/settings/subscription', label: '설정', icon: Settings },
] as const;

interface AppHeaderProps {
  userName: string | null;
  userImage?: string | null;
  isAdmin?: boolean;
}

export function AppHeader({ userName, isAdmin }: AppHeaderProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className='bg-background/80 backdrop-blur-sm border-b sticky top-0 z-40'>
      <div className='max-w-7xl mx-auto px-4 py-3 flex items-center justify-between'>
        {/* 좌측: 로고 + 데스크톱 네비게이션 */}
        <div className='flex items-center gap-6'>
          <Link
            href='/dashboard'
            className='text-xl font-bold'
          >
            숙소 모니터
          </Link>

          {/* Desktop Navigation */}
          <nav className='hidden md:flex gap-1'>
            {NAV_ITEMS.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-3 py-1.5 text-sm transition-colors',
                    isActive ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                href='/admin/monitoring'
                className={cn(
                  'px-3 py-1.5 text-sm transition-colors',
                  pathname.startsWith('/admin')
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Admin
              </Link>
            )}
          </nav>
        </div>

        {/* 우측: 데스크톱 유저 정보 */}
        <div className='hidden md:flex items-center gap-4'>
          <span className='text-sm text-muted-foreground'>{userName}</span>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            로그아웃
          </Button>
        </div>

        {/* 모바일: 햄버거 메뉴 */}
        <div className='md:hidden'>
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
                <SheetTitle>메뉴</SheetTitle>
              </SheetHeader>

              {/* 유저 정보 */}
              {userName && (
                <div className='py-4 border-b flex items-center gap-3'>
                  <div className='size-10 rounded-full bg-muted flex items-center justify-center'>
                    <User className='size-5 text-muted-foreground' />
                  </div>
                  <div>
                    <p className='font-medium'>{userName}</p>
                    <p className='text-xs text-muted-foreground'>로그인됨</p>
                  </div>
                </div>
              )}

              {/* 네비게이션 */}
              <nav className='flex flex-col gap-1 py-4'>
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-3',
                        isActive
                          ? 'text-foreground font-medium bg-muted'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                      )}
                    >
                      <Icon className='size-4' />
                      {item.label}
                    </Link>
                  );
                })}
                {isAdmin && (
                  <Link
                    href='/admin/monitoring'
                    onClick={() => setOpen(false)}
                    className={cn(
                      'px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-3',
                      pathname.startsWith('/admin')
                        ? 'text-foreground font-medium bg-muted'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                    )}
                  >
                    <Settings className='size-4' />
                    Admin
                  </Link>
                )}
              </nav>

              {/* 하단 액션 */}
              <div className='border-t pt-4'>
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
      </div>
    </header>
  );
}
