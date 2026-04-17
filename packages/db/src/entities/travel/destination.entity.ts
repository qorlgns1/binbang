import { booleanTransformer } from '../base/transformers.js';
import { Column, CreateDateColumn, Entity, Index, UpdateDateColumn } from 'typeorm';
import { CuidEntity } from '../base/cuid-entity.ts';

@Entity('Destination')
@Index(['country'])
@Index(['published'])
export class Destination extends CuidEntity {
  @Column({ type: 'varchar2', length: 100, unique: true })
  slug!: string;

  @Column({ type: 'varchar2', length: 200 })
  nameKo!: string;

  @Column({ type: 'varchar2', length: 200 })
  nameEn!: string;

  @Column({ type: 'varchar2', length: 100 })
  country!: string;

  @Column({ type: 'varchar2', length: 10 })
  countryCode!: string;

  @Column({ type: 'simple-json' })
  description!: object;

  @Column({ type: 'simple-json' })
  highlights!: object;

  @Column({ type: 'simple-json', nullable: true })
  weather!: object | null;

  @Column({ type: 'varchar2', length: 10, nullable: true })
  currency!: string | null;

  @Column({ type: 'double precision' })
  latitude!: number;

  @Column({ type: 'double precision' })
  longitude!: number;

  @Column({ type: 'clob', nullable: true })
  imageUrl!: string | null;

  @Column({ type: 'smallint', default: 0, transformer: booleanTransformer })
  published!: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;
}
