'use client';

import { useState } from 'react';

import { Check, Copy, FileText, MessageSquare, Shield } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type CaseMessageItem, useCreateCaseMessageMutation } from '@/features/admin/cases';

import { formatDateTime } from './formatDateTime';

// ============================================================================
// Template definitions (mirrored from messages.service.ts for client use)
// ============================================================================

type TemplateCategory = 'operation' | 'dispute';

interface ClientTemplate {
  key: string;
  label: string;
  category: TemplateCategory;
  buildContent: (params?: { finalPrice?: number }) => string;
}

const TEMPLATES: ClientTemplate[] = [
  {
    key: 'intake_confirm',
    label: '접수 확인',
    category: 'operation',
    buildContent: () => '요청이 접수되었습니다.\n조건(Q4)을 검토한 뒤 진행 가능 여부와 비용을 안내드리겠습니다.',
  },
  {
    key: 'price_quote',
    label: '비용 안내',
    category: 'operation',
    buildContent: (params) => {
      const price = params?.finalPrice ?? 0;
      return [
        '요청 조건 기준으로 진행 가능하며,',
        `조건 충족(열림 확인) 시 1회 비용은 ${price.toLocaleString('ko-KR')}원입니다.`,
        '해당 요청은 조건 충족 1회만 유효하며, 최초 충족 시점에만 비용이 발생합니다.',
      ].join('\n');
    },
  },
  {
    key: 'payment_start',
    label: '결제 확인 + 시작',
    category: 'operation',
    buildContent: () =>
      [
        '결제 확인되었습니다.',
        '이제부터 설정하신 조건에 맞춰 모니터링을 시작합니다.',
        'Q4에 명시된 조건이 충족되면 알림으로 알려드리겠습니다.',
      ].join('\n'),
  },
  {
    key: 'dispute_scope',
    label: '범위 안내',
    category: 'dispute',
    buildContent: () =>
      [
        '본 서비스는 제출 시 동의하신 범위(폼 Q4 기준 조건 충족 여부 탐지)로만 제공됩니다.',
        '예약/결제 완료는 보장하지 않으며, 해당 범위 외 추가 조치는 어렵습니다.',
      ].join('\n'),
  },
  {
    key: 'dispute_evidence',
    label: '증거 패킷 제공',
    category: 'dispute',
    buildContent: () =>
      [
        '조건 충족 당시 증거 자료를 첨부합니다.',
        '- 조건 충족 시각(UTC/KST)',
        '- Q4 원문 스냅샷',
        '- 페이지 상태 스크린샷',
        '- 알림 발송 기록',
        '',
        '추가 해석 없이 증거 자료만 제공해 드립니다.',
      ].join('\n'),
  },
  {
    key: 'dispute_termination',
    label: '즉시 종료',
    category: 'dispute',
    buildContent: () =>
      '운영 기준은 폼(Q4)과 제출 시 동의하신 Q7에 한해 적용됩니다.\n해당 기준 외 추가 해석은 어렵습니다.',
  },
];

const TEMPLATE_LABEL_MAP: Record<string, string> = Object.fromEntries(TEMPLATES.map((t) => [t.key, t.label]));

const CATEGORY_CONFIG = {
  operation: { label: '운영', icon: MessageSquare, color: 'text-blue-600' },
  dispute: { label: '분쟁 대응', icon: Shield, color: 'text-red-600' },
} as const;

// ============================================================================
// Component
// ============================================================================

interface Props {
  caseId: string;
  messages: CaseMessageItem[];
}

export function MessageTemplatesPanel({ caseId, messages }: Props) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const messageMutation = useCreateCaseMessageMutation();

  const selectedTemplate = TEMPLATES.find((t) => t.key === selectedKey);
  const price = Number.parseInt(priceInput, 10);
  const isPriceValid = !Number.isNaN(price) && price > 0;

  const getPreviewContent = (): string => {
    if (!selectedTemplate) return '';
    if (selectedTemplate.key === 'price_quote') {
      return selectedTemplate.buildContent({ finalPrice: isPriceValid ? price : 0 });
    }
    return selectedTemplate.buildContent();
  };

  const handleCopyAndLog = async () => {
    const content = getPreviewContent();
    if (!content) return;

    if (selectedTemplate?.key === 'price_quote' && !isPriceValid) {
      setCopyError('최종 금액을 입력해 주세요.');
      return;
    }

    try {
      await navigator.clipboard.writeText(content);
      setCopyError(null);
    } catch {
      setCopyError('클립보드 복사에 실패했습니다.');
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    messageMutation.mutate({
      caseId,
      templateKey: selectedTemplate?.key ?? '',
      channel: 'MANUAL_COPY',
      content,
    });
  };

  const operationTemplates = TEMPLATES.filter((t) => t.category === 'operation');
  const disputeTemplates = TEMPLATES.filter((t) => t.category === 'dispute');

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <FileText className='size-5' />
          고객 커뮤니케이션
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Template Selection */}
        {[
          { templates: operationTemplates, category: 'operation' as const },
          { templates: disputeTemplates, category: 'dispute' as const },
        ].map(({ templates, category }) => {
          const config = CATEGORY_CONFIG[category];
          const Icon = config.icon;
          return (
            <div key={category}>
              <p className={`text-sm font-medium mb-2 flex items-center gap-1.5 ${config.color}`}>
                <Icon className='size-3.5' />
                {config.label}
              </p>
              <div className='flex flex-wrap gap-1.5'>
                {templates.map((t) => (
                  <Button
                    key={t.key}
                    variant={selectedKey === t.key ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => {
                      setSelectedKey(selectedKey === t.key ? null : t.key);
                      setCopied(false);
                    }}
                  >
                    {t.label}
                  </Button>
                ))}
              </div>
            </div>
          );
        })}

        {/* Preview + Action */}
        {selectedTemplate && (
          <div className='space-y-3 rounded-md border p-3'>
            {selectedTemplate.key === 'price_quote' && (
              <div className='space-y-1'>
                <Label htmlFor='price-input' className='text-xs'>
                  최종 금액 (원)
                </Label>
                <Input
                  id='price-input'
                  type='number'
                  placeholder='예: 43000'
                  value={priceInput}
                  onChange={(e) => {
                    setPriceInput(e.target.value);
                    setCopyError(null);
                  }}
                />
              </div>
            )}

            <pre className='whitespace-pre-wrap text-sm bg-muted p-2 rounded-md'>{getPreviewContent()}</pre>

            <Button
              size='sm'
              onClick={handleCopyAndLog}
              disabled={messageMutation.isPending || (selectedTemplate?.key === 'price_quote' && !isPriceValid)}
            >
              {copied ? (
                <>
                  <Check className='size-3.5 mr-1.5' />
                  복사 + 기록 완료
                </>
              ) : (
                <>
                  <Copy className='size-3.5 mr-1.5' />
                  클립보드 복사 + 기록
                </>
              )}
            </Button>

            {copyError && <p className='text-sm text-destructive'>{copyError}</p>}
            {messageMutation.isError && <p className='text-sm text-destructive'>{messageMutation.error.message}</p>}
          </div>
        )}

        {/* Message History */}
        <div>
          <p className='text-sm font-medium mb-2'>발송 이력</p>
          {messages.length === 0 ? (
            <p className='text-sm text-muted-foreground'>이력이 없습니다</p>
          ) : (
            <div className='space-y-2'>
              {messages.map((msg) => (
                <div key={msg.id} className='flex items-start gap-3 text-sm'>
                  <div className='mt-1 size-2 rounded-full bg-muted-foreground shrink-0' />
                  <div>
                    <p>
                      <span className='font-medium'>{TEMPLATE_LABEL_MAP[msg.templateKey] ?? msg.templateKey}</span>
                      <Badge variant='outline' className='ml-2 text-xs'>
                        {msg.channel}
                      </Badge>
                    </p>
                    <p className='text-muted-foreground text-xs mt-0.5'>
                      {msg.sentById} &middot; {formatDateTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
