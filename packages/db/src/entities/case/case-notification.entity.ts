import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, UpdateDateColumn } from 'typeorm';
import { CuidEntity } from '../base/cuid-entity.ts';
import { NotificationStatus } from '../../enums.ts';
import { Case } from './case.entity.ts';

@Entity('CaseNotification')
@Index(['caseId'])
@Index(['status'])
export class CaseNotification extends CuidEntity {
  @Column({ type: 'varchar2', length: 30 })
  caseId!: string;

  @Column({ type: 'varchar2', length: 20, default: 'KAKAO' })
  channel!: string;

  @Column({ type: 'varchar2', length: 20, default: NotificationStatus.PENDING })
  status!: NotificationStatus;

  @Column({ type: 'simple-json' })
  payload!: object;

  @Column({ type: 'timestamp with time zone', nullable: true })
  sentAt!: Date | null;

  @Column({ type: 'clob', nullable: true })
  failReason!: string | null;

  @Column({ type: 'number', default: 0 })
  retryCount!: number;

  @Column({ type: 'number', default: 3 })
  maxRetries!: number;

  @Column({ type: 'varchar2', length: 255, unique: true })
  idempotencyKey!: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;

  @ManyToOne(
    () => Case,
    (c) => c.notifications,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'caseId' })
  case!: Case;
}
