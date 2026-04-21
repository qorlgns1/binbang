import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { CuidEntity } from '../base/cuid-entity.ts';
import { QuotaKey } from '../../enums.ts';
import { Plan } from './plan.entity.ts';

@Entity('PlanQuota')
@Unique(['planId', 'key'])
export class PlanQuota extends CuidEntity {
  @Column({ type: 'varchar2', length: 30 })
  planId!: string;

  @Column({ type: 'varchar2', length: 30 })
  key!: QuotaKey;

  @Column({ type: 'number' })
  value!: number;

  @ManyToOne(
    () => Plan,
    (plan) => plan.quotas,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'planId' })
  plan!: Plan;
}
