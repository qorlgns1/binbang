'use client';

import { useEffect, useState } from 'react';

import { Activity, Wifi } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useMessages, useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface LogEntry {
  id: number;
  message: string;
  location: string;
  timestamp: number;
}

interface StatusDashboardProps {
  isError?: boolean;
  onRetry?: () => void;
}

export const MOCK_SYSTEM_STATUS = {
  activeMonitors: 3421,
  uptime: '99.99%',
  avgResponseTime: '42ms',
};

/**
 * Convert an absolute timestamp to a short, human-readable relative time string in the given language.
 */
function getRelativeTime(timestamp: number, lang: string): string {
  const now = Date.now();
  const diff = Math.floor((now - timestamp) / 1000); // seconds

  if (lang === 'ko') {
    if (diff < 10) return '방금';
    if (diff < 60) return `${diff}초 전`;
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    return `${Math.floor(diff / 3600)}시간 전`;
  } else {
    if (diff < 10) return 'just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  }
}

/**
 * Render a localized live status dashboard with simulated system metrics and streaming logs.
 */
export function StatusDashboard({ isError, onRetry }: StatusDashboardProps): React.ReactElement {
  const t = useTranslations('landing');
  const messages = useMessages();
  const lang = (useParams().lang as string) ?? 'ko';
  const mockLogs =
    (messages.landing as { mockLogs?: Array<{ id: number; message: string; location: string }> })?.mockLogs ?? [];

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [newestLogId, setNewestLogId] = useState<number | null>(null);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const INITIAL_LOG_COUNT = 6;
    const LOG_AGE_INTERVAL_MS = 15000;
    const NEW_LOG_INTERVAL_MS = 4000;
    const TIME_UPDATE_INTERVAL_MS = 5000;

    const logData = mockLogs;
    if (logData.length === 0) {
      setLogs([]);
      return;
    }
    const now = Date.now();
    const initialLogs = logData.slice(0, INITIAL_LOG_COUNT).map((log, i, arr) => ({
      ...log,
      timestamp: now - (arr.length - i) * LOG_AGE_INTERVAL_MS,
    }));
    setLogs(initialLogs);

    // Force re-render every second to update relative times
    const timeInterval = setInterval(() => forceUpdate((n) => n + 1), TIME_UPDATE_INTERVAL_MS);

    // Add new log every 4 seconds
    let currentIndex = INITIAL_LOG_COUNT;
    const logInterval = setInterval(() => {
      currentIndex = (currentIndex + 1) % logData.length;
      const newTimestamp = Date.now();
      const newLog: LogEntry = {
        ...logData[currentIndex],
        id: newTimestamp,
        timestamp: newTimestamp,
      };

      setNewestLogId(newTimestamp);
      setTimeout(() => setNewestLogId(null), 600);
      setLogs((prev) => [...prev.slice(1), newLog]);
    }, NEW_LOG_INTERVAL_MS);

    return () => {
      clearInterval(timeInterval);
      clearInterval(logInterval);
    };
  }, [mockLogs]);
  if (isError) {
    return (
      <section id='status' className='mx-auto w-full max-w-5xl'>
        <div className='mb-4 flex items-center justify-between'>
          <h3 className='flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary md:text-sm'>
            <Activity className='size-4' />
            {t('trust.title')}
          </h3>
        </div>
        <Card className='border-border bg-card p-8 text-center'>
          <p className='text-base font-semibold text-foreground'>{t('trust.errorMessage')}</p>
          {onRetry && (
            <button
              type='button'
              onClick={onRetry}
              className='mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90'
            >
              {t('trust.retry')}
            </button>
          )}
        </Card>
      </section>
    );
  }

  return (
    <section id='status' className='mx-auto w-full max-w-5xl'>
      <div className='mb-4 flex flex-wrap items-center justify-between gap-2'>
        <h3 className='flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary md:text-sm'>
          <Activity className='size-4 animate-pulse' />
          {t('trust.title')}
        </h3>
        <Badge className='border border-primary/35 bg-primary/10 text-xs text-primary'>
          <span className='mr-2 size-2 rounded-full bg-chart-3 animate-pulse' />
          {t('trust.operational')}
        </Badge>
      </div>

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        <Card className='border-border bg-card/60 p-5 text-foreground sm:col-span-2 lg:col-span-1'>
          <p className='text-xs uppercase tracking-wider text-muted-foreground'>{t('trust.uptime')}</p>
          <p className='mt-1 text-2xl font-semibold'>{MOCK_SYSTEM_STATUS.uptime}</p>

          <p className='mt-5 text-xs uppercase tracking-wider text-muted-foreground'>{t('trust.activeMonitors')}</p>
          <p className='mt-1 text-2xl font-semibold text-primary'>
            {MOCK_SYSTEM_STATUS.activeMonitors.toLocaleString()}
          </p>

          <div className='mt-5 flex items-center gap-2 text-xs text-chart-3'>
            <Wifi className='size-3.5' />
            {t('trust.response')}: {MOCK_SYSTEM_STATUS.avgResponseTime}
          </div>
        </Card>

        <Card className='relative overflow-hidden border-border bg-secondary p-4 font-mono text-xs sm:col-span-2 lg:col-span-2'>
          <div className='absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/70 to-transparent' />
          {logs.length === 0 ? (
            <div className='flex h-44 items-center justify-center'>
              <p className='text-sm text-muted-foreground'>{t('trust.emptyLogs')}</p>
            </div>
          ) : (
            <div
              className='space-y-3 transition-all duration-400'
              style={{ transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
            >
              {logs.map((log, i) => {
                const isNew = log.timestamp === newestLogId;
                const isLatest = i === logs.length - 1;
                return (
                  <div
                    key={log.timestamp}
                    className={`flex gap-3 transition-all duration-400 ${isLatest ? 'text-foreground' : 'text-muted-foreground'}`}
                    style={{
                      transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                      animation: isNew ? 'landing-log-slideup 600ms cubic-bezier(0.22, 1, 0.36, 1)' : undefined,
                    }}
                  >
                    <span className='min-w-14 shrink-0 opacity-70'>{getRelativeTime(log.timestamp, lang)}</span>
                    <span className='text-left min-w-0 flex-1'>
                      <span className='mr-2 text-primary/70'>[{log.location}]</span>
                      <span className='wrap-break-word'>{log.message}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}
