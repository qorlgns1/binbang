'use client';

import { Activity } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { QueueSnapshotResponse } from '@/types/admin';

interface WorkerFlowGuideProps {
  snapshot?: QueueSnapshotResponse;
  isLoading: boolean;
  isError: boolean;
}

interface WorkerPhase {
  title: string;
  description: string;
}

const WORKER_PHASES: WorkerPhase[] = [
  { title: '스케줄 대기', description: '다음 cycle-trigger 스케줄을 기다리는 단계' },
  { title: '사이클 생성', description: '활성 숙소를 조회하고 check job을 생성하는 단계' },
  { title: '숙소 체크 처리', description: 'check worker가 숙소 상태를 병렬로 확인하는 단계' },
  { title: '완료/대기', description: '현재 사이클 처리가 끝나고 다음 스케줄을 준비하는 단계' },
];

function resolveCurrentPhase(snapshot?: QueueSnapshotResponse): number {
  if (!snapshot) return 0;

  const { cycle, check } = snapshot.queues;

  if (cycle.active > 0) return 1;
  if (check.active > 0) return 2;
  if (check.waiting > 0 && check.active === 0) return 2;
  if (check.completed > 0 || cycle.completed > 0) return 3;
  return 0;
}

function getCurrentPhaseLabel(phaseIndex: number, snapshot?: QueueSnapshotResponse): string {
  if (!snapshot) return '큐 데이터 대기 중';

  const { cycle, check } = snapshot.queues;
  if (cycle.active > 0) return '사이클 생성 중';
  if (check.active > 0) return '숙소 확인 중';
  if (check.waiting > 0 && check.active === 0) return '숙소 확인 대기 중';
  return WORKER_PHASES[phaseIndex]?.title ?? '상태 확인 중';
}

export function WorkerFlowGuide({ snapshot, isLoading, isError }: WorkerFlowGuideProps) {
  const currentPhase = resolveCurrentPhase(snapshot);
  const phaseLabel = getCurrentPhaseLabel(currentPhase, snapshot);

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Activity className='size-5' />
          워커 실행 흐름
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex flex-wrap items-center gap-2'>
          <Badge variant='secondary' className='bg-status-neutral text-status-neutral-foreground'>
            현재 단계
          </Badge>
          {isLoading ? <Skeleton className='h-5 w-32' /> : <span className='text-sm font-medium'>{phaseLabel}</span>}
          {isError && <span className='text-sm text-status-error-foreground'>큐 데이터를 불러오지 못했습니다.</span>}
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3'>
          {WORKER_PHASES.map((phase, index) => {
            const isActive = index === currentPhase;
            const isCompleted = index < currentPhase;

            return (
              <div
                key={phase.title}
                className={`rounded-lg border p-3 transition-colors ${
                  isActive
                    ? 'border-status-neutral bg-status-neutral/10'
                    : isCompleted
                      ? 'border-status-success bg-status-success/10'
                      : 'border-border'
                }`}
              >
                <div className='flex items-center justify-between mb-1'>
                  <span className='text-xs text-muted-foreground'>STEP {index + 1}</span>
                  {isActive && <Badge className='bg-status-neutral text-status-neutral-foreground'>진행 중</Badge>}
                  {!isActive && isCompleted && (
                    <Badge className='bg-status-success text-status-success-foreground'>완료</Badge>
                  )}
                </div>
                <p className='font-medium text-sm'>{phase.title}</p>
                <p className='text-xs text-muted-foreground mt-1'>{phase.description}</p>
              </div>
            );
          })}
        </div>

        <div className='rounded-md border bg-muted/30 p-3 space-y-1'>
          <p className='text-sm font-medium'>실무에서 이렇게 사용하세요</p>
          <p className='text-xs text-muted-foreground'>
            `waiting` 증가 + `active` 0이 지속되면 워커 정지 가능성을 먼저 점검하세요.
          </p>
          <p className='text-xs text-muted-foreground'>
            `failed`가 증가하면 셀렉터 변경 또는 외부 사이트 응답 문제를 확인하세요.
          </p>
          <p className='text-xs text-muted-foreground'>
            `completed`가 안정적으로 증가하면 현재 워커는 정상 동작 중입니다.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
