import { vi } from 'vitest';
const REPOSITORY_REF = Symbol('mockRepositoryRef');
function makeChainableBuilderMethod(builder) {
  return vi.fn(() => builder);
}
export function createMockQueryBuilder() {
  const builder = {};
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
export function createMockRepository(options = {}) {
  const queryBuilder = options.queryBuilder ?? createMockQueryBuilder();
  const createResultFactory = options.createResultFactory ?? ((input) => input);
  const repository = {};
  Object.assign(repository, {
    find: vi.fn(),
    findOne: vi.fn(),
    findOneOrFail: vi.fn(),
    findAndCount: vi.fn(),
    count: vi.fn(),
    create: vi.fn((input) => {
      const entity = createResultFactory(input);
      if (entity && typeof entity === 'object') {
        Object.defineProperty(entity, REPOSITORY_REF, {
          configurable: true,
          enumerable: false,
          value: repository,
          writable: true,
        });
      }
      return entity;
    }),
    save: vi.fn(async (entity) => entity),
    update: vi.fn(),
    delete: vi.fn(),
    upsert: vi.fn(),
    remove: vi.fn(),
    createQueryBuilder: vi.fn(() => queryBuilder),
    queryBuilder,
  });
  return repository;
}
function resolveRepositoryTokenName(token) {
  if (typeof token === 'function' && token.name) return token.name;
  if (typeof token === 'symbol') return token.description ?? null;
  if (typeof token === 'string') return token;
  return null;
}
export function createMockDataSource(options = {}) {
  const repositories = new Map(options.repositories ?? []);
  const rootQueryBuilder = options.queryBuilder ?? createMockQueryBuilder();
  const callMock = (mockFn, ...args) => mockFn(...args);
  const getMockRepository = (source, token) => callMock(source.getRepository, token);
  const dataSource = {};
  Object.assign(dataSource, {
    getRepository: vi.fn((token) => {
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
    findOne: vi.fn((token, options) => callMock(getMockRepository(dataSource, token).findOne, options)),
    count: vi.fn((token, options) => callMock(getMockRepository(dataSource, token).count, options)),
    query: vi.fn(options.queryImplementation ?? (async () => [])),
    transaction: vi.fn(options.transactionImplementation ?? (async (callback) => callback(dataSource))),
    createQueryBuilder: vi.fn(() => rootQueryBuilder),
    save: vi.fn(async (entity) => {
      const repository = entity && typeof entity === 'object' ? entity[REPOSITORY_REF] : null;
      if (repository && typeof repository.save === 'function') {
        return callMock(repository.save, entity);
      }
      throw new Error('No mock repository registered for entity save');
    }),
    update: vi.fn((token, criteria, partialEntity) =>
      callMock(getMockRepository(dataSource, token).update, criteria, partialEntity),
    ),
    manager: undefined,
    __setRepository: (token, repo) => {
      repositories.set(token, repo);
    },
  });
  dataSource.manager = dataSource;
  return dataSource;
}
