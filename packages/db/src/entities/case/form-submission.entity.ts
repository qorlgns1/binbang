import { nullableBooleanTransformer } from '../base/transformers.js';
import { Column, CreateDateColumn, Entity, Index, OneToOne, UpdateDateColumn } from 'typeorm';
import { CuidEntity } from '../base/cuid-entity.ts';
import { FormSubmissionStatus } from '../../enums.ts';
import { Case } from './case.entity.ts';

@Entity('FormSubmission')
@Index(['status'])
@Index(['receivedAt'])
export class FormSubmission extends CuidEntity {
  @Column({ type: 'varchar2', length: 255, unique: true })
  responseId!: string;

  @Column({ type: 'varchar2', length: 30, default: FormSubmissionStatus.RECEIVED })
  status!: FormSubmissionStatus;

  @Column({ type: 'simple-json' })
  rawPayload!: object;

  @Column({ type: 'varchar2', length: 50, nullable: true })
  formVersion!: string | null;

  @Column({ type: 'varchar2', length: 50, nullable: true })
  sourceIp!: string | null;

  @Column({ type: 'simple-json', nullable: true })
  extractedFields!: object | null;

  @Column({ type: 'varchar2', length: 500, nullable: true })
  rejectionReason!: string | null;

  @Column({ type: 'smallint', nullable: true, transformer: nullableBooleanTransformer })
  consentBillingOnConditionMet!: boolean | null;

  @Column({ type: 'smallint', nullable: true, transformer: nullableBooleanTransformer })
  consentServiceScope!: boolean | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  consentCapturedAt!: Date | null;

  @Column({ type: 'simple-json', nullable: true })
  consentTexts!: object | null;

  @Column({ type: 'timestamp with time zone', default: () => 'SYSTIMESTAMP' })
  receivedAt!: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;

  @OneToOne(
    () => Case,
    (c) => c.submission,
  )
  case!: Case | null;
}
