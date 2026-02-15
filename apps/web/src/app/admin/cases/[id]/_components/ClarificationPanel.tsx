'use client';

import { useState } from 'react';

import { AlertTriangle, CheckCircle2, Copy, XCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTransitionCaseStatusMutation } from '@/features/admin/cases';

interface AmbiguityResult {
  severity: 'GREEN' | 'AMBER' | 'RED';
  missingSlots: string[];
  ambiguousTerms: string[];
}

interface Props {
  caseId: string;
  currentStatus: string;
  ambiguityResult: AmbiguityResult | null;
  clarificationResolvedAt: string | null;
}

const SEVERITY_CONFIG = {
  GREEN: { icon: CheckCircle2, label: '명확', color: 'bg-green-100 text-green-800', iconColor: 'text-green-600' },
  AMBER: { icon: AlertTriangle, label: '주의', color: 'bg-amber-100 text-amber-800', iconColor: 'text-amber-600' },
  RED: { icon: XCircle, label: '불명확', color: 'bg-red-100 text-red-800', iconColor: 'text-red-600' },
} as const;

function buildClarificationTemplate(result: AmbiguityResult): string {
  const lines = ['안녕하세요, 요청하신 모니터링 조건에 대해 확인이 필요합니다.\n'];

  if (result.missingSlots.length > 0) {
    lines.push('다음 정보가 누락되어 있습니다:');
    for (const slot of result.missingSlots) {
      lines.push(`  - ${slot}`);
    }
    lines.push('');
  }

  if (result.ambiguousTerms.length > 0) {
    lines.push('다음 표현이 모호합니다:');
    for (const term of result.ambiguousTerms) {
      lines.push(`  - "${term}" → 구체적인 수치/조건으로 변경 부탁드립니다`);
    }
    lines.push('');
  }

  lines.push('정확한 모니터링을 위해 위 내용을 보완해 주시면 감사하겠습니다.');
  return lines.join('\n');
}

export function ClarificationPanel({ caseId, currentStatus, ambiguityResult, clarificationResolvedAt }: Props) {
  const [copied, setCopied] = useState(false);
  const transitionMutation = useTransitionCaseStatusMutation();

  if (!ambiguityResult) {
    return null;
  }

  const config = SEVERITY_CONFIG[ambiguityResult.severity];
  const Icon = config.icon;
  const isResolved = !!clarificationResolvedAt;
  const canRequestClarification = currentStatus === 'REVIEWING' && ambiguityResult.severity !== 'GREEN';
  const canResolve = currentStatus === 'NEEDS_CLARIFICATION';

  const handleCopyTemplate = async () => {
    const template = buildClarificationTemplate(ambiguityResult);
    await navigator.clipboard.writeText(template);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRequestClarification = () => {
    transitionMutation.mutate({
      caseId,
      status: 'NEEDS_CLARIFICATION',
      reason: '모호성 분석 결과에 따른 명확화 요청',
    });
  };

  const handleResolve = () => {
    transitionMutation.mutate({
      caseId,
      status: 'REVIEWING',
      reason: '명확화 완료, 검토 재개',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Icon className={`size-5 ${config.iconColor}`} />
          모호성 분석
          <Badge className={config.color}>{config.label}</Badge>
          {isResolved && (
            <Badge variant='outline' className='ml-auto'>
              해결됨
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {ambiguityResult.missingSlots.length > 0 && (
          <div>
            <p className='text-sm font-medium mb-1'>누락 슬롯</p>
            <div className='flex flex-wrap gap-1'>
              {ambiguityResult.missingSlots.map((slot) => (
                <Badge key={slot} variant='destructive'>
                  {slot}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {ambiguityResult.ambiguousTerms.length > 0 && (
          <div>
            <p className='text-sm font-medium mb-1'>모호 표현</p>
            <div className='flex flex-wrap gap-1'>
              {ambiguityResult.ambiguousTerms.map((term) => (
                <Badge key={term} variant='outline'>
                  &ldquo;{term}&rdquo;
                </Badge>
              ))}
            </div>
          </div>
        )}

        {ambiguityResult.severity !== 'GREEN' && (
          <div className='flex flex-wrap gap-2 pt-2'>
            <Button variant='outline' size='sm' onClick={handleCopyTemplate}>
              <Copy className='size-3.5 mr-1.5' />
              {copied ? '복사됨!' : '템플릿 복사'}
            </Button>

            {canRequestClarification && (
              <Button
                variant='destructive'
                size='sm'
                onClick={handleRequestClarification}
                disabled={transitionMutation.isPending}
              >
                명확화 요청
              </Button>
            )}

            {canResolve && (
              <Button size='sm' onClick={handleResolve} disabled={transitionMutation.isPending}>
                해결됨 처리
              </Button>
            )}
          </div>
        )}

        {transitionMutation.isError && <p className='text-sm text-destructive'>{transitionMutation.error.message}</p>}
      </CardContent>
    </Card>
  );
}
