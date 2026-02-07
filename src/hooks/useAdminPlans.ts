'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { QuotaKey } from '@/generated/prisma/enums';

import { adminKeys } from './queryKeys';

export interface AdminPlanInfo {
  id: string;
  name: string;
  description: string | null;
  price: number;
  interval: string;
  quotas: { key: QuotaKey; value: number }[];
  _count: { users: number };
}

export interface PlanInput {
  name: string;
  description?: string | null;
  price: number;
  interval?: string;
  maxAccommodations: number;
  checkIntervalMin: number;
}

async function fetchPlans(): Promise<AdminPlanInfo[]> {
  const res = await fetch('/api/admin/plans');
  if (!res.ok) {
    throw new Error('플랜 목록을 불러올 수 없습니다');
  }
  return res.json();
}

export function useAdminPlans() {
  return useQuery({
    queryKey: adminKeys.plans(),
    queryFn: fetchPlans,
    staleTime: 5 * 60 * 1000, // 5분
  });
}

async function createPlan(input: PlanInput): Promise<AdminPlanInfo> {
  const res = await fetch('/api/admin/plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || '플랜 생성에 실패했습니다');
  }
  return res.json();
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.plans() });
    },
  });
}

async function updatePlan({ id, ...input }: Partial<PlanInput> & { id: string }): Promise<AdminPlanInfo> {
  const res = await fetch(`/api/admin/plans/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || '플랜 수정에 실패했습니다');
  }
  return res.json();
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.plans() });
    },
  });
}

async function deletePlan(id: string): Promise<void> {
  const res = await fetch(`/api/admin/plans/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || '플랜 삭제에 실패했습니다');
  }
}

export function useDeletePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.plans() });
    },
  });
}
