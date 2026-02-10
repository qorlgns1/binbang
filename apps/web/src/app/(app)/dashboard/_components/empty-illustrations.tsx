interface IllustrationProps {
  className?: string;
}

/**
 * 메인 빈 상태용 등대 일러스트 (숙소 0건)
 * 앰버 불빛이 비치는 등대 + 파도 — "첫 숙소를 등록하세요"
 */
export function LighthouseHero({ className }: IllustrationProps): React.ReactElement {
  return (
    <svg
      className={className}
      width='128'
      height='108'
      viewBox='0 0 128 108'
      fill='none'
      aria-hidden='true'
    >
      {/* Light beams */}
      <path
        d='M64 30 L30 6 L40 18Z'
        fill='var(--primary)'
        opacity='0.15'
      />
      <path
        d='M64 30 L98 6 L88 18Z'
        fill='var(--primary)'
        opacity='0.15'
      />
      <path
        d='M64 30 L22 16 L36 22Z'
        fill='var(--primary)'
        opacity='0.08'
      />
      <path
        d='M64 30 L106 16 L92 22Z'
        fill='var(--primary)'
        opacity='0.08'
      />

      {/* Lighthouse body */}
      <path
        d='M57 88 L59 34 L69 34 L71 88Z'
        fill='currentColor'
        opacity='0.12'
      />

      {/* Stripes */}
      <rect
        x='58.5'
        y='48'
        width='11'
        height='5'
        rx='0.5'
        fill='var(--primary)'
        opacity='0.3'
      />
      <rect
        x='58'
        y='63'
        width='12'
        height='5'
        rx='0.5'
        fill='var(--primary)'
        opacity='0.3'
      />
      <rect
        x='57.5'
        y='78'
        width='13'
        height='5'
        rx='0.5'
        fill='var(--primary)'
        opacity='0.3'
      />

      {/* Light room */}
      <rect
        x='58'
        y='27'
        width='12'
        height='8'
        rx='1.5'
        fill='currentColor'
        opacity='0.15'
      />

      {/* Glow */}
      <circle
        cx='64'
        cy='31'
        r='7'
        fill='var(--primary)'
        opacity='0.12'
      />
      <circle
        cx='64'
        cy='31'
        r='3'
        fill='var(--primary)'
        opacity='0.8'
      />

      {/* Roof */}
      <path
        d='M58 27 L64 19 L70 27Z'
        fill='currentColor'
        opacity='0.15'
      />
      <circle
        cx='64'
        cy='18'
        r='1.5'
        fill='currentColor'
        opacity='0.15'
      />

      {/* Base */}
      <ellipse
        cx='64'
        cy='89'
        rx='22'
        ry='5'
        fill='currentColor'
        opacity='0.06'
      />

      {/* Waves */}
      <path
        d='M14 96 Q30 92 46 96 Q62 100 78 96 Q94 92 110 96'
        stroke='currentColor'
        opacity='0.1'
        strokeWidth='1.5'
        fill='none'
        strokeLinecap='round'
      />
      <path
        d='M20 102 Q36 99 52 102 Q68 105 84 102 Q100 99 116 102'
        stroke='currentColor'
        opacity='0.06'
        strokeWidth='1.5'
        fill='none'
        strokeLinecap='round'
      />
    </svg>
  );
}

/**
 * 안정 상태용 등대 일러스트 (Action Center 0건)
 * 고요한 바다 위 등대 + 체크 — "모두 안정적입니다"
 */
export function LighthouseCalm({ className }: IllustrationProps): React.ReactElement {
  return (
    <svg
      className={className}
      width='80'
      height='72'
      viewBox='0 0 80 72'
      fill='none'
      aria-hidden='true'
    >
      {/* Gentle glow */}
      <circle
        cx='40'
        cy='18'
        r='10'
        fill='var(--chart-3)'
        opacity='0.08'
      />

      {/* Lighthouse body */}
      <path
        d='M36 58 L37.5 22 L42.5 22 L44 58Z'
        fill='currentColor'
        opacity='0.12'
      />

      {/* Stripes */}
      <rect
        x='37'
        y='32'
        width='6'
        height='3'
        rx='0.5'
        fill='var(--chart-3)'
        opacity='0.25'
      />
      <rect
        x='36.8'
        y='42'
        width='6.4'
        height='3'
        rx='0.5'
        fill='var(--chart-3)'
        opacity='0.25'
      />
      <rect
        x='36.5'
        y='52'
        width='7'
        height='3'
        rx='0.5'
        fill='var(--chart-3)'
        opacity='0.25'
      />

      {/* Light room */}
      <rect
        x='37'
        y='17'
        width='6'
        height='5.5'
        rx='1'
        fill='currentColor'
        opacity='0.12'
      />
      <circle
        cx='40'
        cy='20'
        r='2'
        fill='var(--chart-3)'
        opacity='0.7'
      />

      {/* Roof */}
      <path
        d='M37 17 L40 12 L43 17Z'
        fill='currentColor'
        opacity='0.12'
      />

      {/* Check mark */}
      <circle
        cx='54'
        cy='22'
        r='7'
        fill='var(--chart-3)'
        opacity='0.12'
      />
      <path
        d='M50.5 22 L53 24.5 L57.5 19.5'
        stroke='var(--chart-3)'
        strokeWidth='1.8'
        strokeLinecap='round'
        strokeLinejoin='round'
        fill='none'
        opacity='0.7'
      />

      {/* Base */}
      <ellipse
        cx='40'
        cy='59'
        rx='14'
        ry='3'
        fill='currentColor'
        opacity='0.06'
      />

      {/* Waves */}
      <path
        d='M10 64 Q22 61 34 64 Q46 67 58 64 Q70 61 80 64'
        stroke='currentColor'
        opacity='0.08'
        strokeWidth='1'
        fill='none'
        strokeLinecap='round'
      />
    </svg>
  );
}

/**
 * 소형 빈 상태용 등대 일러스트 (보드 탭, 이벤트)
 * 미니멀 등대 실루엣
 */
export function LighthouseQuiet({ className }: IllustrationProps): React.ReactElement {
  return (
    <svg
      className={className}
      width='48'
      height='48'
      viewBox='0 0 48 48'
      fill='none'
      aria-hidden='true'
    >
      {/* Lighthouse body */}
      <path
        d='M21 40 L22 15 L26 15 L27 40Z'
        fill='currentColor'
        opacity='0.1'
      />

      {/* Stripes */}
      <rect
        x='22'
        y='22'
        width='4'
        height='2.5'
        rx='0.5'
        fill='currentColor'
        opacity='0.08'
      />
      <rect
        x='21.8'
        y='30'
        width='4.4'
        height='2.5'
        rx='0.5'
        fill='currentColor'
        opacity='0.08'
      />

      {/* Light room */}
      <rect
        x='22'
        y='11'
        width='4'
        height='4'
        rx='0.8'
        fill='currentColor'
        opacity='0.1'
      />

      {/* Tiny glow */}
      <circle
        cx='24'
        cy='13'
        r='1.5'
        fill='var(--primary)'
        opacity='0.4'
      />

      {/* Roof */}
      <path
        d='M22 11 L24 7.5 L26 11Z'
        fill='currentColor'
        opacity='0.1'
      />

      {/* Wave */}
      <path
        d='M8 43 Q16 41 24 43 Q32 45 40 43'
        stroke='currentColor'
        opacity='0.08'
        strokeWidth='1'
        fill='none'
        strokeLinecap='round'
      />
    </svg>
  );
}
