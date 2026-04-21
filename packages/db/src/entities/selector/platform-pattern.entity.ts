import { booleanTransformer } from '../base/transformers.js';
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, Unique, UpdateDateColumn } from 'typeorm';
import { CuidEntity } from '../base/cuid-entity.ts';
import { PatternType, Platform } from '../../enums.ts';
import { User } from '../auth/user.entity.ts';

@Entity('PlatformPattern')
@Unique(['platform', 'patternType', 'pattern'])
@Index(['platform', 'patternType', 'isActive'])
export class PlatformPattern extends CuidEntity {
  @Column({ type: 'varchar2', length: 10 })
  platform!: Platform;

  @Column({ type: 'varchar2', length: 20 })
  patternType!: PatternType;

  @Column({ type: 'varchar2', length: 500 })
  pattern!: string;

  @Column({ type: 'varchar2', length: 10, default: 'ko' })
  locale!: string;

  @Column({ type: 'smallint', default: 1, transformer: booleanTransformer })
  isActive!: boolean;

  @Column({ type: 'number', default: 0 })
  priority!: number;

  @Column({ type: 'varchar2', length: 30, nullable: true })
  createdById!: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;

  @ManyToOne(
    () => User,
    (u) => u.createdPatterns,
    { onDelete: 'SET NULL', nullable: true },
  )
  @JoinColumn({ name: 'createdById' })
  createdBy!: User | null;
}
