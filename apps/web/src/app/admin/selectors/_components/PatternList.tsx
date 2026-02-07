'use client';

import { useState } from 'react';

import type { PatternType, Platform } from '@/generated/prisma/client';
import { useDeletePattern, usePatterns, useUpdatePattern } from '@/hooks/usePatterns';
import type { PlatformPatternItem } from '@/types/admin';

import { PatternForm } from './PatternForm';

interface PatternListProps {
  platform: Platform;
}

const PATTERN_TYPE_LABELS: Record<PatternType, string> = {
  AVAILABLE: '예약 가능',
  UNAVAILABLE: '예약 불가',
};

export function PatternList({ platform }: PatternListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingPattern, setEditingPattern] = useState<PlatformPatternItem | null>(null);
  const [typeFilter, setTypeFilter] = useState<PatternType | 'ALL'>('ALL');
  const [showInactive, setShowInactive] = useState(false);

  const { data, isLoading, error } = usePatterns({
    platform,
    patternType: typeFilter === 'ALL' ? undefined : typeFilter,
    includeInactive: showInactive,
  });

  const updatePattern = useUpdatePattern();
  const deletePattern = useDeletePattern();

  const handleToggleActive = (pattern: PlatformPatternItem) => {
    updatePattern.mutate({
      id: pattern.id,
      payload: { isActive: !pattern.isActive },
    });
  };

  const handleDelete = (pattern: PlatformPatternItem) => {
    if (confirm(`"${pattern.pattern}" 패턴을 삭제하시겠습니까?`)) {
      deletePattern.mutate(pattern.id);
    }
  };

  const groupedPatterns = data?.patterns.reduce(
    (acc, pattern) => {
      if (!acc[pattern.patternType]) acc[pattern.patternType] = [];
      acc[pattern.patternType].push(pattern);
      return acc;
    },
    {} as Record<PatternType, PlatformPatternItem[]>,
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
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as PatternType | 'ALL')}
            className='rounded-md border border-input bg-background px-3 py-1.5 text-sm'
          >
            <option value='ALL'>전체 타입</option>
            <option value='AVAILABLE'>예약 가능</option>
            <option value='UNAVAILABLE'>예약 불가</option>
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
          onClick={() => {
            setEditingPattern(null);
            setShowForm(true);
          }}
          className='rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90'
        >
          + 패턴 추가
        </button>
      </div>

      {/* Pattern Groups */}
      {groupedPatterns &&
        (['AVAILABLE', 'UNAVAILABLE'] as PatternType[])
          .filter((type) => typeFilter === 'ALL' || typeFilter === type)
          .map((patternType) => {
            const patterns = groupedPatterns[patternType];
            if (!patterns?.length) return null;

            return (
              <div
                key={patternType}
                className='rounded-lg border border-border bg-card'
              >
                <div
                  className={`border-b border-border px-4 py-2 ${
                    patternType === 'AVAILABLE' ? 'bg-status-success' : 'bg-status-error'
                  }`}
                >
                  <h3 className='font-medium'>{PATTERN_TYPE_LABELS[patternType]}</h3>
                </div>
                <div className='divide-y divide-border'>
                  {patterns.map((pattern) => (
                    <div
                      key={pattern.id}
                      className={`flex items-center justify-between px-4 py-3 ${!pattern.isActive ? 'opacity-50' : ''}`}
                    >
                      <div className='min-w-0 flex-1'>
                        <div className='flex items-center gap-2'>
                          <span className='font-medium'>&quot;{pattern.pattern}&quot;</span>
                          <span className='rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground'>
                            {pattern.locale}
                          </span>
                          <span className='rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground'>
                            우선순위: {pattern.priority}
                          </span>
                        </div>
                      </div>
                      <div className='ml-4 flex items-center gap-2'>
                        <button
                          onClick={() => handleToggleActive(pattern)}
                          disabled={updatePattern.isPending}
                          className={`rounded px-2 py-1 text-xs font-medium ${
                            pattern.isActive
                              ? 'bg-status-success text-status-success-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {pattern.isActive ? '활성' : '비활성'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingPattern(pattern);
                            setShowForm(true);
                          }}
                          className='rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground'
                          title='수정'
                        >
                          <svg
                            className='h-4 w-4'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(pattern)}
                          disabled={deletePattern.isPending}
                          className='rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
                          title='삭제'
                        >
                          <svg
                            className='h-4 w-4'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
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
      {(!groupedPatterns || Object.keys(groupedPatterns).length === 0) && (
        <div className='py-8 text-center text-muted-foreground'>
          {typeFilter === 'ALL' ? '등록된 패턴이 없습니다.' : `${PATTERN_TYPE_LABELS[typeFilter]} 패턴이 없습니다.`}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <PatternForm
          platform={platform}
          pattern={editingPattern}
          onClose={() => {
            setShowForm(false);
            setEditingPattern(null);
          }}
        />
      )}
    </div>
  );
}
