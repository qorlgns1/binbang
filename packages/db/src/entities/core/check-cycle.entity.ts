import { Column, CreateDateColumn, Entity, Index, OneToMany } from 'typeorm';
import { CuidEntity } from '../base/cuid-entity.ts';
import { CheckLog } from './check-log.entity.ts';

@Entity('CheckCycle')
@Index(['startedAt'])
@Index(['concurrency', 'browserPoolSize'])
export class CheckCycle extends CuidEntity {
  @Column({ type: 'timestamp with time zone' })
  startedAt!: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  completedAt!: Date | null;

  @Column({ type: 'number', nullable: true })
  durationMs!: number | null;

  @Column({ type: 'number', default: 0 })
  totalCount!: number;

  @Column({ type: 'number', default: 0 })
  successCount!: number;

  @Column({ type: 'number', default: 0 })
  errorCount!: number;

  @Column({ type: 'number' })
  concurrency!: number;

  @Column({ type: 'number' })
  browserPoolSize!: number;

  @Column({ type: 'number' })
  navigationTimeoutMs!: number;

  @Column({ type: 'number' })
  contentWaitMs!: number;

  @Column({ type: 'number' })
  maxRetries!: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @OneToMany(
    () => CheckLog,
    (log) => log.cycle,
  )
  checkLogs!: CheckLog[];
}
