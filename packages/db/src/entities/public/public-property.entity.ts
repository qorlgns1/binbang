import { booleanTransformer } from '../base/transformers.js';
import { Column, CreateDateColumn, Entity, Index, OneToMany, Unique, UpdateDateColumn } from 'typeorm';
import { CuidEntity } from '../base/cuid-entity.ts';
import { Platform } from '../../enums.ts';
import { PublicAvailabilitySnapshot } from './public-availability-snapshot.entity.ts';
import { PublicAvailabilityPrediction } from './public-availability-prediction.entity.ts';

@Entity('PublicProperty')
@Unique(['platform', 'platformPropertyKey'])
@Unique(['platform', 'slug'])
@Index(['countryKey', 'cityKey'])
@Index(['isActive'])
export class PublicProperty extends CuidEntity {
  @Column({ type: 'varchar2', length: 10 })
  platform!: Platform;

  @Column({ type: 'varchar2', length: 255 })
  platformPropertyKey!: string;

  @Column({ type: 'varchar2', length: 255 })
  slug!: string;

  @Column({ type: 'varchar2', length: 500 })
  name!: string;

  @Column({ type: 'clob' })
  sourceUrl!: string;

  @Column({ type: 'clob', nullable: true })
  imageUrl!: string | null;

  @Column({ type: 'clob', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar2', length: 100, nullable: true })
  countryKey!: string | null;

  @Column({ type: 'varchar2', length: 100, nullable: true })
  cityKey!: string | null;

  @Column({ type: 'varchar2', length: 100, nullable: true })
  addressRegion!: string | null;

  @Column({ type: 'varchar2', length: 100, nullable: true })
  addressLocality!: string | null;

  @Column({ type: 'double precision', nullable: true })
  ratingValue!: number | null;

  @Column({ type: 'number', nullable: true })
  reviewCount!: number | null;

  @Column({ type: 'double precision', nullable: true })
  latitude!: number | null;

  @Column({ type: 'double precision', nullable: true })
  longitude!: number | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastObservedAt!: Date | null;

  @Column({ type: 'smallint', default: 1, transformer: booleanTransformer })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;

  @OneToMany(
    () => PublicAvailabilitySnapshot,
    (s) => s.publicProperty,
  )
  snapshots!: PublicAvailabilitySnapshot[];

  @OneToMany(
    () => PublicAvailabilityPrediction,
    (p) => p.publicProperty,
  )
  predictions!: PublicAvailabilityPrediction[];
}
