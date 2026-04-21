import type { ValueTransformer } from 'typeorm';

/**
 * Oracle에서는 TypeORM boolean 타입이 지원되지 않아 SMALLINT(0/1)로 저장.
 * 앱 레이어에서는 boolean으로 투명하게 사용 가능.
 */
export const booleanTransformer: ValueTransformer = {
  to: (value: boolean): number => (value ? 1 : 0),
  from: (value: number): boolean => value === 1,
};

export const nullableBooleanTransformer: ValueTransformer = {
  to: (value: boolean | null | undefined): number | null => {
    if (value === null || value === undefined) return null;
    return value ? 1 : 0;
  },
  from: (value: number | null): boolean | null => {
    if (value === null || value === undefined) return null;
    return value === 1;
  },
};
