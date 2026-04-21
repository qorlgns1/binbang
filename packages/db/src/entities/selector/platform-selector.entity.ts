import { booleanTransformer } from '../base/transformers.js';
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, Unique, UpdateDateColumn } from 'typeorm';
import { CuidEntity } from '../base/cuid-entity.ts';
import { Platform, SelectorCategory } from '../../enums.ts';
import { User } from '../auth/user.entity.ts';

@Entity('PlatformSelector')
@Unique(['platform', 'category', 'name'])
@Index(['platform', 'category', 'isActive'])
@Index(['platform', 'isActive', 'priority'])
export class PlatformSelector extends CuidEntity {
  @Column({ type: 'varchar2', length: 10 })
  platform!: Platform;

  @Column({ type: 'varchar2', length: 20 })
  category!: SelectorCategory;

  @Column({ type: 'varchar2', length: 255 })
  name!: string;

  @Column({ type: 'clob' })
  selector!: string;

  @Column({ type: 'clob', nullable: true })
  extractorCode!: string | null;

  @Column({ type: 'number', default: 0 })
  priority!: number;

  @Column({ type: 'smallint', default: 1, transformer: booleanTransformer })
  isActive!: boolean;

  @Column({ type: 'varchar2', length: 500, nullable: true })
  description!: string | null;

  @Column({ type: 'varchar2', length: 30, nullable: true })
  createdById!: string | null;

  @Column({ type: 'varchar2', length: 30, nullable: true })
  updatedById!: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;

  @ManyToOne(
    () => User,
    (u) => u.createdSelectors,
    { onDelete: 'SET NULL', nullable: true },
  )
  @JoinColumn({ name: 'createdById' })
  createdBy!: User | null;

  @ManyToOne(
    () => User,
    (u) => u.updatedSelectors,
    { onDelete: 'SET NULL', nullable: true },
  )
  @JoinColumn({ name: 'updatedById' })
  updatedBy!: User | null;
}
