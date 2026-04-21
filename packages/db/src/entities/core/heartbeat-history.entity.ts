import { booleanTransformer } from '../base/transformers.js';
import { Column, Entity, Generated, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { WorkerHeartbeat } from './worker-heartbeat.entity.ts';

@Entity('HeartbeatHistory')
@Index(['timestamp'])
@Index(['workerId'])
export class HeartbeatHistory {
  @PrimaryColumn({ type: 'number' })
  @Generated('increment')
  id!: number;

  @Column({ type: 'timestamp with time zone', default: () => 'SYSTIMESTAMP' })
  timestamp!: Date;

  @Column({ type: 'varchar2', length: 20 })
  status!: string;

  @Column({ type: 'smallint', default: 0, transformer: booleanTransformer })
  isProcessing!: boolean;

  @Column({ type: 'double precision', nullable: true })
  uptime!: number | null;

  @Column({ type: 'varchar2', length: 30, default: 'singleton' })
  workerId!: string;

  @ManyToOne(
    () => WorkerHeartbeat,
    (wh) => wh.history,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'workerId' })
  worker!: WorkerHeartbeat;
}
