'use client';

/**
 * 등대 빛 회전 로딩 애니메이션
 * 브랜드 정체성(등대 컨셉)을 강화하는 커스텀 스피너
 */
export function LighthouseSpinner({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    // biome-ignore lint/a11y/useSemanticElements: status role is appropriate for loading spinner
    <div className={`relative ${sizeClasses[size]} ${className ?? ''}`} role='status' aria-label='로딩 중'>
      {/* 등대 본체 */}
      <div className='absolute inset-0 flex items-center justify-center'>
        <div className='h-full w-1/3 bg-primary rounded-t-lg' />
      </div>

      {/* 회전하는 등대 빛 */}
      <div className='absolute inset-0 animate-lighthouse-beam'>
        <div className='absolute top-0 left-1/2 h-1/2 w-[200%] origin-bottom -translate-x-1/2'>
          <div
            className='h-full w-full'
            style={{
              background:
                'linear-gradient(to right, transparent 0%, var(--brand-amber) 45%, var(--brand-gold) 50%, var(--brand-amber) 55%, transparent 100%)',
              opacity: 0.6,
              filter: 'blur(4px)',
            }}
          />
        </div>
      </div>

      {/* 등대 꼭대기 빛 */}
      <div className='absolute top-0 left-1/2 -translate-x-1/2 h-1 w-1 bg-brand-gold rounded-full animate-pulse' />
    </div>
  );
}
