import type { ReactNode } from 'react';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <div className='min-h-screen flex flex-col bg-muted/40'>{children}</div>;
}
