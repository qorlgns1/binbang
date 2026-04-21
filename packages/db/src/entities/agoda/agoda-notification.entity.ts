import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Accommodation } from '../core/accommodation.entity.ts';
import { AgodaAlertEvent } from './agoda-alert-event.entity.ts';

@Entity('agoda_notifications')
@Index(['alertEventId'])
@Index(['accommodationId'])
@Index(['status', 'createdAt'])
export class AgodaNotification {
  @PrimaryColumn({ type: 'number' })
  @Generated('increment')
  id!: number;

  @Column({ type: 'varchar2', length: 30, nullable: true })
  accommodationId!: string | null;

  @Column({ type: 'number' })
  alertEventId!: number;

  @Column({ type: 'varchar2', length: 20 })
  channel!: string;

  @Column({ type: 'varchar2', length: 20 })
  status!: string;

  @Column({ type: 'number', default: 0 })
  attempt!: number;

  @Column({ type: 'clob', nullable: true })
  lastError!: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  sentAt!: Date | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;

  @ManyToOne(
    () => Accommodation,
    (acc) => acc.agodaNotifications,
    {
      onDelete: 'SET NULL',
      nullable: true,
    },
  )
  @JoinColumn({ name: 'accommodationId' })
  accommodation!: Accommodation | null;

  @ManyToOne(
    () => AgodaAlertEvent,
    (evt) => evt.notifications,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'alertEventId' })
  alertEvent!: AgodaAlertEvent;
}
