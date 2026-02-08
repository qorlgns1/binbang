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
import type { SystemSettingItem } from '@/types/admin';

import { SettingsHistory } from './settingsHistory';

type TimeUnit = 'ms' | 's' | 'min';

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
        .filter((n) => !isNaN(n) && n > 0);

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

export function SettingsManager() {
  const { data, isLoading, isError } = useSystemSettings();
  const mutation = useUpdateSystemSettings();

  const [values, setValues] = useState<Record<string, string>>({});
  const [units, setUnits] = useState<Record<string, TimeUnit>>({});
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
      if (isNaN(val)) continue;

      const min = minValues[s.key] !== undefined ? Number(minValues[s.key]) : null;
      const max = maxValues[s.key] !== undefined ? Number(maxValues[s.key]) : null;

      if (min !== null && !isNaN(min) && val < min) keys.add(s.key);
      if (max !== null && !isNaN(max) && val > max) keys.add(s.key);
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
      if (min !== null && max !== null && !isNaN(min) && !isNaN(max) && min > max) {
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

  const handleSave = () => {
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

    mutation.mutate(
      { settings: updates },
      {
        onSuccess: () => {
          setLimitEditKeys(new Set());
          setFeedback({ type: 'success', message: `${updates.length}개 설정이 저장되었습니다.` });
        },
        onError: (error) => {
          setFeedback({ type: 'error', message: error.message });
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <Skeleton className='h-8 w-48' />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton
            key={i}
            className='h-48 w-full'
          />
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
          <Button
            variant='outline'
            onClick={handleReset}
            disabled={!hasChanges || mutation.isPending}
          >
            초기화
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || hasValidationErrors || mutation.isPending}
          >
            {mutation.isPending ? '저장 중...' : '저장'}
          </Button>
        </div>
      </div>

      {feedback && (
        <Alert variant={feedback.type === 'error' ? 'destructive' : 'default'}>
          <AlertTitle>{feedback.type === 'success' ? '성공' : '오류'}</AlertTitle>
          <AlertDescription>{feedback.message}</AlertDescription>
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
                    isPending={mutation.isPending}
                    onValueChange={handleChange}
                    onUnitChange={(key, newUnit) => setUnits((prev) => ({ ...prev, [key]: newUnit }))}
                    onMinChange={handleMinChange}
                    onMaxChange={handleMaxChange}
                    onToggleLimitEdit={toggleLimitEdit}
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
}: SettingRowProps) {
  const isMs = isMsSetting(item.key);
  const isCron = item.key === 'worker.cronSchedule';
  const isInt = item.type === 'int';
  const currentUnit = unit;

  // ms 설정: 현재 단위로 변환된 표시 값 계산
  const displayValue = isMs
    ? (() => {
        const raw = Number(value);
        return isNaN(raw) ? value : String(msToDisplay(raw, currentUnit));
      })()
    : value;

  // min/max 표시값 (ms 설정일 경우 동일 단위 변환)
  const displayMin =
    isMs && minValue
      ? (() => {
          const raw = Number(minValue);
          return isNaN(raw) ? minValue : String(msToDisplay(raw, currentUnit));
        })()
      : minValue;

  const displayMax =
    isMs && maxValue
      ? (() => {
          const raw = Number(maxValue);
          return isNaN(raw) ? maxValue : String(msToDisplay(raw, currentUnit));
        })()
      : maxValue;

  return (
    <div className='grid gap-1.5'>
      <div className='flex items-center gap-2'>
        <Label htmlFor={item.key}>{item.key}</Label>
        {isChanged && (
          <Badge
            variant='outline'
            className='text-xs'
          >
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
              if (e.target.value === '' || isNaN(num)) {
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
      ) : isCron ? (
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
              if (e.target.value === '' || isNaN(num) || num < 1) {
                onValueChange(item.key, e.target.value);
              } else {
                onValueChange(item.key, minutesToCron(num));
              }
            }}
            disabled={isPending}
          />
          <span className='text-sm text-muted-foreground whitespace-nowrap'>분마다</span>
        </div>
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
            <Label
              htmlFor={`limit-${item.key}`}
              className='text-xs text-muted-foreground cursor-pointer'
            >
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
                  if (e.target.value === '' || isNaN(num)) {
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
                  if (e.target.value === '' || isNaN(num)) {
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
  if (isNaN(num)) return rawValue;
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
          <Button
            variant='outline'
            onClick={handleBackfill}
            disabled={isPending}
          >
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
