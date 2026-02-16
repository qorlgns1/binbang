'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useUpdateSystemSettings } from '@/hooks/useUpdateSystemSettings';
import { useWorkerControl } from '@/hooks/useWorkerControl';
import type { SystemSettingItem } from '@/types/admin';

import { SettingsHistory } from './SettingsHistory';

type TimeUnit = 'ms' | 's' | 'min';

const MINUTES_ONLY_CRON_SETTING_KEY = 'worker.cronSchedule';
const PUBLIC_SNAPSHOT_CRON_SETTING_KEY = 'worker.publicAvailabilitySnapshotSchedule';
const CRON_TEXT_SETTING_KEYS = new Set([MINUTES_ONLY_CRON_SETTING_KEY, 'worker.publicAvailabilitySnapshotSchedule']);
const WORKER_RESTART_REQUIRED_KEYS = new Set([
  'worker.cronSchedule',
  'worker.publicAvailabilitySnapshotSchedule',
  'worker.publicAvailabilitySnapshotWindowDays',
  'worker.concurrency',
  'worker.browserPoolSize',
  'worker.startupDelayMs',
  'worker.shutdownTimeoutMs',
]);

const PUBLIC_SNAPSHOT_CRON_PRESETS = [
  { label: '매일 01:07 UTC (10:07 KST)', value: '7 1 * * *' },
  { label: '매일 00:00 UTC (09:00 KST)', value: '0 0 * * *' },
  { label: '6시간마다', value: '0 */6 * * *' },
] as const;

function msToDisplay(ms: number, unit: TimeUnit): number {
  if (unit === 'min') return ms / 60000;
  if (unit === 's') return ms / 1000;
  return ms;
}

function displayToMs(value: number, unit: TimeUnit): number {
  if (unit === 'min') return value * 60000;
  if (unit === 's') return value * 1000;
  return value;
}

// cron 표현식에서 분 주기를 추출 (e.g. "*/30 * * * *" -> 30)
function cronToMinutes(expression: string): number | null {
  const match = expression.trim().match(/^\*\/(\d+)\s+\*\s+\*\s+\*\s+\*$/);
  return match ? Number(match[1]) : null;
}

// 분 주기를 cron 표현식으로 변환 (e.g. 30 -> "*/30 * * * *")
function minutesToCron(minutes: number): string {
  return `*/${minutes} * * * *`;
}

function isMsSetting(key: string): boolean {
  return key.endsWith('Ms');
}

function requiresWorkerRestart(key: string): boolean {
  return WORKER_RESTART_REQUIRED_KEYS.has(key);
}

function parseCronNumber(field: string, min: number, max: number): number | null {
  if (!/^\d+$/.test(field)) return null;
  const value = Number(field);
  if (!Number.isInteger(value) || value < min || value > max) return null;
  return value;
}

function toTwoDigits(value: number): string {
  return String(value).padStart(2, '0');
}

function formatClock(hour: number, minute: number): string {
  return `${toTwoDigits(hour)}:${toTwoDigits(minute)}`;
}

function toKstClock(hour: number, minute: number): string {
  const totalMinutes = hour * 60 + minute + 9 * 60;
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const kstHour = Math.floor(normalized / 60);
  const kstMinute = normalized % 60;
  return formatClock(kstHour, kstMinute);
}

function describeCronExpression(expression: string): string {
  const trimmed = expression.trim();
  const fields = trimmed.split(/\s+/);
  if (fields.length !== 5) {
    return '형식: 분 시 일 월 요일 (예: 7 1 * * *)';
  }

  const [minuteField, hourField, dayOfMonth, month, dayOfWeek] = fields;

  const stepMatch = minuteField.match(/^\*\/(\d+)$/);
  if (stepMatch && hourField === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return `매 ${stepMatch[1]}분마다 실행`;
  }

  const minute = parseCronNumber(minuteField, 0, 59);
  const hour = parseCronNumber(hourField, 0, 23);

  if (minute !== null && hour !== null && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return `매일 ${formatClock(hour, minute)} UTC (${toKstClock(hour, minute)} KST) 실행`;
  }

  const dayOfWeekNumber = parseCronNumber(dayOfWeek, 0, 7);
  if (minute !== null && hour !== null && dayOfMonth === '*' && month === '*' && dayOfWeekNumber !== null) {
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'] as const;
    const normalizedDay = dayOfWeekNumber === 7 ? 0 : dayOfWeekNumber;
    return `매주 ${dayNames[normalizedDay]}요일 ${formatClock(hour, minute)} UTC (${toKstClock(hour, minute)} KST) 실행`;
  }

  return `사용자 정의 cron: ${trimmed}`;
}

function computeUnits(
  originalValues: Record<string, string>,
  minVals: Record<string, string>,
  maxVals: Record<string, string>,
): Record<string, TimeUnit> {
  const units: Record<string, TimeUnit> = {};
  for (const [key, val] of Object.entries(originalValues)) {
    if (isMsSetting(key)) {
      const allNums = [val, minVals[key], maxVals[key]]
        .filter((v): v is string => v !== undefined && v !== '')
        .map(Number)
        .filter((n) => !Number.isNaN(n) && n > 0);

      if (allNums.length === 0) {
        units[key] = 'ms';
      } else if (allNums.every((n) => n % 60000 === 0)) {
        units[key] = 'min';
      } else if (allNums.every((n) => n % 1000 === 0)) {
        units[key] = 's';
      } else {
        units[key] = 'ms';
      }
    }
  }
  return units;
}

const CATEGORY_LABELS: Record<string, string> = {
  worker: '워커 스케줄',
  browser: '브라우저 타임아웃',
  checker: '체크 동작',
  monitoring: '모니터링 임계값',
  notification: '알림',
  heartbeat: '하트비트 모니터링',
};

const CATEGORY_ORDER = ['worker', 'browser', 'checker', 'monitoring', 'notification', 'heartbeat'];
const LOADING_SKELETON_KEYS = ['settings-loading-1', 'settings-loading-2', 'settings-loading-3'];

export function SettingsManager() {
  const { data, isLoading, isError } = useSystemSettings();
  const mutation = useUpdateSystemSettings();
  const { restartWorker, isRestarting } = useWorkerControl();

  const [values, setValues] = useState<Record<string, string>>({});
  const [units, setUnits] = useState<Record<string, TimeUnit>>({});
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [manualSnapshotFeedback, setManualSnapshotFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isManualSnapshotRunning, setIsManualSnapshotRunning] = useState(false);

  // MIN/MAX 상태
  const [minValues, setMinValues] = useState<Record<string, string>>({});
  const [maxValues, setMaxValues] = useState<Record<string, string>>({});
  const [limitEditKeys, setLimitEditKeys] = useState<Set<string>>(new Set());

  // 서버 원본 값 (data에서 직접 파생)
  const originalValues = useMemo(() => {
    if (!data?.settings) return {};
    const map: Record<string, string> = {};
    for (const s of data.settings) {
      map[s.key] = s.value;
    }
    return map;
  }, [data]);

  const originalMinValues = useMemo(() => {
    if (!data?.settings) return {};
    const map: Record<string, string> = {};
    for (const s of data.settings) {
      if (s.minValue !== null) map[s.key] = s.minValue;
    }
    return map;
  }, [data]);

  const originalMaxValues = useMemo(() => {
    if (!data?.settings) return {};
    const map: Record<string, string> = {};
    for (const s of data.settings) {
      if (s.maxValue !== null) map[s.key] = s.maxValue;
    }
    return map;
  }, [data]);

  // 서버 데이터 변경 시 편집 상태 동기화
  useEffect(() => {
    setValues(originalValues);
    setUnits(computeUnits(originalValues, originalMinValues, originalMaxValues));
    setMinValues({ ...originalMinValues });
    setMaxValues({ ...originalMaxValues });
    setLimitEditKeys(new Set());
  }, [originalValues, originalMinValues, originalMaxValues]);

  const settingsByCategory = useMemo(() => {
    if (!data?.settings) return new Map<string, SystemSettingItem[]>();
    const map = new Map<string, SystemSettingItem[]>();
    for (const s of data.settings) {
      const list = map.get(s.category) ?? [];
      list.push(s);
      map.set(s.category, list);
    }
    return map;
  }, [data]);

  // 변경된 키 추적 (value, min, max 중 하나라도 변경)
  const changedKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const [key, val] of Object.entries(values)) {
      if (originalValues[key] !== val) {
        keys.add(key);
      }
    }
    for (const [key, val] of Object.entries(minValues)) {
      if (originalMinValues[key] !== val) {
        keys.add(key);
      }
    }
    for (const [key, val] of Object.entries(maxValues)) {
      if (originalMaxValues[key] !== val) {
        keys.add(key);
      }
    }
    return keys;
  }, [values, originalValues, minValues, originalMinValues, maxValues, originalMaxValues]);

  // 범위 밖 검증
  const outOfRangeKeys = useMemo(() => {
    const keys = new Set<string>();
    if (!data?.settings) return keys;
    for (const s of data.settings) {
      if (s.type !== 'int') continue;
      const val = Number(values[s.key]);
      if (Number.isNaN(val)) continue;

      const min = minValues[s.key] !== undefined ? Number(minValues[s.key]) : null;
      const max = maxValues[s.key] !== undefined ? Number(maxValues[s.key]) : null;

      if (min !== null && !Number.isNaN(min) && val < min) keys.add(s.key);
      if (max !== null && !Number.isNaN(max) && val > max) keys.add(s.key);
    }
    return keys;
  }, [data, values, minValues, maxValues]);

  // min > max 검증
  const invalidLimitKeys = useMemo(() => {
    const keys = new Set<string>();
    if (!data?.settings) return keys;
    for (const s of data.settings) {
      if (s.type !== 'int') continue;
      const min = minValues[s.key] !== undefined ? Number(minValues[s.key]) : null;
      const max = maxValues[s.key] !== undefined ? Number(maxValues[s.key]) : null;
      if (min !== null && max !== null && !Number.isNaN(min) && !Number.isNaN(max) && min > max) {
        keys.add(s.key);
      }
    }
    return keys;
  }, [data, minValues, maxValues]);

  const hasChanges = changedKeys.size > 0;
  const hasValidationErrors = outOfRangeKeys.size > 0 || invalidLimitKeys.size > 0;

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleMinChange = (key: string, value: string) => {
    setMinValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleMaxChange = (key: string, value: string) => {
    setMaxValues((prev) => ({ ...prev, [key]: value }));
  };

  const toggleLimitEdit = (key: string) => {
    setLimitEditKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        // 편집 취소 시 원본 복원
        setMinValues((p) => ({ ...p, [key]: originalMinValues[key] ?? '' }));
        setMaxValues((p) => ({ ...p, [key]: originalMaxValues[key] ?? '' }));
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleReset = () => {
    setValues({ ...originalValues });
    setUnits(computeUnits(originalValues, originalMinValues, originalMaxValues));
    setMinValues({ ...originalMinValues });
    setMaxValues({ ...originalMaxValues });
    setLimitEditKeys(new Set());
    setFeedback(null);
  };

  const handleManualSnapshotRun = useCallback(async () => {
    if (isManualSnapshotRunning) return;

    setManualSnapshotFeedback(null);
    setIsManualSnapshotRunning(true);

    try {
      const rawWindowDays = values['worker.publicAvailabilitySnapshotWindowDays'];
      const parsedWindowDays = Number.parseInt(rawWindowDays ?? '', 10);
      const windowDays = Number.isInteger(parsedWindowDays) && parsedWindowDays > 0 ? parsedWindowDays : undefined;

      const response = await fetch('/api/admin/worker/public-availability/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(windowDays ? { windowDays } : {}),
      });

      const payload = (await response.json().catch((): null => null)) as {
        error?: string;
        message?: string;
        jobId?: string | number;
      } | null;

      if (!response.ok) {
        throw new Error(payload?.error || '공개 가용성 스냅샷 즉시 실행에 실패했습니다.');
      }

      const message = payload?.message || '공개 가용성 스냅샷 작업이 큐에 등록되었습니다.';
      const jobSuffix = payload?.jobId !== undefined ? ` (job: ${String(payload.jobId)})` : '';
      setManualSnapshotFeedback({ type: 'success', message: `${message}${jobSuffix}` });
    } catch (error) {
      setManualSnapshotFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : '공개 가용성 스냅샷 즉시 실행에 실패했습니다.',
      });
    } finally {
      setIsManualSnapshotRunning(false);
    }
  }, [isManualSnapshotRunning, values]);

  const isBusy = mutation.isPending || isRestarting;

  const handleSave = async () => {
    if (!hasChanges || hasValidationErrors) return;
    setFeedback(null);

    const updates = Array.from(changedKeys).map((key) => {
      const update: { key: string; value: string; minValue?: string; maxValue?: string } = {
        key,
        value: values[key],
      };
      if (minValues[key] !== originalMinValues[key]) {
        update.minValue = minValues[key];
      }
      if (maxValues[key] !== originalMaxValues[key]) {
        update.maxValue = maxValues[key];
      }
      return update;
    });

    const restartRequired = updates.some((update): boolean => requiresWorkerRestart(update.key));

    try {
      await mutation.mutateAsync({ settings: updates });
      setLimitEditKeys(new Set());

      if (!restartRequired) {
        setFeedback({ type: 'success', message: `${updates.length}개 설정이 저장되었습니다.` });
        return;
      }

      setFeedback({ type: 'success', message: `${updates.length}개 설정 저장 완료. 워커를 재시작합니다...` });

      try {
        await restartWorker();
        setFeedback({ type: 'success', message: `${updates.length}개 설정 저장 및 워커 재시작 완료` });
      } catch (restartError) {
        const message =
          restartError instanceof Error ? restartError.message : '알 수 없는 오류로 워커 재시작에 실패했습니다.';
        setFeedback({
          type: 'error',
          message: `설정은 저장됐지만 워커 재시작에 실패했습니다. 수동 재시작이 필요합니다. (${message})`,
        });
      }
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : '설정 저장에 실패했습니다.' });
    }
  };

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <Skeleton className='h-8 w-48' />
        {LOADING_SKELETON_KEYS.map((key) => (
          <Skeleton key={key} className='h-48 w-full' />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className='rounded-md border border-border p-6'>
        <p className='text-muted-foreground'>설정을 불러오는 데 실패했습니다. 페이지를 새로고침해 주세요.</p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-xl font-semibold'>시스템 설정</h2>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={handleReset} disabled={!hasChanges || isBusy}>
            초기화
          </Button>
          <Button onClick={() => void handleSave()} disabled={!hasChanges || hasValidationErrors || isBusy}>
            {mutation.isPending ? '저장 중...' : isRestarting ? '워커 재시작 중...' : '저장'}
          </Button>
        </div>
      </div>

      {feedback && (
        <Alert variant={feedback.type === 'error' ? 'destructive' : 'default'}>
          <AlertTitle>{feedback.type === 'success' ? '성공' : '오류'}</AlertTitle>
          <AlertDescription>{feedback.message}</AlertDescription>
        </Alert>
      )}
      {manualSnapshotFeedback && (
        <Alert variant={manualSnapshotFeedback.type === 'error' ? 'destructive' : 'default'}>
          <AlertTitle>{manualSnapshotFeedback.type === 'success' ? '작업 등록됨' : '작업 실패'}</AlertTitle>
          <AlertDescription>{manualSnapshotFeedback.message}</AlertDescription>
        </Alert>
      )}

      {CATEGORY_ORDER.map((category) => {
        const items = settingsByCategory.get(category);
        if (!items?.length) return null;

        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle>{CATEGORY_LABELS[category] ?? category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {items.map((item) => (
                  <SettingRow
                    key={item.key}
                    item={item}
                    value={values[item.key] ?? ''}
                    unit={units[item.key] ?? 'ms'}
                    minValue={minValues[item.key] ?? ''}
                    maxValue={maxValues[item.key] ?? ''}
                    isChanged={changedKeys.has(item.key)}
                    isOutOfRange={outOfRangeKeys.has(item.key)}
                    isInvalidLimit={invalidLimitKeys.has(item.key)}
                    isLimitEditEnabled={limitEditKeys.has(item.key)}
                    isPending={isBusy}
                    onValueChange={handleChange}
                    onUnitChange={(key, newUnit) => setUnits((prev) => ({ ...prev, [key]: newUnit }))}
                    onMinChange={handleMinChange}
                    onMaxChange={handleMaxChange}
                    onToggleLimitEdit={toggleLimitEdit}
                    isManualSnapshotRunning={isManualSnapshotRunning}
                    onManualSnapshotRun={handleManualSnapshotRun}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Separator />
      <PriceBackfill />
      <Separator />
      <SettingsHistory />
    </div>
  );
}

// ============================================
// 설정 행 컴포넌트
// ============================================

interface SettingRowProps {
  item: SystemSettingItem;
  value: string;
  unit: TimeUnit;
  minValue: string;
  maxValue: string;
  isChanged: boolean;
  isOutOfRange: boolean;
  isInvalidLimit: boolean;
  isLimitEditEnabled: boolean;
  isPending: boolean;
  onValueChange: (key: string, value: string) => void;
  onUnitChange: (key: string, unit: TimeUnit) => void;
  onMinChange: (key: string, value: string) => void;
  onMaxChange: (key: string, value: string) => void;
  onToggleLimitEdit: (key: string) => void;
  isManualSnapshotRunning: boolean;
  onManualSnapshotRun: () => void;
}

function SettingRow({
  item,
  value,
  unit,
  minValue,
  maxValue,
  isChanged,
  isOutOfRange,
  isInvalidLimit,
  isLimitEditEnabled,
  isPending,
  onValueChange,
  onUnitChange,
  onMinChange,
  onMaxChange,
  onToggleLimitEdit,
  isManualSnapshotRunning,
  onManualSnapshotRun,
}: SettingRowProps) {
  const isMs = isMsSetting(item.key);
  const isMinutesCron = item.key === MINUTES_ONLY_CRON_SETTING_KEY;
  const isCronExpression = CRON_TEXT_SETTING_KEYS.has(item.key);
  const isPublicSnapshotCron = item.key === PUBLIC_SNAPSHOT_CRON_SETTING_KEY;
  const isInt = item.type === 'int';
  const currentUnit = unit;

  // ms 설정: 현재 단위로 변환된 표시 값 계산
  const displayValue = isMs
    ? (() => {
        const raw = Number(value);
        return Number.isNaN(raw) ? value : String(msToDisplay(raw, currentUnit));
      })()
    : value;

  // min/max 표시값 (ms 설정일 경우 동일 단위 변환)
  const displayMin =
    isMs && minValue
      ? (() => {
          const raw = Number(minValue);
          return Number.isNaN(raw) ? minValue : String(msToDisplay(raw, currentUnit));
        })()
      : minValue;

  const displayMax =
    isMs && maxValue
      ? (() => {
          const raw = Number(maxValue);
          return Number.isNaN(raw) ? maxValue : String(msToDisplay(raw, currentUnit));
        })()
      : maxValue;

  return (
    <div className='grid gap-1.5'>
      <div className='flex items-center gap-2'>
        <Label htmlFor={item.key}>{item.key}</Label>
        {isChanged && (
          <Badge variant='outline' className='text-xs'>
            변경됨
          </Badge>
        )}
      </div>
      {item.description && <p className='text-xs text-muted-foreground'>{item.description}</p>}
      {isMs ? (
        <div className='flex gap-2'>
          <Input
            id={item.key}
            type='number'
            min={0}
            className={`flex-1 ${isOutOfRange ? 'border-destructive' : ''}`}
            value={displayValue}
            onChange={(e) => {
              const num = Number(e.target.value);
              if (e.target.value === '' || Number.isNaN(num)) {
                onValueChange(item.key, e.target.value);
              } else {
                onValueChange(item.key, String(displayToMs(num, currentUnit)));
              }
            }}
            disabled={isPending}
          />
          <Select
            value={currentUnit}
            onValueChange={(newUnit: TimeUnit) => onUnitChange(item.key, newUnit)}
            disabled={isPending}
          >
            <SelectTrigger className='w-20'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ms'>ms</SelectItem>
              <SelectItem value='s'>초</SelectItem>
              <SelectItem value='min'>분</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : isMinutesCron ? (
        <div className='flex items-center gap-2'>
          <Input
            id={item.key}
            type='number'
            min={1}
            className='flex-1'
            value={(() => {
              const mins = cronToMinutes(value);
              return mins !== null ? String(mins) : '';
            })()}
            onChange={(e) => {
              const num = Number(e.target.value);
              if (e.target.value === '' || Number.isNaN(num) || num < 1) {
                onValueChange(item.key, e.target.value);
              } else {
                onValueChange(item.key, minutesToCron(num));
              }
            }}
            disabled={isPending}
          />
          <span className='text-sm text-muted-foreground whitespace-nowrap'>분마다</span>
        </div>
      ) : isCronExpression ? (
        <Input
          id={item.key}
          type='text'
          placeholder='분 시 일 월 요일 (예: 7 1 * * *)'
          className='font-mono text-sm'
          value={value}
          onChange={(e) => onValueChange(item.key, e.target.value)}
          disabled={isPending}
        />
      ) : (
        <Input
          id={item.key}
          type={item.type === 'int' ? 'number' : 'text'}
          {...(item.type === 'int' ? { min: 0 } : {})}
          className={isOutOfRange ? 'border-destructive' : ''}
          value={value}
          onChange={(e) => onValueChange(item.key, e.target.value)}
          disabled={isPending}
        />
      )}
      {isCronExpression && <p className='text-xs text-muted-foreground'>현재 해석: {describeCronExpression(value)}</p>}
      {isCronExpression && !isMinutesCron && (
        <p className='text-xs text-muted-foreground'>형식: 분 시 일 월 요일 (UTC 기준)</p>
      )}
      {isPublicSnapshotCron && (
        <div className='flex flex-wrap gap-1.5'>
          {PUBLIC_SNAPSHOT_CRON_PRESETS.map((preset) => (
            <Button
              key={preset.value}
              type='button'
              variant={value === preset.value ? 'default' : 'outline'}
              size='sm'
              className='h-7 px-2 text-xs'
              onClick={() => onValueChange(item.key, preset.value)}
              disabled={isPending}
            >
              {preset.label}
            </Button>
          ))}
          <Button
            type='button'
            variant='secondary'
            size='sm'
            className='h-7 px-2 text-xs'
            onClick={onManualSnapshotRun}
            disabled={isPending || isManualSnapshotRunning}
          >
            {isManualSnapshotRunning ? '즉시 실행 중...' : '지금 즉시 실행'}
          </Button>
        </div>
      )}
      {requiresWorkerRestart(item.key) && (
        <p className='text-xs text-muted-foreground'>저장 시 워커 재시작이 자동으로 실행됩니다.</p>
      )}

      {/* 범위 밖 경고 */}
      {isOutOfRange && (
        <p className='text-xs text-destructive'>
          허용 범위를 벗어났습니다 (MIN: {isMs && minValue ? formatLimitDisplay(minValue, currentUnit) : minValue}, MAX:{' '}
          {isMs && maxValue ? formatLimitDisplay(maxValue, currentUnit) : maxValue})
        </p>
      )}

      {/* int 타입 설정의 MIN/MAX 편집 영역 */}
      {isInt && (
        <div className='flex items-center gap-3 mt-1'>
          <div className='flex items-center gap-1.5'>
            <Checkbox
              id={`limit-${item.key}`}
              checked={isLimitEditEnabled}
              onCheckedChange={() => onToggleLimitEdit(item.key)}
              disabled={isPending}
            />
            <Label htmlFor={`limit-${item.key}`} className='text-xs text-muted-foreground cursor-pointer'>
              범위 제한
            </Label>
          </div>
          <div className='flex items-center gap-1.5'>
            <span className='text-xs text-muted-foreground'>MIN</span>
            <Input
              type='number'
              className={`w-24 h-7 text-xs ${isInvalidLimit ? 'border-destructive' : ''}`}
              value={displayMin}
              onChange={(e) => {
                const num = Number(e.target.value);
                if (isMs) {
                  if (e.target.value === '' || Number.isNaN(num)) {
                    onMinChange(item.key, e.target.value);
                  } else {
                    onMinChange(item.key, String(displayToMs(num, currentUnit)));
                  }
                } else {
                  onMinChange(item.key, e.target.value);
                }
              }}
              disabled={!isLimitEditEnabled || isPending}
            />
            <span className='text-xs text-muted-foreground'>~</span>
            <span className='text-xs text-muted-foreground'>MAX</span>
            <Input
              type='number'
              className={`w-24 h-7 text-xs ${isInvalidLimit ? 'border-destructive' : ''}`}
              value={displayMax}
              onChange={(e) => {
                const num = Number(e.target.value);
                if (isMs) {
                  if (e.target.value === '' || Number.isNaN(num)) {
                    onMaxChange(item.key, e.target.value);
                  } else {
                    onMaxChange(item.key, String(displayToMs(num, currentUnit)));
                  }
                } else {
                  onMaxChange(item.key, e.target.value);
                }
              }}
              disabled={!isLimitEditEnabled || isPending}
            />
            {isMs && <span className='text-xs text-muted-foreground'>{currentUnit}</span>}
          </div>
        </div>
      )}
      {isInvalidLimit && <p className='text-xs text-destructive'>MIN 값이 MAX 값보다 클 수 없습니다</p>}
    </div>
  );
}

function formatLimitDisplay(rawValue: string, unit: TimeUnit): string {
  const num = Number(rawValue);
  if (Number.isNaN(num)) return rawValue;
  return `${msToDisplay(num, unit)}${unit}`;
}

// ============================================
// 가격 백필 섹션
// ============================================

interface BackfillResult {
  checkLogs: { updated: number; skipped: number };
  accommodations: { updated: number; total: number };
}

function PriceBackfill() {
  const [isPending, setIsPending] = useState(false);
  const [result, setResult] = useState<BackfillResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBackfill = useCallback(async () => {
    setIsPending(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('/api/admin/backfill/prices', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? '백필 실패');
      }
      const data: BackfillResult = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류');
    } finally {
      setIsPending(false);
    }
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>데이터 관리</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm font-medium'>가격 데이터 백필</p>
            <p className='text-xs text-muted-foreground'>
              기존 CheckLog/Accommodation의 가격 문자열을 파싱하여 숫자·통화 필드를 채웁니다.
            </p>
          </div>
          <Button variant='outline' onClick={handleBackfill} disabled={isPending}>
            {isPending ? '처리 중...' : '실행'}
          </Button>
        </div>

        {result && (
          <Alert>
            <AlertTitle>백필 완료</AlertTitle>
            <AlertDescription>
              CheckLog: {result.checkLogs.updated}건 업데이트, {result.checkLogs.skipped}건 스킵
              <br />
              Accommodation: {result.accommodations.updated}/{result.accommodations.total}건 업데이트
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant='destructive'>
            <AlertTitle>오류</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
