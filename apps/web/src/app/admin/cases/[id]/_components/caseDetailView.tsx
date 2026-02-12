'use client';

import Link from 'next/link';

import { ArrowLeft } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCaseDetailQuery } from '@/features/admin/cases';

import { AccommodationLinkButton } from './accommodationLinkButton';
import { ClarificationPanel } from './clarificationPanel';
import { ConditionEvidencePanel } from './conditionEvidencePanel';
import { ConsentEvidencePanel } from './consentEvidencePanel';
import { formatDateTime } from './formatDateTime';
import { PaymentConfirmButton } from './paymentConfirmButton';
import { StatusTransitionDialog } from './statusTransitionDialog';

interface Props {
  caseId: string;
}

export function CaseDetailView({ caseId }: Props) {
  const { data: caseData, isLoading, isError } = useCaseDetailQuery(caseId);

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <Skeleton className='h-8 w-48' />
        <div className='grid gap-6 lg:grid-cols-2'>
          <Skeleton className='h-64' />
          <Skeleton className='h-64' />
        </div>
      </div>
    );
  }

  if (isError || !caseData) {
    return (
      <div className='space-y-4'>
        <Button variant='ghost' size='sm' asChild>
          <Link href='/admin/cases'>
            <ArrowLeft className='size-4 mr-2' />
            케이스 목록
          </Link>
        </Button>
        <p className='text-destructive'>케이스 정보를 불러올 수 없습니다</p>
      </div>
    );
  }

  const extracted = caseData.submission.extractedFields as Record<string, unknown> | null;

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='sm' asChild>
          <Link href='/admin/cases'>
            <ArrowLeft className='size-4 mr-2' />
            케이스 목록
          </Link>
        </Button>
        <h1 className='text-xl font-bold'>케이스 상세</h1>
      </div>

      <div className='grid gap-6 lg:grid-cols-2'>
        {/* 좌측: 케이스 정보 */}
        <div className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center justify-between'>
                <span>기본 정보</span>
                <StatusTransitionDialog
                  caseId={caseId}
                  currentStatus={caseData.status}
                  paymentConfirmedAt={caseData.paymentConfirmedAt}
                  accommodationId={caseData.accommodationId}
                  conditionMetEventsCount={caseData.conditionMetEvents.length}
                />
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <InfoRow label='ID' value={caseData.id} mono />
              <InfoRow label='상태' value={<Badge variant='outline'>{caseData.status}</Badge>} />
              <InfoRow label='접수일' value={formatDateTime(caseData.createdAt)} />
              <InfoRow label='최종 변경' value={formatDateTime(caseData.statusChangedAt)} />
              {caseData.assignedTo && <InfoRow label='담당자' value={caseData.assignedTo} />}
              {caseData.note && <InfoRow label='메모' value={caseData.note} />}
              <PaymentConfirmButton
                caseId={caseId}
                currentStatus={caseData.status}
                paymentConfirmedAt={caseData.paymentConfirmedAt}
                paymentConfirmedBy={caseData.paymentConfirmedBy}
              />
              <AccommodationLinkButton
                caseId={caseId}
                currentStatus={caseData.status}
                accommodationId={caseData.accommodationId}
              />
            </CardContent>
          </Card>

          {extracted && (
            <Card>
              <CardHeader>
                <CardTitle>추출 필드</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className='space-y-2 text-sm'>
                  {Object.entries(extracted).map(([key, value]) => (
                    <div key={key} className='grid grid-cols-[120px_1fr] gap-2'>
                      <dt className='font-medium text-muted-foreground'>{key}</dt>
                      <dd className='break-all'>{String(value ?? '-')}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 우측: Clarification + Timeline */}
        <div className='space-y-4'>
          <ClarificationPanel
            caseId={caseId}
            currentStatus={caseData.status}
            ambiguityResult={caseData.ambiguityResult}
            clarificationResolvedAt={caseData.clarificationResolvedAt}
          />

          <ConsentEvidencePanel
            responseId={caseData.submission.responseId}
            consentBillingOnConditionMet={caseData.submission.consentBillingOnConditionMet}
            consentServiceScope={caseData.submission.consentServiceScope}
            consentCapturedAt={caseData.submission.consentCapturedAt}
            consentTexts={caseData.submission.consentTexts}
          />

          <ConditionEvidencePanel conditionMetEvents={caseData.conditionMetEvents} currentStatus={caseData.status} />

          <Card>
            <CardHeader>
              <CardTitle>상태 이력</CardTitle>
            </CardHeader>
            <CardContent>
              {caseData.statusLogs.length === 0 ? (
                <p className='text-sm text-muted-foreground'>이력이 없습니다</p>
              ) : (
                <div className='space-y-3'>
                  {caseData.statusLogs.map((log) => (
                    <div key={log.id} className='flex items-start gap-3 text-sm'>
                      <div className='mt-1 size-2 rounded-full bg-muted-foreground shrink-0' />
                      <div>
                        <p>
                          <span className='font-medium'>{log.fromStatus}</span>
                          {' → '}
                          <span className='font-medium'>{log.toStatus}</span>
                        </p>
                        {log.reason && <p className='text-muted-foreground'>{log.reason}</p>}
                        <p className='text-xs text-muted-foreground'>{formatDateTime(log.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className='flex items-center justify-between text-sm'>
      <span className='text-muted-foreground'>{label}</span>
      <span className={mono ? 'font-mono text-xs' : ''}>{value}</span>
    </div>
  );
}
