import { booleanTransformer } from '../base/transformers.js';
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, UpdateDateColumn } from 'typeorm';
import { CuidEntity } from '../base/cuid-entity.ts';
import { AvailabilityStatus, Platform } from '../../enums.ts';
import { User } from '../auth/user.entity.ts';
import { AgodaAlertEvent } from '../agoda/agoda-alert-event.entity.ts';
import { AgodaConsentLog } from '../agoda/agoda-consent-log.entity.ts';
import { AgodaNotification } from '../agoda/agoda-notification.entity.ts';
import { AgodaPollRun } from '../agoda/agoda-poll-run.entity.ts';
import { AgodaRoomSnapshot } from '../agoda/agoda-room-snapshot.entity.ts';
import { Case } from '../case/case.entity.ts';
import { CheckLog } from './check-log.entity.ts';

@Entity('Accommodation')
@Index(['userId'])
@Index(['isActive'])
@Index(['platform', 'isActive'])
export class Accommodation extends CuidEntity {
  @Column({ type: 'varchar2', length: 30 })
  userId!: string;

  @Column({ type: 'varchar2', length: 500 })
  name!: string;

  @Column({ type: 'varchar2', length: 10 })
  platform!: Platform;

  @Column({ type: 'clob', nullable: true })
  url!: string | null;

  @Column({ type: 'timestamp with time zone' })
  checkIn!: Date;

  @Column({ type: 'timestamp with time zone' })
  checkOut!: Date;

  @Column({ type: 'number', default: 2 })
  adults!: number;

  @Column({ type: 'number', default: 1 })
  rooms!: number;

  @Column({ type: 'number', default: 0 })
  children!: number;

  @Column({ type: 'varchar2', length: 10, default: 'KRW' })
  currency!: string;

  @Column({ type: 'varchar2', length: 10, default: 'ko' })
  locale!: string;

  @Column({ type: 'smallint', default: 1, transformer: booleanTransformer })
  isActive!: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  priceDropThreshold!: number | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastPolledAt!: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastEventAt!: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastCheck!: Date | null;

  @Column({ type: 'varchar2', length: 20, default: AvailabilityStatus.UNKNOWN })
  lastStatus!: AvailabilityStatus;

  @Column({ type: 'varchar2', length: 255, nullable: true })
  lastPrice!: string | null;

  @Column({ type: 'number', nullable: true })
  lastPriceAmount!: number | null;

  @Column({ type: 'varchar2', length: 10, nullable: true })
  lastPriceCurrency!: string | null;

  @Column({ type: 'varchar2', length: 255, nullable: true })
  platformId!: string | null;

  @Column({ type: 'varchar2', length: 500, nullable: true })
  platformName!: string | null;

  @Column({ type: 'clob', nullable: true })
  platformImage!: string | null;

  @Column({ type: 'clob', nullable: true })
  platformDescription!: string | null;

  @Column({ type: 'varchar2', length: 100, nullable: true })
  addressCountry!: string | null;

  @Column({ type: 'varchar2', length: 100, nullable: true })
  addressRegion!: string | null;

  @Column({ type: 'varchar2', length: 100, nullable: true })
  addressLocality!: string | null;

  @Column({ type: 'varchar2', length: 20, nullable: true })
  postalCode!: string | null;

  @Column({ type: 'varchar2', length: 500, nullable: true })
  streetAddress!: string | null;

  @Column({ type: 'double precision', nullable: true })
  ratingValue!: number | null;

  @Column({ type: 'number', nullable: true })
  reviewCount!: number | null;

  @Column({ type: 'double precision', nullable: true })
  latitude!: number | null;

  @Column({ type: 'double precision', nullable: true })
  longitude!: number | null;

  @Column({ type: 'simple-json', nullable: true })
  platformMetadata!: object | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;

  @ManyToOne(
    () => User,
    (user) => user.accommodations,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'userId' })
  user!: User;

  @OneToMany(
    () => CheckLog,
    (log) => log.accommodation,
  )
  checkLogs!: CheckLog[];

  @OneToMany(
    () => Case,
    (c) => c.accommodation,
  )
  cases!: Case[];

  @OneToMany(
    () => AgodaPollRun,
    (r) => r.accommodation,
  )
  agodaPollRuns!: AgodaPollRun[];

  @OneToMany(
    () => AgodaRoomSnapshot,
    (s) => s.accommodation,
  )
  agodaRoomSnapshots!: AgodaRoomSnapshot[];

  @OneToMany(
    () => AgodaAlertEvent,
    (e) => e.accommodation,
  )
  agodaAlertEvents!: AgodaAlertEvent[];

  @OneToMany(
    () => AgodaNotification,
    (n) => n.accommodation,
  )
  agodaNotifications!: AgodaNotification[];

  @OneToMany(
    () => AgodaConsentLog,
    (l) => l.accommodation,
  )
  agodaConsentLogs!: AgodaConsentLog[];
}
