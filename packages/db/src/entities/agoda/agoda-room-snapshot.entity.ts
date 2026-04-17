import { nullableBooleanTransformer } from '../base/transformers.js';
import { Column, CreateDateColumn, Entity, Generated, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Accommodation } from '../core/accommodation.entity.ts';
import { AgodaPollRun } from './agoda-poll-run.entity.ts';

@Entity('agoda_room_snapshots')
@Index(['accommodationId', 'createdAt'])
@Index(['propertyId', 'roomId', 'ratePlanId', 'createdAt'])
export class AgodaRoomSnapshot {
  @PrimaryColumn({ type: 'number' })
  @Generated('increment')
  id!: number;

  @Column({ type: 'number' })
  pollRunId!: number;

  @Column({ type: 'varchar2', length: 30 })
  accommodationId!: string;

  @Column({ type: 'varchar2', length: 50 })
  propertyId!: string;

  @Column({ type: 'varchar2', length: 50 })
  roomId!: string;

  @Column({ type: 'varchar2', length: 50 })
  ratePlanId!: string;

  @Column({ type: 'number', nullable: true })
  remainingRooms!: number | null;

  @Column({ type: 'smallint', nullable: true, transformer: nullableBooleanTransformer })
  freeCancellation!: boolean | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  freeCancellationDate!: Date | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  totalInclusive!: number | null;

  @Column({ type: 'varchar2', length: 10, nullable: true })
  currency!: string | null;

  @Column({ type: 'varchar2', length: 64 })
  payloadHash!: string;

  @Column({ type: 'simple-json', nullable: true })
  raw!: object | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @ManyToOne(
    () => AgodaPollRun,
    (r) => r.roomSnapshots,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'pollRunId' })
  pollRun!: AgodaPollRun;

  @ManyToOne(
    () => Accommodation,
    (acc) => acc.agodaRoomSnapshots,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'accommodationId' })
  accommodation!: Accommodation;
}
