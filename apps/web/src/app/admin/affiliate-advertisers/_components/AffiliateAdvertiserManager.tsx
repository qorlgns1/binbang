'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, RefreshCw } from 'lucide-react';

type AdvertiserItem = {
  id: string;
  advertiserId: number;
  name: string;
  category: string;
  notes: string | null;
  source: string;
  updatedAt: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  accommodation: '숙소',
  flight: '항공',
  esim: 'eSIM',
  car_rental: '렌터카',
  travel_package: '패키지',
  other: '기타',
};

export function AffiliateAdvertiserManager() {
  const [list, setList] = useState<AdvertiserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [editing, setEditing] = useState<Record<string, { category: string; notes: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params = filterCategory ? `?category=${encodeURIComponent(filterCategory)}` : '';
      const res = await fetch(`/api/admin/awin/advertisers${params}`);
      const data = await res.json();
      if (Array.isArray(data)) setList(data);
      else setList([]);
    } finally {
      setLoading(false);
    }
  }, [filterCategory]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleSync = async () => {
    setSyncLoading(true);
    try {
      const res = await fetch('/api/admin/awin/advertisers/sync', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `동기화 실패 (HTTP ${res.status})`);
      if (data.error) throw new Error(data.error);
      await fetchList();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setSyncLoading(false);
    }
  };

  const setEdit = (id: string, item: AdvertiserItem, field: 'category' | 'notes', value: string) => {
    setEditing((prev) => ({
      ...prev,
      [id]: {
        category: prev[id]?.category ?? item.category,
        notes: prev[id]?.notes ?? item.notes ?? '',
        [field]: value,
      },
    }));
  };

  const saveRow = async (item: AdvertiserItem) => {
    const edit = editing[item.id];
    if (!edit) return;
    setSavingId(item.id);
    try {
      const res = await fetch(`/api/admin/awin/advertisers/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: edit.category, notes: edit.notes || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `저장 실패 (HTTP ${res.status})`);
      }
      setEditing((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      await fetchList();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <main className='mx-auto max-w-5xl space-y-6 px-4 py-8'>
      <Card>
        <CardHeader>
          <CardTitle>가입 광고주 관리</CardTitle>
          <CardDescription>
            Awin에서 가입한 광고주(프로그램) 목록을 DB에 동기화하고, 카테고리와 메모를 지정하세요. travel 앱에서
            &quot;숙소 추천&quot;, &quot;eSIM 알려줘&quot; 등 요청 시 이 카테고리로 매칭해 추천·수익화에 사용할 수
            있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex flex-wrap items-center gap-2'>
            <Button onClick={handleSync} disabled={syncLoading}>
              {syncLoading ? (
                <>
                  <Loader2 className='mr-2 size-4 animate-spin' />
                  동기화 중…
                </>
              ) : (
                <>
                  <RefreshCw className='mr-2 size-4' />
                  Awin에서 가져오기
                </>
              )}
            </Button>
            <Select value={filterCategory || '_'} onValueChange={(v) => setFilterCategory(v === '_' ? '' : v)}>
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder='카테고리 필터' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='_'>전체</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                  <SelectItem key={k} value={k}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <p className='text-muted-foreground text-sm'>로딩 중…</p>
          ) : list.length === 0 ? (
            <p className='text-muted-foreground text-sm'>
              저장된 광고주가 없습니다. &quot;Awin에서 가져오기&quot;를 눌러 가입한 프로그램을 불러오세요.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead>메모</TableHead>
                  <TableHead className='w-[100px]' />
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((item) => {
                  const edit = editing[item.id];
                  const category = edit?.category ?? item.category;
                  const notes = edit?.notes ?? item.notes ?? '';
                  const isDirty =
                    edit !== undefined && (edit.category !== item.category || edit.notes !== (item.notes ?? ''));
                  return (
                    <TableRow key={item.id}>
                      <TableCell className='font-mono text-sm'>{item.advertiserId}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>
                        <Select value={category} onValueChange={(v) => setEdit(item.id, item, 'category', v)}>
                          <SelectTrigger className='h-8'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                              <SelectItem key={k} value={k}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <input
                          type='text'
                          className='h-8 w-full rounded border bg-background px-2 text-sm'
                          placeholder='메모'
                          value={notes}
                          onChange={(e) => setEdit(item.id, item, 'notes', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        {isDirty && (
                          <Button
                            size='sm'
                            variant='secondary'
                            disabled={savingId === item.id}
                            onClick={() => saveRow(item)}
                          >
                            {savingId === item.id ? <Loader2 className='size-4 animate-spin' /> : '저장'}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
