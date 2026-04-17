import { Column, CreateDateColumn, Entity, Index } from 'typeorm';
import { CuidEntity } from '../base/cuid-entity.ts';

@Entity('LandingEvent')
@Index(['occurredAt'])
@Index(['eventName', 'occurredAt'])
@Index(['sessionId'])
export class LandingEvent extends CuidEntity {
  @Column({ type: 'varchar2', length: 100 })
  eventName!: string;

  @Column({ type: 'varchar2', length: 100, nullable: true })
  source!: string | null;

  @Column({ type: 'varchar2', length: 100, nullable: true })
  sessionId!: string | null;

  @Column({ type: 'varchar2', length: 10, nullable: true })
  locale!: string | null;

  @Column({ type: 'varchar2', length: 500, default: '/' })
  path!: string;

  @Column({ type: 'varchar2', length: 1000, nullable: true })
  referrer!: string | null;

  @Column({ type: 'clob', nullable: true })
  userAgent!: string | null;

  @Column({ type: 'varchar2', length: 50, nullable: true })
  ipAddress!: string | null;

  @Column({ type: 'timestamp with time zone', default: () => 'SYSTIMESTAMP' })
  occurredAt!: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;
}
