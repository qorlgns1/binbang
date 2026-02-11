'use client';

import { AlertTriangle, CheckCircle2, FileText } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ConsentTexts {
  billing: string;
  scope: string;
}

interface Props {
  responseId: string;
  consentBillingOnConditionMet: boolean | null;
  consentServiceScope: boolean | null;
  consentCapturedAt: string | null;
  consentTexts: ConsentTexts | null;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function ConsentRow({ agreed, label, text }: { agreed: boolean | null; label: string; text: string | null }) {
  const isAgreed = agreed === true;
  return (
    <div className='space-y-1'>
      <div className='flex items-center gap-2'>
        {isAgreed ? (
          <CheckCircle2 className='size-4 text-green-600 shrink-0' />
        ) : (
          <AlertTriangle className='size-4 text-red-600 shrink-0' />
        )}
        <span className='text-sm font-medium'>{label}</span>
      </div>
      {text && <p className='text-xs text-muted-foreground ml-6'>&ldquo;{text}&rdquo;</p>}
    </div>
  );
}

export function ConsentEvidencePanel({
  responseId,
  consentBillingOnConditionMet,
  consentServiceScope,
  consentCapturedAt,
  consentTexts,
}: Props) {
  const hasConsent = consentBillingOnConditionMet != null || consentServiceScope != null;

  if (!hasConsent) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <FileText className='size-5 text-muted-foreground' />
          Q7 동의 증거
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <ConsentRow agreed={consentBillingOnConditionMet} label='비용 발생 동의' text={consentTexts?.billing ?? null} />
        <ConsentRow agreed={consentServiceScope} label='서비스 범위 동의' text={consentTexts?.scope ?? null} />

        <div className='border-t pt-3 space-y-1 text-xs text-muted-foreground'>
          {consentCapturedAt && (
            <p>
              동의 캡처 시각: <span className='font-mono'>{formatDateTime(consentCapturedAt)}</span>
            </p>
          )}
          <p>
            폼 응답 ID: <span className='font-mono'>{responseId}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
