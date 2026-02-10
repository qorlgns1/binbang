'use client';

import { useState } from 'react';

import type { Platform, SelectorCategory } from '@workspace/db/enums';
import { useDeleteSelector, useSelectors, useUpdateSelector } from '@/hooks/useSelectors';
import type { PlatformSelectorItem } from '@/types/admin';

import { SelectorForm } from './SelectorForm';

interface SelectorListProps {
  platform: Platform;
}

const CATEGORY_LABELS: Record<SelectorCategory, string> = {
  PRICE: '가격',
  AVAILABILITY: '가용성',
  METADATA: '메타데이터',
  PLATFORM_ID: '플랫폼 ID',
};

const CATEGORY_ORDER: SelectorCategory[] = ['PRICE', 'AVAILABILITY', 'METADATA', 'PLATFORM_ID'];

export function SelectorList({ platform }: SelectorListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingSelector, setEditingSelector] = useState<PlatformSelectorItem | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<SelectorCategory | 'ALL'>('ALL');
  const [showInactive, setShowInactive] = useState(false);

  const { data, isLoading, error } = useSelectors({
    platform,
    category: categoryFilter === 'ALL' ? undefined : categoryFilter,
    includeInactive: showInactive,
  });

  const updateSelector = useUpdateSelector();
  const deleteSelector = useDeleteSelector();

  const handleToggleActive = (selector: PlatformSelectorItem) => {
    updateSelector.mutate({
      id: selector.id,
      payload: { isActive: !selector.isActive },
    });
  };

  const handleDelete = (selector: PlatformSelectorItem) => {
    if (confirm(`"${selector.name}" 셀렉터를 삭제하시겠습니까?`)) {
      deleteSelector.mutate(selector.id);
    }
  };

  const groupedSelectors = data?.selectors.reduce(
    (acc, selector) => {
      if (!acc[selector.category]) acc[selector.category] = [];
      acc[selector.category].push(selector);
      return acc;
    },
    {} as Record<SelectorCategory, PlatformSelectorItem[]>,
  );

  if (isLoading) {
    return <div className='py-8 text-center text-muted-foreground'>로딩 중...</div>;
  }

  if (error) {
    return <div className='py-8 text-center text-destructive'>오류: {error.message}</div>;
  }

  return (
    <div className='space-y-4'>
      {/* Filters */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as SelectorCategory | 'ALL')}
            className='rounded-md border border-input bg-background px-3 py-1.5 text-sm'
          >
            <option value='ALL'>전체 카테고리</option>
            {CATEGORY_ORDER.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
          <label className='flex items-center gap-2 text-sm'>
            <input
              type='checkbox'
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className='rounded border-input'
            />
            비활성 포함
          </label>
        </div>
        <button
          type='button'
          onClick={() => {
            setEditingSelector(null);
            setShowForm(true);
          }}
          className='rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90'
        >
          + 셀렉터 추가
        </button>
      </div>

      {/* Selector Groups */}
      {groupedSelectors &&
        CATEGORY_ORDER.filter((cat) => categoryFilter === 'ALL' || categoryFilter === cat).map((category) => {
          const selectors = groupedSelectors[category];
          if (!selectors?.length) return null;

          return (
            <div key={category} className='rounded-lg border border-border bg-card'>
              <div className='border-b border-border bg-muted/50 px-4 py-2'>
                <h3 className='font-medium'>{CATEGORY_LABELS[category]}</h3>
              </div>
              <div className='divide-y divide-border'>
                {selectors.map((selector) => (
                  <div
                    key={selector.id}
                    className={`flex items-center justify-between px-4 py-3 ${!selector.isActive ? 'opacity-50' : ''}`}
                  >
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center gap-2'>
                        <span className='font-medium'>{selector.name}</span>
                        <span className='rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground'>
                          우선순위: {selector.priority}
                        </span>
                      </div>
                      <code className='mt-1 block truncate text-sm text-muted-foreground'>{selector.selector}</code>
                      {selector.description && (
                        <p className='mt-1 text-sm text-muted-foreground'>{selector.description}</p>
                      )}
                    </div>
                    <div className='ml-4 flex items-center gap-2'>
                      <button
                        type='button'
                        onClick={() => handleToggleActive(selector)}
                        disabled={updateSelector.isPending}
                        className={`rounded px-2 py-1 text-xs font-medium ${
                          selector.isActive
                            ? 'bg-status-success text-status-success-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {selector.isActive ? '활성' : '비활성'}
                      </button>
                      <button
                        type='button'
                        onClick={() => {
                          setEditingSelector(selector);
                          setShowForm(true);
                        }}
                        className='rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground'
                        title='수정'
                      >
                        <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <title>수정</title>
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                          />
                        </svg>
                      </button>
                      <button
                        type='button'
                        onClick={() => handleDelete(selector)}
                        disabled={deleteSelector.isPending}
                        className='rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
                        title='삭제'
                      >
                        <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <title>삭제</title>
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

      {/* Empty State */}
      {(!groupedSelectors || Object.keys(groupedSelectors).length === 0) && (
        <div className='py-8 text-center text-muted-foreground'>
          {categoryFilter === 'ALL'
            ? '등록된 셀렉터가 없습니다.'
            : `${CATEGORY_LABELS[categoryFilter]} 카테고리에 등록된 셀렉터가 없습니다.`}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <SelectorForm
          platform={platform}
          selector={editingSelector}
          onClose={() => {
            setShowForm(false);
            setEditingSelector(null);
          }}
        />
      )}
    </div>
  );
}
