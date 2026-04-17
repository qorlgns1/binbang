import { Column, CreateDateColumn, Entity, Index } from 'typeorm';
import { CuidEntity } from '../base/cuid-entity.ts';

@Entity('affiliate_audit_purge_runs')
@Index(['jobName', 'runStartedAt'])
@Index(['status', 'createdAt'])
export class AffiliateAuditPurgeRun extends CuidEntity {
  @Column({ type: 'varchar2', length: 100 })
  jobName!: string;

  @Column({ type: 'timestamp with time zone' })
  runStartedAt!: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  runFinishedAt!: Date | null;

  @Column({ type: 'varchar2', length: 20 })
  status!: string;

  @Column({ type: 'number', default: 0 })
  deletedCount!: number;

  @Column({ type: 'number', default: 0 })
  retryCount!: number;

  @Column({ type: 'varchar2', length: 100, nullable: true })
  errorCode!: string | null;

  @Column({ type: 'clob', nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;
}
