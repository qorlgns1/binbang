'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/admin/monitoring', label: 'Monitoring' },
  { href: '/admin/heartbeat', label: 'Heartbeat' },
  { href: '/admin/throughput', label: 'Throughput' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/settings', label: '설정' },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className='flex gap-1'>
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
  );
}
