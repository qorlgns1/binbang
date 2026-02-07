'use client';

import { Clock, Home, Pencil, Trash2, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { QuotaKey } from '@/generated/prisma/enums';
import { type AdminPlanInfo, useAdminPlans, useDeletePlan } from '@/hooks/useAdminPlans';

interface Props {
  onEdit: (plan: AdminPlanInfo) => void;
}

function getQuotaValue(quotas: { key: QuotaKey; value: number }[], key: QuotaKey): number {
  return quotas.find((q) => q.key === key)?.value ?? 0;
}

function formatPrice(price: number) {
  if (price === 0) return '무료';
  return `₩${new Intl.NumberFormat('ko-KR').format(price)}`;
}

function TableSkeleton() {
  return (
    <div className='space-y-2'>
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton
          key={i}
          className='h-12 w-full'
        />
      ))}
    </div>
  );
}

export function PlansTable({ onEdit }: Props) {
  const { data: plans, isLoading, isError } = useAdminPlans();
  const deleteMutation = useDeletePlan();

  function handleDelete(plan: AdminPlanInfo) {
    if (plan._count.users > 0) {
      alert(`이 플랜을 사용 중인 유저가 ${plan._count.users}명 있습니다.`);
      return;
    }
    if (!confirm(`"${plan.name}" 플랜을 삭제하시겠습니까?`)) return;
    deleteMutation.mutate(plan.id);
  }

  if (isLoading) return <TableSkeleton />;

  if (isError) {
    return (
      <div className='rounded-lg border border-border p-6 text-center text-muted-foreground'>
        플랜 목록을 불러올 수 없습니다.
      </div>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <div className='rounded-lg border border-border p-6 text-center text-muted-foreground'>
        등록된 플랜이 없습니다.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>플랜</TableHead>
          <TableHead>가격</TableHead>
          <TableHead>Quota</TableHead>
          <TableHead>사용자</TableHead>
          <TableHead>액션</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {plans.map((plan) => (
          <TableRow key={plan.id}>
            <TableCell>
              <div>
                <span className='font-medium'>{plan.name}</span>
                {plan.description && <p className='text-xs text-muted-foreground mt-0.5'>{plan.description}</p>}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={plan.price === 0 ? 'secondary' : 'default'}>{formatPrice(plan.price)}</Badge>
            </TableCell>
            <TableCell>
              <div className='flex flex-col gap-1 text-xs'>
                <span className='flex items-center gap-1'>
                  <Home className='size-3' />
                  숙소 {getQuotaValue(plan.quotas, QuotaKey.MAX_ACCOMMODATIONS)}개
                </span>
                <span className='flex items-center gap-1'>
                  <Clock className='size-3' />
                  {getQuotaValue(plan.quotas, QuotaKey.CHECK_INTERVAL_MIN)}분 주기
                </span>
              </div>
            </TableCell>
            <TableCell>
              <span className='flex items-center gap-1 text-sm'>
                <Users className='size-4 text-muted-foreground' />
                {plan._count.users}명
              </span>
            </TableCell>
            <TableCell>
              <div className='flex gap-1'>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => onEdit(plan)}
                >
                  <Pencil className='size-4' />
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => handleDelete(plan)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className='size-4 text-destructive' />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
