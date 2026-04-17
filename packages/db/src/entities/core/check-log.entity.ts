import { booleanTransformer } from '../base/transformers.js';
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { CuidEntity } from '../base/cuid-entity.ts';
import { AvailabilityStatus } from '../../enums.ts';
import { User } from '../auth/user.entity.ts';
import { ConditionMetEvent } from '../billing/condition-met-event.entity.ts';
import { Accommodation } from './accommodation.entity.ts';
import { CheckCycle } from './check-cycle.entity.ts';

@Entity('CheckLog')
@Index(['accommodationId'])
@Index(['createdAt'])
@Index(['cycleId'])
@Index(['accommodationId', 'checkIn', 'checkOut'])
export class CheckLog extends CuidEntity {
  @Column({ type: 'varchar2', length: 30 })
  accommodationId!: string;

  @Column({ type: 'varchar2', length: 30 })
  userId!: string;

  @Column({ type: 'varchar2', length: 20 })
  status!: AvailabilityStatus;

  @Column({ type: 'varchar2', length: 255, nullable: true })
  price!: string | null;

  @Column({ type: 'number', nullable: true })
  priceAmount!: number | null;

  @Column({ type: 'varchar2', length: 10, nullable: true })
  priceCurrency!: string | null;

  @Column({ type: 'clob', nullable: true })
  errorMessage!: string | null;

  @Column({ type: 'smallint', default: 0, transformer: booleanTransformer })
  notificationSent!: boolean;

  @Column({ type: 'timestamp with time zone', nullable: true })
  checkIn!: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  checkOut!: Date | null;

  @Column({ type: 'number', nullable: true })
  pricePerNight!: number | null;

  @Column({ type: 'varchar2', length: 30, nullable: true })
  cycleId!: string | null;

  @Column({ type: 'number', nullable: true })
  durationMs!: number | null;

  @Column({ type: 'number', default: 0 })
  retryCount!: number;

  @Column({ type: 'varchar2', length: 20, nullable: true })
  previousStatus!: AvailabilityStatus | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @ManyToOne(
    () => Accommodation,
    (acc) => acc.checkLogs,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'accommodationId' })
  accommodation!: Accommodation;

  @ManyToOne(
    () => User,
    (user) => user.checkLogs,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(
    () => CheckCycle,
    (cycle) => cycle.checkLogs,
    { onDelete: 'SET NULL', nullable: true },
  )
  @JoinColumn({ name: 'cycleId' })
  cycle!: CheckCycle | null;

  @OneToMany(
    () => ConditionMetEvent,
    (evt) => evt.checkLog,
  )
  conditionMetEvents!: ConditionMetEvent[];
}
