'use client';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { useDeleteAccommodation } from '@/hooks/useDeleteAccommodation';
import { useToggleActive } from '@/hooks/useToggleActive';

export function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const deleteMutation = useDeleteAccommodation();

  function handleDelete() {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    deleteMutation.mutate(id, {
      onSuccess: () => {
        router.push('/dashboard');
        router.refresh();
      },
    });
  }

  return (
    <Button
      variant='destructive'
      onClick={handleDelete}
      disabled={deleteMutation.isPending}
    >
      {deleteMutation.isPending ? '삭제 중...' : '삭제'}
    </Button>
  );
}

export function ToggleActiveButton({ id, isActive }: { id: string; isActive: boolean }) {
  const router = useRouter();
  const toggleMutation = useToggleActive();

  const [optimisticActive, setOptimisticActive] = useState(isActive);

  useEffect(() => {
    setOptimisticActive(isActive);
  }, [isActive]);

  function handleToggle() {
    const newActive = !optimisticActive;
    setOptimisticActive(newActive);

    toggleMutation.mutate(
      { id, isActive: newActive },
      {
        onSuccess: () => {
          router.refresh();
        },
        onError: () => {
          setOptimisticActive(isActive);
        },
      },
    );
  }

  return (
    <Button
      onClick={handleToggle}
      disabled={toggleMutation.isPending}
      variant={optimisticActive ? 'secondary' : 'default'}
      className={optimisticActive ? 'text-muted-foreground' : 'bg-status-success-foreground text-white hover:bg-status-success-foreground/80'}
    >
      {toggleMutation.isPending ? '처리 중...' : optimisticActive ? '일시정지' : '모니터링 시작'}
    </Button>
  );
}
