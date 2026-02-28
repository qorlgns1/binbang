export type JobState = 'waiting' | 'active' | 'failed' | 'completed' | 'delayed';

export interface QueueStats {
  name: string;
  waiting: number;
  active: number;
  failed: number;
  completed: number;
  delayed: number;
  isPaused: boolean;
}

export interface JobItem {
  id: string;
  name: string;
  state: JobState;
  attemptsMade: number;
  timestamp: number | null;
  processedOn: number | null;
  finishedOn: number | null;
  failedReason: string | null;
  dataPreview: string;
}

export interface JobDetail extends JobItem {
  data: string;
  opts: string;
  stacktrace: string | null;
  returnValue: string | null;
}

export interface JobListResult {
  jobs: JobItem[];
  total: number;
  page: number;
  limit: number;
}

export interface BulkResult {
  succeeded: number;
  failed: number;
  errors: string[];
}

/** 서비스 레이어 원시 스케줄러 데이터 (트리거 가능 여부 미포함) */
export interface SchedulerData {
  id: string;
  name: string;
  pattern: string | null;
  every: string | null;
  nextRunAt: number | null;
  data: string | null;
}

/** API 응답 / UI 레이어 스케줄러 (트리거 가능 여부 포함) */
export interface SchedulerInfo extends SchedulerData {
  canTrigger: boolean;
}
