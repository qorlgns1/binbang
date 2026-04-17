import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, Unique, UpdateDateColumn } from 'typeorm';
import { CuidEntity } from '../base/cuid-entity.ts';
import { PublicProperty } from './public-property.entity.ts';

@Entity('PublicAvailabilitySnapshot')
@Unique(['publicPropertyId', 'snapshotDate'])
@Index(['snapshotDate'])
@Index(['openRate'])
export class PublicAvailabilitySnapshot extends CuidEntity {
  @Column({ type: 'varchar2', length: 30 })
  publicPropertyId!: string;

  @Column({ type: 'date' })
  snapshotDate!: Date;

  @Column({ type: 'timestamp with time zone' })
  windowStartAt!: Date;

  @Column({ type: 'timestamp with time zone' })
  windowEndAt!: Date;

  @Column({ type: 'number' })
  sampleSize!: number;

  @Column({ type: 'number' })
  availableCount!: number;

  @Column({ type: 'number' })
  unavailableCount!: number;

  @Column({ type: 'number' })
  errorCount!: number;

  @Column({ type: 'number', nullable: true })
  avgPriceAmount!: number | null;

  @Column({ type: 'number', nullable: true })
  minPriceAmount!: number | null;

  @Column({ type: 'number', nullable: true })
  maxPriceAmount!: number | null;

  @Column({ type: 'varchar2', length: 10, nullable: true })
  currency!: string | null;

  @Column({ type: 'double precision', nullable: true })
  openRate!: number | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;

  @ManyToOne(
    () => PublicProperty,
    (pp) => pp.snapshots,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'publicPropertyId' })
  publicProperty!: PublicProperty;
}
