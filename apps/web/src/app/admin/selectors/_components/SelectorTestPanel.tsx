'use client';

import { useState } from 'react';

import type { Platform } from '@/generated/prisma/client';
import { useSelectorTest } from '@/hooks/useSelectorTest';
import { useTestableAttributes, useUpdateTestableAttributes } from '@/hooks/useTestableAttributes';

export function SelectorTestPanel() {
  const [url, setUrl] = useState('');
  const [checkIn, setCheckIn] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  });
  const [checkOut, setCheckOut] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 8);
    return date.toISOString().split('T')[0];
  });
  const [adults, setAdults] = useState(2);
  const [showSettings, setShowSettings] = useState(false);
  const [attributesText, setAttributesText] = useState('');

  // Testable attributes 설정
  const { data: testableAttributes, isLoading: isLoadingAttrs } = useTestableAttributes();
  const updateAttributes = useUpdateTestableAttributes();

  const detectPlatform = (testUrl: string): Platform | null => {
    if (testUrl.includes('airbnb')) return 'AIRBNB';
    if (testUrl.includes('agoda')) return 'AGODA';
    return null;
  };

  const detectedPlatform = detectPlatform(url);
  const input = url && detectedPlatform ? { url, checkIn, checkOut, adults } : null;

  const { runTest, isPending, data: result } = useSelectorTest(input);

  const handleOpenSettings = () => {
    setAttributesText(testableAttributes?.join('\n') ?? '');
    setShowSettings(true);
  };

  const handleSaveSettings = () => {
    const attrs = attributesText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    updateAttributes.mutate(attrs, {
      onSuccess: () => setShowSettings(false),
    });
  };

  return (
    <div className='space-y-6'>
      {/* Settings Panel */}
      <div className='rounded-lg border border-border bg-card p-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-lg font-semibold'>추출 대상 속성</h2>
            <p className='text-sm text-muted-foreground'>
              {isLoadingAttrs ? '로딩 중...' : `${testableAttributes?.length ?? 0}개 속성 설정됨`}
            </p>
          </div>
          <button
            type='button'
            onClick={handleOpenSettings}
            className='rounded-md bg-muted px-3 py-1.5 text-sm font-medium hover:bg-muted/80'
          >
            {showSettings ? '닫기' : '설정'}
          </button>
        </div>

        {showSettings && (
          <div className='mt-4 space-y-3'>
            <p className='text-xs text-muted-foreground'>
              테스트 시 추출할 HTML 속성명을 한 줄에 하나씩 입력하세요.
              <br />
              예: data-testid, data-selenium, aria-label 등
            </p>
            <textarea
              value={attributesText}
              onChange={(e) => setAttributesText(e.target.value)}
              rows={5}
              className='w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm'
              placeholder='data-testid&#10;data-test-id&#10;data-selenium'
            />
            <div className='flex gap-2'>
              <button
                type='button'
                onClick={handleSaveSettings}
                disabled={updateAttributes.isPending}
                className='rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50'
              >
                {updateAttributes.isPending ? '저장 중...' : '저장'}
              </button>
              <button
                type='button'
                onClick={() => setShowSettings(false)}
                className='rounded-md bg-muted px-4 py-2 text-sm font-medium hover:bg-muted/80'
              >
                취소
              </button>
            </div>
          </div>
        )}

        {!showSettings && testableAttributes && testableAttributes.length > 0 && (
          <div className='mt-3 flex flex-wrap gap-2'>
            {testableAttributes.map((attr) => (
              <code key={attr} className='rounded bg-muted px-2 py-0.5 text-xs'>
                {attr}
              </code>
            ))}
          </div>
        )}
      </div>

      <div className='rounded-lg border border-border bg-card p-6'>
        <h2 className='mb-4 text-lg font-semibold'>셀렉터 테스트</h2>

        <div className='space-y-4'>
          {/* URL Input */}
          <div>
            <label htmlFor='selector-test-url' className='mb-1 block text-sm font-medium'>
              URL
            </label>
            <div className='flex gap-2'>
              <input
                id='selector-test-url'
                type='url'
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder='https://www.airbnb.co.kr/rooms/123456...'
                className='flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm'
              />
              {detectedPlatform && (
                <span className='flex items-center rounded bg-primary/10 px-3 text-sm font-medium text-primary'>
                  {detectedPlatform}
                </span>
              )}
            </div>
          </div>

          {/* Date Inputs */}
          <div className='grid grid-cols-3 gap-4'>
            <div>
              <label htmlFor='selector-test-checkin' className='mb-1 block text-sm font-medium'>
                체크인
              </label>
              <input
                id='selector-test-checkin'
                type='date'
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
              />
            </div>
            <div>
              <label htmlFor='selector-test-checkout' className='mb-1 block text-sm font-medium'>
                체크아웃
              </label>
              <input
                id='selector-test-checkout'
                type='date'
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
              />
            </div>
            <div>
              <label htmlFor='selector-test-adults' className='mb-1 block text-sm font-medium'>
                인원
              </label>
              <input
                id='selector-test-adults'
                type='number'
                value={adults}
                onChange={(e) => setAdults(parseInt(e.target.value, 10) || 1)}
                min={1}
                max={16}
                className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
              />
            </div>
          </div>

          {/* Test Button */}
          <button
            type='button'
            onClick={runTest}
            disabled={isPending || !input}
            className='rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50'
          >
            {isPending ? '테스트 중...' : '테스트 실행'}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className='rounded-lg border border-border bg-card p-6'>
          <div className='mb-4 flex items-center justify-between'>
            <h3 className='text-lg font-semibold'>테스트 결과</h3>
            <span className='text-sm text-muted-foreground'>{result.durationMs}ms</span>
          </div>

          {result.error ? (
            <div className='rounded bg-destructive/10 p-4 text-destructive'>{result.error}</div>
          ) : (
            <div className='space-y-4'>
              {/* Status */}
              <div className='flex items-center gap-4'>
                <div
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    result.result?.available
                      ? 'bg-status-success text-status-success-foreground'
                      : 'bg-status-error text-status-error-foreground'
                  }`}
                >
                  {result.result?.available ? '예약 가능' : '예약 불가'}
                </div>
                {result.result?.price && <span className='text-lg font-bold'>{result.result.price}</span>}
              </div>

              {/* Reason */}
              {result.result?.reason && (
                <div className='text-sm text-muted-foreground'>
                  <span className='font-medium'>사유:</span> {result.result.reason}
                </div>
              )}

              {/* Matched Selectors */}
              {result.matchedSelectors && result.matchedSelectors.length > 0 && (
                <div>
                  <h4 className='mb-2 text-sm font-medium'>매칭된 셀렉터</h4>
                  <div className='space-y-1'>
                    {result.matchedSelectors.map((sel) => (
                      <div
                        key={`${sel.category}-${sel.name}-${sel.matched ? 'matched' : 'not-matched'}`}
                        className='flex items-center gap-2 text-sm'
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${sel.matched ? 'bg-status-success-foreground' : 'bg-muted'}`}
                        />
                        <span className='text-muted-foreground'>{sel.category}:</span>
                        <span>{sel.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched Patterns */}
              {result.matchedPatterns && result.matchedPatterns.length > 0 && (
                <div>
                  <h4 className='mb-2 text-sm font-medium'>매칭된 패턴</h4>
                  <div className='space-y-1'>
                    {result.matchedPatterns.map((pat) => (
                      <div
                        key={`${pat.type}-${pat.pattern}-${pat.matched ? 'matched' : 'not-matched'}`}
                        className='flex items-center gap-2 text-sm'
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${pat.matched ? 'bg-status-success-foreground' : 'bg-muted'}`}
                        />
                        <span className='text-muted-foreground'>{pat.type}:</span>
                        <span>&quot;{pat.pattern}&quot;</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              {result.result?.metadata && Object.keys(result.result.metadata).length > 0 && (
                <div>
                  <h4 className='mb-2 text-sm font-medium'>메타데이터</h4>
                  <pre className='overflow-auto rounded bg-muted p-3 text-xs'>
                    {JSON.stringify(result.result.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {/* Testable Elements */}
              {result.testableElements && result.testableElements.length > 0 && (
                <div>
                  <h4 className='mb-2 text-sm font-medium'>테스트 가능 요소 ({result.testableElements.length}개)</h4>
                  <p className='mb-3 text-xs text-muted-foreground'>
                    data-testid, data-selenium 등 개발자가 테스트용으로 추가한 속성이 있는 요소들입니다. 셀렉터로
                    활용하면 UI 변경에 강건합니다.
                  </p>
                  <div className='max-h-[500px] space-y-3 overflow-auto'>
                    {result.testableElements.map((el) => (
                      <div
                        key={`${el.attribute}-${el.value}-${el.tagName}-${el.html.slice(0, 32)}`}
                        className='rounded border border-border bg-muted/50 p-3'
                      >
                        <div className='mb-2 flex flex-wrap items-center gap-2'>
                          <code className='rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary'>
                            [{el.attribute}=&quot;{el.value}&quot;]
                          </code>
                          <span className='text-xs text-muted-foreground'>&lt;{el.tagName}&gt;</span>
                        </div>
                        {el.text && (
                          <p className='mb-2 text-xs text-muted-foreground'>
                            <span className='font-medium'>텍스트:</span> {el.text.slice(0, 200)}
                            {el.text.length > 200 && '...'}
                          </p>
                        )}
                        <details className='text-xs'>
                          <summary className='cursor-pointer font-medium text-muted-foreground hover:text-foreground'>
                            HTML 보기
                          </summary>
                          <pre className='mt-2 max-h-[300px] overflow-auto whitespace-pre-wrap rounded bg-muted p-2'>
                            {el.html}
                          </pre>
                        </details>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
