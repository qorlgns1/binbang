'use client';

import { useQuery } from '@tanstack/react-query';

export interface PlanInfo {
  id: string;
  name: string;
  description: string | null;
  price: number;
  interval: string;
  quotas: {
    maxAccommodations: number;
    checkIntervalMin: number;
  };
}

async function fetchPlans(): Promise<PlanInfo[]> {
  const res = await fetch('/api/plans');
  if (!res.ok) {
    throw new Error('플랜 정보를 불러올 수 없습니다');
  }
  return res.json();
}

export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: fetchPlans,
    staleTime: 10 * 60 * 1000, // 10분
  });
}
