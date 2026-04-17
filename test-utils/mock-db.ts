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

const REPOSITORY_REF = Symbol('mockRepositoryRef');

function makeChainableBuilderMethod<T extends object>(builder: T): ReturnType<typeof vi.fn> {
  return vi.fn(() => builder);
}

export function createMockQueryBuilder(): MockQueryBuilder {
  const builder = {} as MockQueryBuilder;

  builder.select = makeChainableBuilderMethod(builder);
  builder.addSelect = makeChainableBuilderMethod(builder);
  builder.from = makeChainableBuilderMethod(builder);
  builder.into = makeChainableBuilderMethod(builder);
  builder.insert = makeChainableBuilderMethod(builder);
  builder.update = makeChainableBuilderMethod(builder);
  builder.delete = makeChainableBuilderMethod(builder);
  builder.set = makeChainableBuilderMethod(builder);
  builder.values = makeChainableBuilderMethod(builder);
  builder.where = makeChainableBuilderMethod(builder);
  builder.andWhere = makeChainableBuilderMethod(builder);
  builder.orWhere = makeChainableBuilderMethod(builder);
  builder.having = makeChainableBuilderMethod(builder);
  builder.leftJoin = makeChainableBuilderMethod(builder);
  builder.leftJoinAndSelect = makeChainableBuilderMethod(builder);
  builder.innerJoin = makeChainableBuilderMethod(builder);
  builder.innerJoinAndSelect = makeChainableBuilderMethod(builder);
  builder.orderBy = makeChainableBuilderMethod(builder);
  builder.addOrderBy = makeChainableBuilderMethod(builder);
  builder.groupBy = makeChainableBuilderMethod(builder);
  builder.addGroupBy = makeChainableBuilderMethod(builder);
  builder.take = makeChainableBuilderMethod(builder);
  builder.skip = makeChainableBuilderMethod(builder);
  builder.limit = makeChainableBuilderMethod(builder);
  builder.offset = makeChainableBuilderMethod(builder);
  builder.setParameters = makeChainableBuilderMethod(builder);
  builder.setParameter = makeChainableBuilderMethod(builder);
  builder.getQuery = vi.fn(() => 'SELECT 1');
  builder.subQuery = vi.fn(() => createMockQueryBuilder());
  builder.getOne = vi.fn();
  builder.getMany = vi.fn();
  builder.getRawOne = vi.fn();
  builder.getRawMany = vi.fn();
  builder.getCount = vi.fn();
  builder.execute = vi.fn();

  return builder;
}

export function createMockRepository<T = unknown>(
  options: { createResultFactory?: (input: Partial<T>) => T; queryBuilder?: MockQueryBuilder } = {},
): MockRepository<T> {
  const queryBuilder = options.queryBuilder ?? createMockQueryBuilder();
  const createResultFactory = options.createResultFactory ?? ((input: Partial<T>): T => input as T);
  const repository = {} as MockRepository<T>;

  Object.assign(repository, {
    find: vi.fn(),
    findOne: vi.fn(),
    findOneOrFail: vi.fn(),
    findAndCount: vi.fn(),
    count: vi.fn(),
    create: vi.fn((input: Partial<T>) => {
      const entity = createResultFactory(input);
      if (entity && typeof entity === 'object') {
        Object.defineProperty(entity as object, REPOSITORY_REF, {
          configurable: true,
          enumerable: false,
          value: repository,
          writable: true,
        });
      }
      return entity;
    }),
    save: vi.fn(async (entity: T) => entity),
    update: vi.fn(),
    delete: vi.fn(),
    upsert: vi.fn(),
    remove: vi.fn(),
    createQueryBuilder: vi.fn(() => queryBuilder),
    queryBuilder,
  });

  return repository;
}

function resolveRepositoryTokenName(token: unknown): string | null {
  if (typeof token === 'function' && token.name) return token.name;
  if (typeof token === 'symbol') return token.description ?? null;
  if (typeof token === 'string') return token;
  return null;
}

export function createMockDataSource(
  options: {
    repositories?: Array<[unknown, MockRepository]>;
    queryBuilder?: MockQueryBuilder;
    queryImplementation?: AnyFn;
    transactionImplementation?: AnyFn;
  } = {},
): MockDataSource {
  const repositories = new Map<unknown, MockRepository>(options.repositories ?? []);
  const rootQueryBuilder = options.queryBuilder ?? createMockQueryBuilder();
  const callMock = (mockFn: unknown, ...args: unknown[]) => (mockFn as AnyFn)(...args);
  const getMockRepository = (source: MockDataSource, token: unknown) =>
    callMock(source.getRepository, token) as MockRepository;

  const dataSource = {} as MockDataSource;

  Object.assign(dataSource, {
    getRepository: vi.fn((token: unknown): MockRepository => {
      const direct = repositories.get(token);
      if (direct) return direct;

      const tokenName = resolveRepositoryTokenName(token);
      if (tokenName) {
        for (const [registeredToken, repository] of repositories.entries()) {
          if (resolveRepositoryTokenName(registeredToken) === tokenName) {
            return repository;
          }
        }
      }

      throw new Error(`No mock repository registered for token: ${String(tokenName ?? token)}`);
    }),
    findOne: vi.fn((token: unknown, options: unknown) =>
      callMock(getMockRepository(dataSource, token).findOne, options),
    ),
    count: vi.fn((token: unknown, options: unknown) => callMock(getMockRepository(dataSource, token).count, options)),
    query: vi.fn(options.queryImplementation ?? (async () => [])),
    transaction: vi.fn(
      options.transactionImplementation ??
        (async (callback: (manager: MockDataSource) => Promise<unknown> | unknown) => callback(dataSource)),
    ),
    createQueryBuilder: vi.fn(() => rootQueryBuilder),
    save: vi.fn(async (entity: unknown) => {
      const repository =
        entity && typeof entity === 'object' ? (entity as Record<PropertyKey, unknown>)[REPOSITORY_REF] : null;
      if (repository && typeof (repository as MockRepository).save === 'function') {
        return callMock((repository as MockRepository).save, entity);
      }
      throw new Error('No mock repository registered for entity save');
    }),
    update: vi.fn((token: unknown, criteria: unknown, partialEntity: unknown) =>
      callMock(getMockRepository(dataSource, token).update, criteria, partialEntity),
    ),
    manager: undefined as unknown as MockDataSource,
    __setRepository: (token: unknown, repo: MockRepository): void => {
      repositories.set(token, repo);
    },
  } satisfies MockDataSource);

  dataSource.manager = dataSource;

  return dataSource;
}
