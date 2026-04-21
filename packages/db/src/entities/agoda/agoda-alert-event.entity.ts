import { Column, Entity, Generated, Index, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm';
import { Accommodation } from '../core/accommodation.entity.ts';
import { AgodaNotification } from './agoda-notification.entity.ts';

@Entity('agoda_alert_events')
@Index(['accommodationId', 'type', 'detectedAt'])
@Index(['accommodationId', 'type', 'offerKey', 'detectedAt'])
export class AgodaAlertEvent {
  @PrimaryColumn({ type: 'number' })
  @Generated('increment')
  id!: number;

  @Column({ type: 'varchar2', length: 30 })
  accommodationId!: string;

  @Column({ type: 'varchar2', length: 30 })
  type!: string;

  @Column({ type: 'varchar2', length: 255, unique: true })
  eventKey!: string;

  @Column({ type: 'varchar2', length: 255, nullable: true })
  offerKey!: string | null;

  @Column({ type: 'varchar2', length: 20, default: 'detected' })
  status!: string;

  @Column({ type: 'timestamp with time zone', default: () => 'SYSTIMESTAMP' })
  detectedAt!: Date;

  @Column({ type: 'varchar2', length: 64, nullable: true })
  beforeHash!: string | null;

  @Column({ type: 'varchar2', length: 64, nullable: true })
  afterHash!: string | null;

  @Column({ type: 'simple-json', nullable: true })
  meta!: object | null;

  @ManyToOne(
    () => Accommodation,
    (acc) => acc.agodaAlertEvents,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'accommodationId' })
  accommodation!: Accommodation;

  @OneToMany(
    () => AgodaNotification,
    (n) => n.alertEvent,
  )
  notifications!: AgodaNotification[];
}
