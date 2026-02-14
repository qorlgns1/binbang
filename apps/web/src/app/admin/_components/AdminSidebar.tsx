'use client';

import { useState } from 'react';

import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  BarChart3,
  CreditCard,
  FileText,
  Filter,
  Heart,
  LayoutDashboard,
  ListFilter,
  LogOut,
  Map as MapIcon,
  Menu,
  ScrollText,
  Settings,
  Users,
} from 'lucide-react';

import { ThemeToggle } from '@/components/landing/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { Locale } from '@workspace/shared/i18n';

const ADMIN_THEME_LOCALE: Locale = 'en';

const NAV_GROUPS: Array<{
  label: string;
  items: Array< { href: string; label: string; icon: LucideIcon }>;
}> = [
  {
    label: '모니터링',
    items: [
      { href: '/admin/monitoring', label: 'Monitoring', icon: Activity },
      { href: '/admin/heartbeat', label: 'Heartbeat', icon: Heart },
      { href: '/admin/throughput', label: 'Throughput', icon: BarChart3 },
    ],
  },
  {
    label: '운영',
    items: [
      { href: '/admin/funnel', label: 'Funnel', icon: Filter },
      { href: '/admin/submissions', label: 'Submissions', icon: FileText },
      { href: '/admin/cases', label: 'Cases', icon: MapIcon },
      { href: '/admin/selectors', label: 'Selectors', icon: ListFilter },
      { href: '/admin/intake-mappings', label: 'Intake Maps', icon: FileText },
    ],
  },
  {
    label: '시스템',
    items: [
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/admin/plans', label: 'Plans', icon: CreditCard },
      { href: '/admin/audit-logs', label: 'Audit', icon: ScrollText },
      { href: '/admin/settings', label: '설정', icon: Settings },
    ],
  },
];

const sidebarLinkBase =
  'relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar';

const sidebarLinkInactive = 'text-sidebar-foreground/85 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground';

const sidebarLinkActive = 'bg-sidebar-accent text-sidebar-accent-foreground';

interface AdminSidebarProps {
  userName: string | null;
}

export function AdminSidebar({ userName }: AdminSidebarProps) {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  const navLinks = (
    <nav className='flex flex-col gap-6' aria-label='Admin'>
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className='mb-1.5 px-3 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/55'>
            {group.label}
          </p>
          <div className='flex flex-col gap-0.5'>
            {group.items.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSheetOpen(false)}
                  className={cn(
                    sidebarLinkBase,
                    isActive
                      ? sidebarLinkActive
                      : sidebarLinkInactive,
                    isActive && 'border-l-2 border-sidebar-primary pl-[10px] pr-3',
                  )}
                >
                  <Icon className='size-4 shrink-0 opacity-90' aria-hidden />
                  <span className='truncate'>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  const bottomBlock = (
    <div className='mt-auto space-y-2 rounded-lg border border-sidebar-border bg-sidebar-accent/30 px-2 py-3'>
      {userName && (
        <p className='truncate px-2 text-xs text-sidebar-foreground/70' title={userName}>
          {userName}
        </p>
      )}
      <ThemeToggle lang={ADMIN_THEME_LOCALE} className='w-full justify-start' />
      <Button variant='outline' size='sm' className='w-full justify-start' asChild>
        <Link href='/dashboard'>
          <LayoutDashboard className='mr-2 size-4' />
          Dashboard
        </Link>
      </Button>
      <Button
        variant='ghost'
        size='sm'
        className='w-full justify-start text-destructive hover:text-destructive'
        onClick={() => signOut({ callbackUrl: '/login' })}
      >
        <LogOut className='mr-2 size-4' />
        로그아웃
      </Button>
    </div>
  );

  return (
    <>
      {/* Desktop: sticky 사이드바 — 문서 스크롤 시에도 뷰포트에 고정, 100dvh로 모바일 주소창 대응 */}
      <div className='hidden md:block md:w-56 md:shrink-0'>
        <aside
          className='sticky top-0 flex h-[100dvh] max-h-screen flex-col border-r border-sidebar-border bg-sidebar px-3 py-4'
          aria-label='Admin navigation'
        >
          <Link
            href='/dashboard'
            className='mb-4 flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-sidebar-foreground outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar'
            aria-label='Home'
          >
            <span
              className='flex size-9 shrink-0 items-center justify-center rounded-full bg-sidebar-primary'
              aria-hidden
            >
              <span className='size-2 rounded-full bg-sidebar-primary-foreground' />
            </span>
            <span className='text-sm font-semibold tracking-tight'>Admin</span>
          </Link>
          <div className='min-h-0 flex-1 overflow-y-auto'>{navLinks}</div>
          {bottomBlock}
        </aside>
      </div>

      {/* Mobile: 헤더 + 햄버거 → 시트(동일 네비 + 하단 블록) */}
      <header className='flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 shadow-sm backdrop-blur-md md:hidden'>
        <Link
          href='/dashboard'
          className='flex items-center gap-2 rounded-md text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
          aria-label='Home'
        >
          <span className='flex size-8 items-center justify-center rounded-full bg-primary'>
            <span className='size-1.5 rounded-full bg-primary-foreground' />
          </span>
          <span className='text-sm font-semibold'>Admin</span>
        </Link>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant='outline' size='icon' aria-label='메뉴 열기'>
              <Menu className='size-5' />
            </Button>
          </SheetTrigger>
          <SheetContent side='right' className='flex w-72 flex-col bg-sidebar text-sidebar-foreground'>
            <SheetHeader>
              <SheetTitle className='text-sidebar-foreground'>Admin Menu</SheetTitle>
            </SheetHeader>
            <div className='flex-1 overflow-y-auto py-4'>{navLinks}</div>
            {bottomBlock}
          </SheetContent>
        </Sheet>
      </header>
    </>
  );
}
