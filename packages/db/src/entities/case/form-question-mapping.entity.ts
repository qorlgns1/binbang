import { booleanTransformer } from '../base/transformers.js';
import { Column, CreateDateColumn, Entity, Index, Unique, UpdateDateColumn } from 'typeorm';
import { CuidEntity } from '../base/cuid-entity.ts';
import { FormQuestionField } from '../../enums.ts';

@Entity('FormQuestionMapping')
@Unique(['formKey', 'field'])
@Index(['formKey', 'isActive'])
@Index(['isActive'])
export class FormQuestionMapping extends CuidEntity {
  @Column({ type: 'varchar2', length: 50, default: '*' })
  formKey!: string;

  @Column({ type: 'varchar2', length: 30 })
  field!: FormQuestionField;

  @Column({ type: 'varchar2', length: 255, nullable: true })
  questionItemId!: string | null;

  @Column({ type: 'varchar2', length: 500 })
  questionTitle!: string;

  @Column({ type: 'varchar2', length: 500, nullable: true })
  expectedAnswer!: string | null;

  @Column({ type: 'smallint', default: 1, transformer: booleanTransformer })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;
}
