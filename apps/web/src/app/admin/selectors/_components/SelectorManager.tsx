'use client';

import { useState } from 'react';

import type { Platform } from '@/generated/prisma/client';
import { useInvalidateSelectorCache } from '@/hooks/useSelectors';

import { PatternList } from './PatternList';
import { SelectorHistory } from './SelectorHistory';
import { SelectorList } from './SelectorList';
import { SelectorTestPanel } from './SelectorTestPanel';

type TabType = 'selectors' | 'patterns' | 'history' | 'test';

const PLATFORMS: Platform[] = ['AIRBNB', 'AGODA'];

export function SelectorManager() {
  const [platform, setPlatform] = useState<Platform>('AIRBNB');
  const [tab, setTab] = useState<TabType>('selectors');

  const invalidateCache = useInvalidateSelectorCache();

  const handleInvalidateCache = () => {
    invalidateCache.mutate(platform, {
      onSuccess: (data) => {
        const apiMsg = `API 서버: ${data.invalidatedPlatforms.join(', ') || platform}`;
        const workerMsg = data.workerCacheInvalidated
          ? `워커: ${data.workerResult?.reloaded.join(', ') || '갱신됨'}`
          : '워커: 연결 안됨 (워커 실행 필요)';
        alert(`캐시 무효화 완료\n${apiMsg}\n${workerMsg}`);
      },
      onError: (error) => {
        alert(`캐시 무효화 실패: ${error.message}`);
      },
    });
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>셀렉터 관리</h1>
          <p className='text-muted-foreground'>플랫폼별 CSS 셀렉터와 텍스트 패턴을 관리합니다.</p>
        </div>
        <button
          onClick={handleInvalidateCache}
          disabled={invalidateCache.isPending}
          className='rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50'
        >
          {invalidateCache.isPending ? '처리 중...' : '캐시 무효화'}
        </button>
      </div>

      {/* Platform Tabs */}
      <div className='border-b border-border'>
        <div className='flex gap-4'>
          {PLATFORMS.map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                platform === p
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Content Tabs */}
      <div className='flex gap-2'>
        <button
          onClick={() => setTab('selectors')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === 'selectors'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          셀렉터
        </button>
        <button
          onClick={() => setTab('patterns')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === 'patterns'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          패턴
        </button>
        <button
          onClick={() => setTab('history')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === 'history'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          변경 이력
        </button>
        <button
          onClick={() => setTab('test')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === 'test' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          테스트
        </button>
      </div>

      {/* Content */}
      {tab === 'selectors' && <SelectorList platform={platform} />}
      {tab === 'patterns' && <PatternList platform={platform} />}
      {tab === 'history' && <SelectorHistory />}
      {tab === 'test' && <SelectorTestPanel />}
    </div>
  );
}
