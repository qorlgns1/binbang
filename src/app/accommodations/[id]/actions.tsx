'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

export function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/accommodations/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.push('/dashboard');
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant='destructive'
      onClick={handleDelete}
      disabled={loading}
    >
      {loading ? '삭제 중...' : '삭제'}
    </Button>
  );
}

export function ToggleActiveButton({ id, isActive }: { id: string; isActive: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/accommodations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={handleToggle}
      disabled={loading}
      variant={isActive ? 'secondary' : 'default'}
      className={isActive ? 'text-muted-foreground' : 'bg-emerald-600 text-white hover:bg-emerald-700'}
    >
      {loading ? '처리 중...' : isActive ? '일시정지' : '모니터링 시작'}
    </Button>
  );
}
