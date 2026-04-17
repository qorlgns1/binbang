import { Column, CreateDateColumn, Entity, Generated, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from '../auth/user.entity.ts';
import { Accommodation } from '../core/accommodation.entity.ts';

@Entity('agoda_consent_logs')
@Index(['userId', 'createdAt'])
@Index(['email', 'createdAt'])
@Index(['accommodationId', 'createdAt'])
export class AgodaConsentLog {
  @PrimaryColumn({ type: 'number' })
  @Generated('increment')
  id!: number;

  @Column({ type: 'varchar2', length: 30, nullable: true })
  userId!: string | null;

  @Column({ type: 'varchar2', length: 30, nullable: true })
  accommodationId!: string | null;

  @Column({ type: 'varchar2', length: 255 })
  email!: string;

  @Column({ type: 'varchar2', length: 20 })
  type!: string;

  @Column({ type: 'varchar2', length: 50, nullable: true })
  ipAddress!: string | null;

  @Column({ type: 'clob', nullable: true })
  userAgent!: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @ManyToOne(
    () => User,
    (u) => u.agodaConsentLogs,
    { onDelete: 'SET NULL', nullable: true },
  )
  @JoinColumn({ name: 'userId' })
  user!: User | null;

  @ManyToOne(
    () => Accommodation,
    (acc) => acc.agodaConsentLogs,
    {
      onDelete: 'SET NULL',
      nullable: true,
    },
  )
  @JoinColumn({ name: 'accommodationId' })
  accommodation!: Accommodation | null;
}
