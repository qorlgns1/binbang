import { booleanTransformer } from '../base/transformers.js';
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, UpdateDateColumn } from 'typeorm';
import { CuidEntity } from '../base/cuid-entity.ts';
import { Case } from '../case/case.entity.ts';

@Entity('PriceQuote')
@Index(['caseId'])
@Index(['caseId', 'isActive'])
export class PriceQuote extends CuidEntity {
  @Column({ type: 'varchar2', length: 30 })
  caseId!: string;

  @Column({ type: 'varchar2', length: 50 })
  pricingPolicyVersion!: string;

  @Column({ type: 'simple-json' })
  inputsSnapshot!: object;

  @Column({ type: 'simple-json' })
  weightsSnapshot!: object;

  @Column({ type: 'number' })
  computedAmountKrw!: number;

  @Column({ type: 'number' })
  roundedAmountKrw!: number;

  @Column({ type: 'clob' })
  changeReason!: string;

  @Column({ type: 'smallint', default: 1, transformer: booleanTransformer })
  isActive!: boolean;

  @Column({ type: 'varchar2', length: 30 })
  createdBy!: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;

  @ManyToOne(
    () => Case,
    (c) => c.priceQuotes,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'caseId' })
  case!: Case;
}
