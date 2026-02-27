'use client';

import { useCallback, useEffect, useState } from 'react';

import { fetchJobDetail, removeJobApi, retryJobApi } from '../_lib/bullmqApiClient';
import type { JobDetail } from '@/types/bullmq';

interface UseJobDetailResult {
  job: JobDetail | null;
  loading: boolean;
  error: string | null;
  actionLoading: boolean;
  retry: () => Promise<void>;
  remove: () => Promise<void>;
}

/**
 * SRP: 잡 상세 데이터 조회 + 액션(retry/remove) 책임을 컴포넌트에서 분리.
 * DIP: 컴포넌트는 이 훅에만 의존하며, fetch 경로·로직은 알지 못한다.
 */
export function useJobDetail(queueName: string, jobId: string | null, onMutated?: () => void): UseJobDetailResult {
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      setJob(null);
      try {
        const data = await fetchJobDetail(queueName, id);
        setJob(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    },
    [queueName],
  );

  // render-phase side effect 제거: useEffect로 이동
  useEffect(() => {
    if (!jobId) {
      setJob(null);
      setError(null);
      return;
    }
    void load(jobId);
  }, [jobId, load]);

  const retry = useCallback(async () => {
    if (!job) return;
    setActionLoading(true);
    try {
      await retryJobApi(queueName, job.id);
      onMutated?.();
    } finally {
      setActionLoading(false);
    }
  }, [queueName, job, onMutated]);

  const remove = useCallback(async () => {
    if (!job) return;
    setActionLoading(true);
    try {
      await removeJobApi(queueName, job.id);
      onMutated?.();
    } finally {
      setActionLoading(false);
    }
  }, [queueName, job, onMutated]);

  return { job, loading, error, actionLoading, retry, remove };
}
