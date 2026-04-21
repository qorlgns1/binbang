import { Column, CreateDateColumn, Entity, Index, UpdateDateColumn } from 'typeorm';
import { CuidEntity } from '../base/cuid-entity.ts';
import { AffiliateAdvertiserCategory } from '../../enums.ts';

@Entity('affiliate_advertisers')
@Index(['category'])
export class AffiliateAdvertiser extends CuidEntity {
  @Column({ type: 'number', unique: true })
  advertiserId!: number;

  @Column({ type: 'varchar2', length: 255 })
  name!: string;

  @Column({ type: 'varchar2', length: 30, default: AffiliateAdvertiserCategory.other })
  category!: AffiliateAdvertiserCategory;

  @Column({ type: 'clob', nullable: true })
  notes!: string | null;

  @Column({ type: 'varchar2', length: 50, default: 'awin' })
  source!: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;
}
