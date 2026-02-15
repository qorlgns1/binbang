'use client';

import { useMemo, useState } from 'react';

import { Calculator, CheckCircle2, Clock3, History, Save } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  useCasePricePreviewQuery,
  useCasePriceQuoteHistoryQuery,
  useSaveCasePriceQuoteMutation,
  type PricingInputSnapshot,
} from '@/features/admin/cases';

import { formatDateTime } from './formatDateTime';

interface Props {
  caseId: string;
}

const PLATFORM_OPTIONS: Array<{ value: PricingInputSnapshot['platform']; label: string }> = [
  { value: 'AGODA', label: 'Agoda' },
  { value: 'AIRBNB', label: 'Airbnb' },
  { value: 'OTHER', label: '기타' },
];

const DURATION_OPTIONS: Array<{ value: PricingInputSnapshot['durationBucket']; label: string }> = [
  { value: 'LE_24H', label: '24시간 이내' },
  { value: 'BETWEEN_24H_72H', label: '24시간 초과 ~ 72시간' },
  { value: 'BETWEEN_72H_7D', label: '72시간 초과 ~ 7일' },
  { value: 'GT_7D', label: '7일 초과' },
];

const DIFFICULTY_OPTIONS: Array<{ value: PricingInputSnapshot['difficulty']; label: string }> = [
  { value: 'L', label: 'L (조건 3개 이하)' },
  { value: 'M', label: 'M (조건 4~6개)' },
  { value: 'H', label: 'H (조건 7개 이상)' },
];

const URGENCY_OPTIONS: Array<{ value: PricingInputSnapshot['urgencyBucket']; label: string }> = [
  { value: 'D0_D1', label: 'D-0 ~ D-1' },
  { value: 'D2_D3', label: 'D-2 ~ D-3' },
  { value: 'D4_PLUS', label: 'D-4 이상' },
];

const FREQUENCY_OPTIONS: Array<{ value: PricingInputSnapshot['frequencyBucket']; label: string }> = [
  { value: 'F15M', label: '15분' },
  { value: 'F30M', label: '30분' },
  { value: 'F60M_PLUS', label: '1시간 이상' },
];

const DEFAULT_INPUT: PricingInputSnapshot = {
  platform: 'AGODA',
  durationBucket: 'BETWEEN_24H_72H',
  difficulty: 'M',
  urgencyBucket: 'D2_D3',
  frequencyBucket: 'F30M',
};

function formatKrw(value: number): string {
  return `${value.toLocaleString('ko-KR')}원`;
}

export function PricingPanel({ caseId }: Props) {
  const [input, setInput] = useState<PricingInputSnapshot>(DEFAULT_INPUT);
  const [changeReason, setChangeReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const previewQuery = useCasePricePreviewQuery(caseId, input);
  const historyQuery = useCasePriceQuoteHistoryQuery(caseId);
  const saveMutation = useSaveCasePriceQuoteMutation();

  const trimmedReason = changeReason.trim();
  const preview = previewQuery.data;

  const canSave = useMemo((): boolean => {
    return !saveMutation.isPending && !!preview && trimmedReason.length > 0;
  }, [preview, saveMutation.isPending, trimmedReason.length]);

  const handleSave = () => {
    if (trimmedReason.length === 0) {
      setFormError('변경 사유를 입력해 주세요.');
      return;
    }

    setFormError(null);
    setSavedAt(null);

    saveMutation.mutate(
      {
        caseId,
        ...input,
        changeReason: trimmedReason,
      },
      {
        onSuccess: () => {
          setChangeReason('');
          setSavedAt(new Date().toISOString());
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Calculator className='size-5' />
          견적 산식
          <Badge variant='outline' className='ml-auto'>
            policy v1
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-5'>
        <div className='grid gap-3 sm:grid-cols-2'>
          <div className='space-y-1.5'>
            <Label>플랫폼</Label>
            <Select
              value={input.platform}
              onValueChange={(value: PricingInputSnapshot['platform']) =>
                setInput((prev) => ({ ...prev, platform: value }))
              }
            >
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORM_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-1.5'>
            <Label>요청 기간</Label>
            <Select
              value={input.durationBucket}
              onValueChange={(value: PricingInputSnapshot['durationBucket']) =>
                setInput((prev) => ({ ...prev, durationBucket: value }))
              }
            >
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-1.5'>
            <Label>난이도</Label>
            <Select
              value={input.difficulty}
              onValueChange={(value: PricingInputSnapshot['difficulty']) =>
                setInput((prev) => ({ ...prev, difficulty: value }))
              }
            >
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIFFICULTY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-1.5'>
            <Label>체크인 임박도</Label>
            <Select
              value={input.urgencyBucket}
              onValueChange={(value: PricingInputSnapshot['urgencyBucket']) =>
                setInput((prev) => ({ ...prev, urgencyBucket: value }))
              }
            >
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {URGENCY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-1.5 sm:col-span-2'>
            <Label>체크 빈도</Label>
            <Select
              value={input.frequencyBucket}
              onValueChange={(value: PricingInputSnapshot['frequencyBucket']) =>
                setInput((prev) => ({ ...prev, frequencyBucket: value }))
              }
            >
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className='rounded-md border p-3 space-y-2'>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>예상 금액</span>
            {previewQuery.isFetching ? (
              <span className='text-xs text-muted-foreground flex items-center gap-1'>
                <Clock3 className='size-3.5' />
                계산 중...
              </span>
            ) : null}
          </div>

          {previewQuery.isError ? <p className='text-sm text-destructive'>{previewQuery.error.message}</p> : null}

          {preview ? (
            <>
              <div className='text-xl font-semibold'>{formatKrw(preview.roundedAmountKrw)}</div>
              <dl className='grid gap-1 text-xs text-muted-foreground'>
                <div className='flex items-center justify-between'>
                  <dt>기본요금</dt>
                  <dd>{formatKrw(preview.weightsSnapshot.baseFee)}</dd>
                </div>
                <div className='flex items-center justify-between'>
                  <dt>기간가중</dt>
                  <dd>{formatKrw(preview.weightsSnapshot.duration)}</dd>
                </div>
                <div className='flex items-center justify-between'>
                  <dt>난이도가중</dt>
                  <dd>{formatKrw(preview.weightsSnapshot.difficulty)}</dd>
                </div>
                <div className='flex items-center justify-between'>
                  <dt>긴급도가중</dt>
                  <dd>{formatKrw(preview.weightsSnapshot.urgency)}</dd>
                </div>
                <div className='flex items-center justify-between'>
                  <dt>빈도가중</dt>
                  <dd>{formatKrw(preview.weightsSnapshot.frequency)}</dd>
                </div>
                <div className='flex items-center justify-between pt-1 border-t'>
                  <dt>반올림 전 합계</dt>
                  <dd>{formatKrw(preview.computedAmountKrw)}</dd>
                </div>
              </dl>
            </>
          ) : (
            <p className='text-sm text-muted-foreground'>입력값을 선택하면 서버에서 예상 금액을 계산합니다.</p>
          )}
        </div>

        <div className='space-y-1.5'>
          <Label htmlFor='pricing-change-reason'>변경 사유</Label>
          <Textarea
            id='pricing-change-reason'
            placeholder='예: urgency up'
            rows={3}
            value={changeReason}
            onChange={(event) => {
              setChangeReason(event.target.value);
              setFormError(null);
            }}
          />
        </div>

        <div className='flex flex-col gap-2'>
          <Button onClick={handleSave} disabled={!canSave}>
            <Save className='size-4 mr-2' />
            {saveMutation.isPending ? '저장 중...' : '견적 저장'}
          </Button>
          {formError ? <p className='text-sm text-destructive'>{formError}</p> : null}
          {saveMutation.isError ? <p className='text-sm text-destructive'>{saveMutation.error.message}</p> : null}
          {savedAt ? (
            <p className='text-sm text-emerald-700 flex items-center gap-1.5'>
              <CheckCircle2 className='size-4' />
              저장 완료 ({formatDateTime(savedAt)})
            </p>
          ) : null}
        </div>

        <div className='space-y-2'>
          <p className='text-sm font-medium flex items-center gap-1.5'>
            <History className='size-4' />
            견적 변경 이력
          </p>

          {historyQuery.isLoading ? <p className='text-sm text-muted-foreground'>이력을 불러오는 중...</p> : null}
          {historyQuery.isError ? <p className='text-sm text-destructive'>{historyQuery.error.message}</p> : null}
          {historyQuery.data && historyQuery.data.length === 0 ? (
            <p className='text-sm text-muted-foreground'>아직 저장된 견적 이력이 없습니다.</p>
          ) : null}

          {historyQuery.data && historyQuery.data.length > 0 ? (
            <div className='space-y-2'>
              {historyQuery.data.map((quote) => (
                <div key={quote.quoteId} className='rounded-md border p-3'>
                  <div className='flex items-center justify-between gap-2'>
                    <div className='font-medium'>{formatKrw(quote.roundedAmountKrw)}</div>
                    <Badge variant={quote.isActive ? 'default' : 'outline'}>{quote.isActive ? '활성' : '비활성'}</Badge>
                  </div>
                  <p className='text-sm mt-1'>{quote.changeReason}</p>
                  <p className='text-xs text-muted-foreground mt-1'>
                    {quote.changedBy} · {formatDateTime(quote.updatedAt)}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
