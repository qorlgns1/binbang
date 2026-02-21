'use client';

import type { ReactNode } from 'react';

interface AffiliateNoticeModalProps {
  open: boolean;
  title: string;
  titleId: string;
  description: ReactNode;
  onClose: () => void;
}

export function AffiliateNoticeModal({ open, title, titleId, description, onClose }: AffiliateNoticeModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center'
      role='dialog'
      aria-modal='true'
      aria-labelledby={titleId}
    >
      <button
        type='button'
        className='absolute inset-0 bg-black/40 backdrop-blur-sm'
        onClick={onClose}
        aria-label='모달 닫기'
      />
      <div className='relative z-10 mx-4 max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl'>
        <h3 id={titleId} className='mb-2 text-base font-semibold'>
          {title}
        </h3>
        <p className='text-sm leading-relaxed text-muted-foreground'>{description}</p>
        <button
          type='button'
          onClick={onClose}
          className='mt-4 w-full rounded-lg bg-muted px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80'
        >
          확인
        </button>
      </div>
    </div>
  );
}
