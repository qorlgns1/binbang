import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, UpdateDateColumn } from 'typeorm';
import { CuidEntity } from '../base/cuid-entity.ts';
import { SubscriptionStatus } from '../../enums.ts';
import { User } from '../auth/user.entity.ts';
import { Plan } from '../rbac/plan.entity.ts';

@Entity('Subscription')
@Index(['userId'])
@Index(['status'])
@Index(['currentPeriodEnd'])
export class Subscription extends CuidEntity {
  @Column({ type: 'varchar2', length: 30 })
  userId!: string;

  @Column({ type: 'varchar2', length: 30 })
  planId!: string;

  @Column({ type: 'varchar2', length: 20, default: SubscriptionStatus.ACTIVE })
  status!: SubscriptionStatus;

  @Column({ type: 'timestamp with time zone' })
  currentPeriodStart!: Date;

  @Column({ type: 'timestamp with time zone' })
  currentPeriodEnd!: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  canceledAt!: Date | null;

  @Column({ type: 'varchar2', length: 500, nullable: true })
  cancelReason!: string | null;

  @Column({ type: 'varchar2', length: 50, nullable: true })
  paymentProvider!: string | null;

  @Column({ type: 'varchar2', length: 255, nullable: true })
  externalSubscriptionId!: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;

  @ManyToOne(
    () => User,
    (user) => user.subscriptions,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(
    () => Plan,
    (plan) => plan.subscriptions,
    {},
  )
  @JoinColumn({ name: 'planId' })
  plan!: Plan;
}
