import { Column, CreateDateColumn, Entity, ManyToMany, OneToMany, UpdateDateColumn } from 'typeorm';
import { CuidEntity } from '../base/cuid-entity.ts';
import { Subscription } from '../billing/subscription.entity.ts';
import { User } from '../auth/user.entity.ts';
import { Role } from './role.entity.ts';
import { PlanQuota } from './plan-quota.entity.ts';

@Entity('Plan')
export class Plan extends CuidEntity {
  @Column({ type: 'varchar2', length: 50, unique: true })
  name!: string;

  @Column({ type: 'varchar2', length: 500, nullable: true })
  description!: string | null;

  @Column({ type: 'number', default: 0 })
  price!: number;

  @Column({ type: 'varchar2', length: 20, default: 'month' })
  interval!: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;

  @ManyToMany(
    () => Role,
    (role) => role.plans,
  )
  roles!: Role[];

  @OneToMany(
    () => PlanQuota,
    (q) => q.plan,
  )
  quotas!: PlanQuota[];

  @OneToMany(
    () => User,
    (u) => u.plan,
  )
  users!: User[];

  @OneToMany(
    () => Subscription,
    (s) => s.plan,
  )
  subscriptions!: Subscription[];
}
