'use client';

import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';

export function LogoutButton(): React.ReactElement {
  const t = useTranslations('common');
  return (
    <Button variant='ghost' size='sm' onClick={() => signOut({ callbackUrl: '/' })}>
      {t('logout')}
    </Button>
  );
}
