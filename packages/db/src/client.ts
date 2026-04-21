// TypeORM DataSource 기반으로 교체.
// 기존 `prisma` named export를 제거하고 getDataSource()를 사용하세요.
export { AppDataSource, getDataSource } from './data-source.ts';
