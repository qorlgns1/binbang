import { prisma } from '@workspace/db';

// ============================================================================
// Types
// ============================================================================

export interface CreateCaseMessageInput {
  caseId: string;
  templateKey: string;
  channel: string;
  content: string;
  sentById: string;
}

export interface CaseMessageOutput {
  id: string;
  templateKey: string;
  channel: string;
  content: string;
  sentById: string;
  createdAt: string;
}

export interface OperatorMessageStat {
  templateKey: string;
  count: number;
}

// ============================================================================
// Template Constants
// ============================================================================

export type TemplateCategory = 'operation' | 'dispute';

export interface MessageTemplate {
  key: string;
  label: string;
  category: TemplateCategory;
  buildContent: (params?: { finalPrice?: number }) => string;
}

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  // ── 운영 템플릿 ──
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
  // ── 분쟁 대응 템플릿 ──
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

export function getTemplateByKey(key: string): MessageTemplate | undefined {
  return MESSAGE_TEMPLATES.find((t) => t.key === key);
}

// ============================================================================
// Shared Select
// ============================================================================

const CASE_MESSAGE_SELECT = {
  id: true,
  templateKey: true,
  channel: true,
  content: true,
  sentById: true,
  createdAt: true,
} as const;

// ============================================================================
// Service Functions
// ============================================================================

export async function createCaseMessage(input: CreateCaseMessageInput): Promise<CaseMessageOutput> {
  const { caseId, templateKey, channel, content, sentById } = input;

  const caseRecord = await prisma.case.findUnique({
    where: { id: caseId },
    select: { id: true },
  });

  if (!caseRecord) {
    throw new Error('Case not found');
  }

  const message = await prisma.caseMessage.create({
    data: {
      caseId,
      templateKey,
      channel,
      content,
      sentById,
    },
    select: CASE_MESSAGE_SELECT,
  });

  return toCaseMessageOutput(message);
}

export async function getCaseMessages(caseId: string): Promise<CaseMessageOutput[]> {
  const messages = await prisma.caseMessage.findMany({
    where: { caseId },
    select: CASE_MESSAGE_SELECT,
    orderBy: { createdAt: 'desc' },
  });

  return messages.map(toCaseMessageOutput);
}

export async function getOperatorMessageStats(sentById?: string): Promise<OperatorMessageStat[]> {
  const where = sentById ? { sentById } : {};

  const groups = await prisma.caseMessage.groupBy({
    by: ['templateKey'],
    where,
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });

  return groups.map((g) => ({
    templateKey: g.templateKey,
    count: g._count.id,
  }));
}

// ============================================================================
// Helpers
// ============================================================================

interface CaseMessageRow {
  id: string;
  templateKey: string;
  channel: string;
  content: string;
  sentById: string;
  createdAt: Date;
}

function toCaseMessageOutput(row: CaseMessageRow): CaseMessageOutput {
  return {
    id: row.id,
    templateKey: row.templateKey,
    channel: row.channel,
    content: row.content,
    sentById: row.sentById,
    createdAt: row.createdAt.toISOString(),
  };
}
