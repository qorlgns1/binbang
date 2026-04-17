import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { Accommodation } from '../core/accommodation.entity.ts';
import { AgodaRoomSnapshot } from './agoda-room-snapshot.entity.ts';

@Entity('agoda_poll_runs')
@Index(['accommodationId', 'polledAt'])
export class AgodaPollRun {
  @PrimaryColumn({ type: 'number' })
  @Generated('increment')
  id!: number;

  @Column({ type: 'varchar2', length: 30 })
  accommodationId!: string;

  @Column({ type: 'timestamp with time zone', default: () => 'SYSTIMESTAMP' })
  polledAt!: Date;

  @Column({ type: 'number', nullable: true })
  httpStatus!: number | null;

  @Column({ type: 'number', nullable: true })
  latencyMs!: number | null;

  @Column({ type: 'varchar2', length: 20 })
  status!: string;

  @Column({ type: 'clob', nullable: true })
  error!: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @ManyToOne(
    () => Accommodation,
    (acc) => acc.agodaPollRuns,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'accommodationId' })
  accommodation!: Accommodation;

  @OneToMany(
    () => AgodaRoomSnapshot,
    (s) => s.pollRun,
  )
  roomSnapshots!: AgodaRoomSnapshot[];
}
