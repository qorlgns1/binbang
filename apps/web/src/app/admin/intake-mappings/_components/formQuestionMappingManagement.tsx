'use client';

import { type FormEvent, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  FORM_QUESTION_FIELDS,
  type FormQuestionField,
  type FormQuestionMappingItem,
  useCreateFormQuestionMappingMutation,
  useDeleteFormQuestionMappingMutation,
  useFormQuestionMappingsQuery,
  useUpdateFormQuestionMappingMutation,
} from '@/features/admin/form-question-mappings';

const DEFAULT_FORM_KEY = '*';

const FIELD_LABELS: Record<FormQuestionField, string> = {
  CONTACT_CHANNEL: '연락 채널',
  CONTACT_VALUE: '연락 수단',
  TARGET_URL: '대상 URL',
  CONDITION_DEFINITION: '조건 정의',
  REQUEST_WINDOW: '요청 날짜',
  CHECK_FREQUENCY: '확인 빈도',
  BILLING_CONSENT: '비용 동의',
  SCOPE_CONSENT: '범위 동의',
};

const CONSENT_FIELDS = new Set<FormQuestionField>(['BILLING_CONSENT', 'SCOPE_CONSENT']);

interface MappingDraft {
  formKey: string;
  field: FormQuestionField;
  questionItemId: string;
  questionTitle: string;
  expectedAnswer: string;
  isActive: boolean;
}

function makeInitialDraft(): MappingDraft {
  return {
    formKey: DEFAULT_FORM_KEY,
    field: 'CONTACT_CHANNEL',
    questionItemId: '',
    questionTitle: '',
    expectedAnswer: '',
    isActive: true,
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toDraftFromItem(item: FormQuestionMappingItem): MappingDraft {
  return {
    formKey: item.formKey,
    field: item.field,
    questionItemId: item.questionItemId ?? '',
    questionTitle: item.questionTitle,
    expectedAnswer: item.expectedAnswer ?? '',
    isActive: item.isActive,
  };
}

export function FormQuestionMappingManagement() {
  const [filterFormKey, setFilterFormKey] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<MappingDraft>(makeInitialDraft);

  const filters = useMemo(
    () => ({
      ...(filterFormKey.trim() ? { formKey: filterFormKey.trim() } : {}),
      ...(includeInactive ? { includeInactive: true } : {}),
    }),
    [filterFormKey, includeInactive],
  );

  const { data, isLoading, isError } = useFormQuestionMappingsQuery(filters);
  const createMutation = useCreateFormQuestionMappingMutation();
  const updateMutation = useUpdateFormQuestionMappingMutation();
  const deleteMutation = useDeleteFormQuestionMappingMutation();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const needsExpectedAnswer = CONSENT_FIELDS.has(draft.field);

  function resetDraft(): void {
    setEditingId(null);
    setDraft(makeInitialDraft());
  }

  function handleEdit(item: FormQuestionMappingItem): void {
    setEditingId(item.id);
    setDraft(toDraftFromItem(item));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    try {
      const payload = {
        formKey: draft.formKey.trim() || DEFAULT_FORM_KEY,
        field: draft.field,
        questionItemId: draft.questionItemId.trim() || null,
        questionTitle: draft.questionTitle.trim(),
        expectedAnswer: needsExpectedAnswer ? draft.expectedAnswer.trim() || null : null,
        isActive: draft.isActive,
      };

      if (!payload.questionTitle) {
        throw new Error('questionTitle is required');
      }

      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          payload,
        });
      } else {
        await createMutation.mutateAsync(payload);
      }

      resetDraft();
    } catch (error) {
      alert(error instanceof Error ? error.message : '질문 매핑 저장에 실패했습니다');
    }
  }

  async function handleDelete(id: string): Promise<void> {
    const ok = confirm('이 매핑을 삭제하시겠습니까?');
    if (!ok) return;

    try {
      await deleteMutation.mutateAsync(id);
      if (editingId === id) {
        resetDraft();
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : '질문 매핑 삭제에 실패했습니다');
    }
  }

  async function handleToggle(item: FormQuestionMappingItem): Promise<void> {
    try {
      await updateMutation.mutateAsync({
        id: item.id,
        payload: { isActive: !item.isActive },
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : '활성 상태 변경에 실패했습니다');
    }
  }

  return (
    <div className='space-y-4'>
      <div className='space-y-1'>
        <h1 className='text-2xl font-bold'>폼 질문 매핑 관리</h1>
        <p className='text-sm text-muted-foreground'>
          매핑 우선순위는 `itemId` &gt; `title(정확 일치)`입니다. itemId가 바뀌면 title fallback으로 매칭되고 검토
          필요로 표시됩니다.
        </p>
      </div>

      <div className='rounded-md border p-4 space-y-4'>
        <div className='grid gap-3 md:grid-cols-3'>
          <div className='space-y-2'>
            <Label htmlFor='filter-form-key'>필터 Form Key</Label>
            <Input
              id='filter-form-key'
              value={filterFormKey}
              onChange={(e) => setFilterFormKey(e.target.value)}
              placeholder='기본값: 전체'
            />
          </div>
          <div className='flex items-end gap-2'>
            <Checkbox
              id='filter-include-inactive'
              checked={includeInactive}
              onCheckedChange={(checked) => setIncludeInactive(checked === true)}
            />
            <Label htmlFor='filter-include-inactive'>비활성 항목 포함</Label>
          </div>
        </div>
      </div>

      <form className='rounded-md border p-4 space-y-4' onSubmit={handleSubmit}>
        <div className='flex items-center justify-between gap-2'>
          <h2 className='text-lg font-semibold'>{editingId ? '질문 매핑 수정' : '질문 매핑 등록'}</h2>
          {editingId ? (
            <Button type='button' variant='outline' size='sm' onClick={resetDraft}>
              신규 등록으로 전환
            </Button>
          ) : null}
        </div>

        <div className='grid gap-3 md:grid-cols-2'>
          <div className='space-y-2'>
            <Label htmlFor='mapping-form-key'>Form Key</Label>
            <Input
              id='mapping-form-key'
              value={draft.formKey}
              onChange={(e) => setDraft((prev) => ({ ...prev, formKey: e.target.value }))}
              placeholder='*'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='mapping-field'>Canonical Field</Label>
            <Select
              value={draft.field}
              onValueChange={(value) =>
                setDraft((prev) => ({
                  ...prev,
                  field: value as FormQuestionField,
                  ...(CONSENT_FIELDS.has(value as FormQuestionField) ? {} : { expectedAnswer: '' }),
                }))
              }
            >
              <SelectTrigger id='mapping-field'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORM_QUESTION_FIELDS.map((field) => (
                  <SelectItem key={field} value={field}>
                    {FIELD_LABELS[field]} ({field})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-2 md:col-span-2'>
            <Label htmlFor='mapping-item-id'>질문 Item ID (안정키, 선택)</Label>
            <Input
              id='mapping-item-id'
              value={draft.questionItemId}
              onChange={(e) => setDraft((prev) => ({ ...prev, questionItemId: e.target.value }))}
              placeholder='예: 1829594974'
            />
          </div>
          <div className='space-y-2 md:col-span-2'>
            <Label htmlFor='mapping-question-title'>질문 제목 (정확 일치)</Label>
            <Input
              id='mapping-question-title'
              value={draft.questionTitle}
              onChange={(e) => setDraft((prev) => ({ ...prev, questionTitle: e.target.value }))}
              placeholder='예: Q1. 연락 받을 방법 (필수)'
            />
          </div>
          <div className='space-y-2 md:col-span-2'>
            <Label htmlFor='mapping-expected-answer'>기대 답변 (동의 필드만 필수)</Label>
            <Input
              id='mapping-expected-answer'
              value={draft.expectedAnswer}
              disabled={!needsExpectedAnswer}
              onChange={(e) => setDraft((prev) => ({ ...prev, expectedAnswer: e.target.value }))}
              placeholder='예: 요청한 조건이 충족된 시점(열림 확인)에 비용이 발생하는 것에 동의합니다.'
            />
          </div>
          <div className='flex items-center gap-2'>
            <Checkbox
              id='mapping-active'
              checked={draft.isActive}
              onCheckedChange={(checked) => setDraft((prev) => ({ ...prev, isActive: checked === true }))}
            />
            <Label htmlFor='mapping-active'>활성 상태</Label>
          </div>
        </div>

        <div className='flex gap-2'>
          <Button type='submit' disabled={isSubmitting}>
            {editingId ? '수정 저장' : '질문 등록'}
          </Button>
          {editingId ? (
            <Button type='button' variant='outline' onClick={resetDraft}>
              취소
            </Button>
          ) : null}
        </div>
      </form>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Form Key</TableHead>
              <TableHead>Field</TableHead>
              <TableHead>Item ID</TableHead>
              <TableHead>질문 제목</TableHead>
              <TableHead>기대 답변</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>수정일</TableHead>
              <TableHead>작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              [0, 1, 2, 3].map((row) => (
                <TableRow key={`mapping-skeleton-${row}`}>
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((col) => (
                    <TableCell key={`mapping-skeleton-cell-${row}-${col}`}>
                      <Skeleton className='h-4 w-24' />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {isError && (
              <TableRow>
                <TableCell colSpan={8} className='text-center text-destructive'>
                  질문 매핑 데이터를 불러오지 못했습니다
                </TableCell>
              </TableRow>
            )}
            {data && data.mappings.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className='text-center text-muted-foreground'>
                  등록된 질문 매핑이 없습니다
                </TableCell>
              </TableRow>
            )}
            {data?.mappings.map((item) => (
              <TableRow key={item.id}>
                <TableCell className='font-mono text-xs'>{item.formKey}</TableCell>
                <TableCell className='text-xs'>
                  <div className='font-medium'>{FIELD_LABELS[item.field]}</div>
                  <div className='font-mono text-muted-foreground'>{item.field}</div>
                </TableCell>
                <TableCell className='font-mono text-xs'>{item.questionItemId ?? '-'}</TableCell>
                <TableCell className='max-w-md text-xs'>{item.questionTitle}</TableCell>
                <TableCell className='max-w-md text-xs'>{item.expectedAnswer ?? '-'}</TableCell>
                <TableCell>
                  <Badge variant={item.isActive ? 'default' : 'secondary'}>{item.isActive ? '활성' : '비활성'}</Badge>
                </TableCell>
                <TableCell className='text-xs text-muted-foreground'>{formatDate(item.updatedAt)}</TableCell>
                <TableCell className='space-x-2 whitespace-nowrap'>
                  <Button type='button' size='sm' variant='outline' onClick={() => handleEdit(item)}>
                    수정
                  </Button>
                  <Button type='button' size='sm' variant='outline' onClick={() => handleToggle(item)}>
                    {item.isActive ? '비활성화' : '활성화'}
                  </Button>
                  <Button type='button' size='sm' variant='destructive' onClick={() => handleDelete(item.id)}>
                    삭제
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
