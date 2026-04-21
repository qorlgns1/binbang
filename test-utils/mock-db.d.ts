import { vi } from 'vitest';
type AnyFn = (...args: any[]) => any;
export interface MockQueryBuilder {
  select: ReturnType<typeof vi.fn>;
  addSelect: ReturnType<typeof vi.fn>;
  from: ReturnType<typeof vi.fn>;
  into: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  values: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  andWhere: ReturnType<typeof vi.fn>;
  orWhere: ReturnType<typeof vi.fn>;
  having: ReturnType<typeof vi.fn>;
  leftJoin: ReturnType<typeof vi.fn>;
  leftJoinAndSelect: ReturnType<typeof vi.fn>;
  innerJoin: ReturnType<typeof vi.fn>;
  innerJoinAndSelect: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
  addOrderBy: ReturnType<typeof vi.fn>;
  groupBy: ReturnType<typeof vi.fn>;
  addGroupBy: ReturnType<typeof vi.fn>;
  take: ReturnType<typeof vi.fn>;
  skip: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  offset: ReturnType<typeof vi.fn>;
  setParameters: ReturnType<typeof vi.fn>;
  setParameter: ReturnType<typeof vi.fn>;
  subQuery: ReturnType<typeof vi.fn>;
  getQuery: ReturnType<typeof vi.fn>;
  getOne: ReturnType<typeof vi.fn>;
  getMany: ReturnType<typeof vi.fn>;
  getRawOne: ReturnType<typeof vi.fn>;
  getRawMany: ReturnType<typeof vi.fn>;
  getCount: ReturnType<typeof vi.fn>;
  execute: ReturnType<typeof vi.fn>;
}
export interface MockRepository<T = unknown> {
  find: ReturnType<typeof vi.fn>;
  findOne: ReturnType<typeof vi.fn>;
  findOneOrFail: ReturnType<typeof vi.fn>;
  findAndCount: ReturnType<typeof vi.fn>;
  count: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
  createQueryBuilder: ReturnType<typeof vi.fn>;
  queryBuilder: MockQueryBuilder;
  __entity?: T;
}
export interface MockDataSource {
  getRepository: ReturnType<typeof vi.fn>;
  findOne: ReturnType<typeof vi.fn>;
  count: ReturnType<typeof vi.fn>;
  query: ReturnType<typeof vi.fn>;
  transaction: ReturnType<typeof vi.fn>;
  createQueryBuilder: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  manager: MockDataSource;
  __setRepository: (token: unknown, repo: MockRepository) => void;
}
export declare function createMockQueryBuilder(): MockQueryBuilder;
export declare function createMockRepository<T = unknown>(options?: {
  createResultFactory?: (input: Partial<T>) => T;
  queryBuilder?: MockQueryBuilder;
}): MockRepository<T>;
export declare function createMockDataSource(options?: {
  repositories?: Array<[unknown, MockRepository]>;
  queryBuilder?: MockQueryBuilder;
  queryImplementation?: AnyFn;
  transactionImplementation?: AnyFn;
}): MockDataSource;
export {};
//# sourceMappingURL=mock-db.d.ts.map
