import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

type BrandMarkSize = 'sm' | 'md';
type BrandMarkDotSize = 'sm' | 'md';
type BrandMarkVariant = 'default' | 'sidebar';

interface BrandMarkProps extends Omit<ComponentProps<'span'>, 'children'> {
  size?: BrandMarkSize;
  dotSize?: BrandMarkDotSize;
  variant?: BrandMarkVariant;
  animated?: boolean;
}

const outerSizeClass: Record<BrandMarkSize, string> = {
  sm: 'size-8',
  md: 'size-9',
};

const dotSizeClass: Record<BrandMarkDotSize, string> = {
  sm: 'size-1.5',
  md: 'size-2',
};

const variantClass: Record<BrandMarkVariant, { outer: string; dot: string }> = {
  default: {
    outer: 'bg-primary',
    dot: 'bg-primary-foreground',
  },
  sidebar: {
    outer: 'bg-sidebar-primary',
    dot: 'bg-sidebar-primary-foreground',
  },
};

export function BrandMark({
  size = 'md',
  dotSize = 'md',
  variant = 'default',
  animated = true,
  className,
  ...props
}: BrandMarkProps): React.ReactElement {
  const colors = variantClass[variant];

  return (
    <span
      className={cn('relative inline-flex shrink-0', outerSizeClass[size], className)}
      aria-hidden='true'
      {...props}
    >
      <span className={cn('relative flex size-full items-center justify-center rounded-full', colors.outer)}>
        {animated ? (
          <span
            className={cn(
              'pointer-events-none absolute inset-0 rounded-full opacity-25 motion-safe:animate-ping',
              colors.outer,
            )}
          />
        ) : null}
        <span className={cn('relative z-10 rounded-full', dotSizeClass[dotSize], colors.dot)} />
      </span>
    </span>
  );
}
