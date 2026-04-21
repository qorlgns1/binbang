import { booleanTransformer } from '../base/transformers.js';
import { Column, Entity, OneToMany, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { HeartbeatHistory } from './heartbeat-history.entity.ts';

@Entity('WorkerHeartbeat')
export class WorkerHeartbeat {
  @PrimaryColumn({ type: 'varchar2', length: 30, default: 'singleton' })
  id!: string;

  @Column({ type: 'timestamp with time zone', default: () => 'SYSTIMESTAMP' })
  startedAt!: Date;

  @Column({ type: 'timestamp with time zone', default: () => 'SYSTIMESTAMP' })
  lastHeartbeatAt!: Date;

  @Column({ type: 'smallint', default: 0, transformer: booleanTransformer })
  isProcessing!: boolean;

  @Column({ type: 'varchar2', length: 100, default: '*/30 * * * *' })
  schedule!: string;

  @Column({ type: 'number', default: 0 })
  accommodationsChecked!: number;

  @Column({ type: 'number', default: 0 })
  lastCycleErrors!: number;

  @Column({ type: 'number', nullable: true })
  lastCycleDurationMs!: number | null;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;

  @OneToMany(
    () => HeartbeatHistory,
    (h) => h.worker,
  )
  history!: HeartbeatHistory[];
}
