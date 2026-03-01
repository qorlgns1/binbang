'use client';

import { useCallback, useEffect, useState } from 'react';

import { bulkJobAction, fetchJobs } from '../_lib/bullmqApiClient';
import type { JobListResult, JobState } from '@/types/bullmq';

interface UseJobsQueryResult {
  result: JobListResult | null;
  loading: boolean;
  error: string | null;
  bulkLoading: boolean;
  refetch: () => void;
  executeBulk: (action: 'retry' | 'remove', ids: string[]) => Promise<void>;
}

const PAGE_SIZE = 20;

/**
 * SRP: 잡 목록 페칭·페이지네이션·벌크 액션 책임을 컴포넌트에서 분리.
 */
export function useJobsQuery(
  queueName: string,
  state: JobState,
  page: number,
  refreshTick: number,
): UseJobsQueryResult {
  const [result, setResult] = useState<JobListResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJobs(queueName, state, page, PAGE_SIZE, refreshTick);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [queueName, state, page, refreshTick]);

  useEffect(() => {
    void load();
  }, [load]);

  const refetch = useCallback(() => {
    void load();
  }, [load]);

  const executeBulk = useCallback(
    async (action: 'retry' | 'remove', ids: string[]) => {
      setBulkLoading(true);
      try {
        await bulkJobAction(queueName, action, ids);
        void load();
      } finally {
        setBulkLoading(false);
      }
    },
    [queueName, load],
  );

  return { result, loading, error, bulkLoading, refetch, executeBulk };
}
