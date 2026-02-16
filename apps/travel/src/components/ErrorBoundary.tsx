'use client';

import { AlertTriangle } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError && this.props.fallback) {
      return this.props.fallback;
    }

    if (this.state.hasError) {
      return (
        <div className='flex min-h-[200px] flex-col items-center justify-center gap-4 px-4 py-8'>
          <div className='flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10'>
            <AlertTriangle className='h-7 w-7 text-destructive' aria-hidden />
          </div>
          <p className='text-center font-medium text-foreground'>문제가 발생했어요</p>
          <p className='text-center text-sm text-muted-foreground'>잠시 후 다시 시도해 주세요.</p>
          <button
            type='button'
            onClick={() => this.setState({ hasError: false })}
            className='rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors'
          >
            다시 시도
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
