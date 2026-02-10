'use client';

import { useState } from 'react';

import type { PatternType, Platform } from '@/generated/prisma/client';
import { useCreatePattern, useUpdatePattern } from '@/hooks/usePatterns';
import type { PlatformPatternItem } from '@/types/admin';

interface PatternFormProps {
  platform: Platform;
  pattern: PlatformPatternItem | null;
  onClose: () => void;
}

export function PatternForm({ platform, pattern, onClose }: PatternFormProps) {
  const isEdit = !!pattern;

  const [patternType, setPatternType] = useState<PatternType>(pattern?.patternType ?? 'AVAILABLE');
  const [patternValue, setPatternValue] = useState(pattern?.pattern ?? '');
  const [locale, setLocale] = useState(pattern?.locale ?? 'ko');
  const [priority, setPriority] = useState(pattern?.priority ?? 0);

  const createPattern = useCreatePattern();
  const updatePattern = useUpdatePattern();

  const isPending = createPattern.isPending || updatePattern.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEdit) {
      updatePattern.mutate(
        {
          id: pattern.id,
          payload: {
            pattern: patternValue,
            locale,
            priority,
          },
        },
        {
          onSuccess: () => onClose(),
          onError: (error) => alert(error.message),
        },
      );
    } else {
      createPattern.mutate(
        {
          platform,
          patternType,
          pattern: patternValue,
          locale,
          priority,
        },
        {
          onSuccess: () => onClose(),
          onError: (error) => alert(error.message),
        },
      );
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm'>
      <div className='w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg'>
        <h2 className='mb-4 text-lg font-semibold'>{isEdit ? '패턴 수정' : '새 패턴 추가'}</h2>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* Pattern Type */}
          <div>
            <label htmlFor='pattern-type' className='mb-1 block text-sm font-medium'>
              타입
            </label>
            <select
              id='pattern-type'
              value={patternType}
              onChange={(e) => setPatternType(e.target.value as PatternType)}
              disabled={isEdit}
              className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50'
            >
              <option value='AVAILABLE'>예약 가능</option>
              <option value='UNAVAILABLE'>예약 불가</option>
            </select>
          </div>

          {/* Pattern */}
          <div>
            <label htmlFor='pattern-text' className='mb-1 block text-sm font-medium'>
              패턴 텍스트
            </label>
            <input
              id='pattern-text'
              type='text'
              value={patternValue}
              onChange={(e) => setPatternValue(e.target.value)}
              placeholder='예: 예약하기, Reserve, "날짜 변경"'
              className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
              required
            />
            <p className='mt-1 text-xs text-muted-foreground'>
              페이지 본문에서 이 텍스트가 발견되면 해당 상태로 판단합니다.
            </p>
          </div>

          {/* Locale */}
          <div>
            <label htmlFor='pattern-locale' className='mb-1 block text-sm font-medium'>
              언어
            </label>
            <select
              id='pattern-locale'
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
            >
              <option value='ko'>한국어</option>
              <option value='en'>영어</option>
              <option value='ja'>일본어</option>
              <option value='zh'>중국어</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label htmlFor='pattern-priority' className='mb-1 block text-sm font-medium'>
              우선순위
            </label>
            <input
              id='pattern-priority'
              type='number'
              value={priority}
              onChange={(e) => setPriority(parseInt(e.target.value, 10) || 0)}
              className='w-32 rounded-md border border-input bg-background px-3 py-2 text-sm'
            />
            <p className='mt-1 text-xs text-muted-foreground'>높을수록 먼저 확인합니다.</p>
          </div>

          {/* Actions */}
          <div className='flex justify-end gap-2 pt-4'>
            <button
              type='button'
              onClick={onClose}
              className='rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted'
            >
              취소
            </button>
            <button
              type='submit'
              disabled={isPending}
              className='rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50'
            >
              {isPending ? '저장 중...' : isEdit ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
