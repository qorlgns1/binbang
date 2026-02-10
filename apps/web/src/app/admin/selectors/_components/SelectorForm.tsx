'use client';

import { useState } from 'react';

import type { Platform, SelectorCategory } from '@/generated/prisma/client';
import { useCreateSelector, useUpdateSelector } from '@/hooks/useSelectors';
import type { PlatformSelectorItem } from '@/types/admin';

interface SelectorFormProps {
  platform: Platform;
  selector: PlatformSelectorItem | null;
  onClose: () => void;
}

const CATEGORIES: { value: SelectorCategory; label: string }[] = [
  { value: 'PRICE', label: '가격' },
  { value: 'AVAILABILITY', label: '가용성' },
  { value: 'METADATA', label: '메타데이터' },
  { value: 'PLATFORM_ID', label: '플랫폼 ID' },
];

export function SelectorForm({ platform, selector, onClose }: SelectorFormProps) {
  const isEdit = !!selector;

  const [category, setCategory] = useState<SelectorCategory>(selector?.category ?? 'PRICE');
  const [name, setName] = useState(selector?.name ?? '');
  const [selectorValue, setSelectorValue] = useState(selector?.selector ?? '');
  const [extractorCode, setExtractorCode] = useState(selector?.extractorCode ?? '');
  const [priority, setPriority] = useState(selector?.priority ?? 0);
  const [description, setDescription] = useState(selector?.description ?? '');

  const createSelector = useCreateSelector();
  const updateSelector = useUpdateSelector();

  const isPending = createSelector.isPending || updateSelector.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEdit) {
      updateSelector.mutate(
        {
          id: selector.id,
          payload: {
            selector: selectorValue,
            extractorCode: extractorCode || null,
            priority,
            description: description || null,
          },
        },
        {
          onSuccess: () => onClose(),
          onError: (error) => alert(error.message),
        },
      );
    } else {
      createSelector.mutate(
        {
          platform,
          category,
          name,
          selector: selectorValue,
          extractorCode: extractorCode || undefined,
          priority,
          description: description || undefined,
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
      <div className='w-full max-w-2xl rounded-lg border border-border bg-card p-6 shadow-lg'>
        <h2 className='mb-4 text-lg font-semibold'>{isEdit ? '셀렉터 수정' : '새 셀렉터 추가'}</h2>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* Category */}
          <div>
            <label htmlFor='selector-category' className='mb-1 block text-sm font-medium'>
              카테고리
            </label>
            <select
              id='selector-category'
              value={category}
              onChange={(e) => setCategory(e.target.value as SelectorCategory)}
              disabled={isEdit}
              className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50'
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div>
            <label htmlFor='selector-name' className='mb-1 block text-sm font-medium'>
              이름
            </label>
            <input
              id='selector-name'
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isEdit}
              placeholder='예: Total Price Aria Label'
              className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50'
              required
            />
          </div>

          {/* Selector */}
          <div>
            <label htmlFor='selector-css' className='mb-1 block text-sm font-medium'>
              CSS 셀렉터
            </label>
            <input
              id='selector-css'
              type='text'
              value={selectorValue}
              onChange={(e) => setSelectorValue(e.target.value)}
              placeholder='예: [aria-label*="총액"]'
              className='w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm'
              required
            />
          </div>

          {/* Extractor Code */}
          <div>
            <label htmlFor='selector-extractor-code' className='mb-1 block text-sm font-medium'>
              추출 코드 <span className='text-muted-foreground'>(선택)</span>
            </label>
            <textarea
              id='selector-extractor-code'
              value={extractorCode}
              onChange={(e) => setExtractorCode(e.target.value)}
              placeholder={`// el은 선택된 요소입니다
const text = el.innerText || '';
const match = text.match(/[₩$€£][\\s]*[\\d,]+/);
return match ? match[0] : null;`}
              rows={6}
              className='w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm'
            />
            <p className='mt-1 text-xs text-muted-foreground'>
              JavaScript 코드로 요소에서 값을 추출합니다. <code>el</code> 변수로 선택된 요소에 접근할 수 있습니다.
            </p>
          </div>

          {/* Priority */}
          <div>
            <label htmlFor='selector-priority' className='mb-1 block text-sm font-medium'>
              우선순위
            </label>
            <input
              id='selector-priority'
              type='number'
              value={priority}
              onChange={(e) => setPriority(parseInt(e.target.value, 10) || 0)}
              className='w-32 rounded-md border border-input bg-background px-3 py-2 text-sm'
            />
            <p className='mt-1 text-xs text-muted-foreground'>높을수록 먼저 시도됩니다.</p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor='selector-description' className='mb-1 block text-sm font-medium'>
              설명 <span className='text-muted-foreground'>(선택)</span>
            </label>
            <input
              id='selector-description'
              type='text'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='예: aria-label에서 총액 추출'
              className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
            />
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
