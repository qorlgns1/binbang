import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, Unique, UpdateDateColumn } from 'typeorm';
import { CuidEntity } from '../base/cuid-entity.ts';
import { PredictionConfidence } from '../../enums.ts';
import { PublicProperty } from './public-property.entity.ts';

@Entity('PublicAvailabilityPrediction')
@Unique(['publicPropertyId', 'predictedAt'])
export class PublicAvailabilityPrediction extends CuidEntity {
  @Column({ type: 'varchar2', length: 30 })
  publicPropertyId!: string;

  @Column({ type: 'timestamp', default: () => 'SYSTIMESTAMP' })
  predictedAt!: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  nextLikelyAvailableAt!: Date | null;

  @Column({ type: 'varchar2', length: 10 })
  confidence!: PredictionConfidence;

  @Column({ type: 'clob' })
  reasoning!: string;

  @Column({ type: 'number', default: 28 })
  windowDays!: number;

  @Column({ type: 'varchar2', length: 20, default: 'v1.0' })
  algorithmVersion!: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;

  @ManyToOne(
    () => PublicProperty,
    (pp) => pp.predictions,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'publicPropertyId' })
  publicProperty!: PublicProperty;
}
