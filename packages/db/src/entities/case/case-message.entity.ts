import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { CuidEntity } from '../base/cuid-entity.ts';
import { User } from '../auth/user.entity.ts';
import { Case } from './case.entity.ts';

@Entity('CaseMessage')
@Index(['caseId'])
@Index(['sentById'])
@Index(['createdAt'])
export class CaseMessage extends CuidEntity {
  @Column({ type: 'varchar2', length: 30 })
  caseId!: string;

  @Column({ type: 'varchar2', length: 100 })
  templateKey!: string;

  @Column({ type: 'varchar2', length: 50 })
  channel!: string;

  @Column({ type: 'clob' })
  content!: string;

  @Column({ type: 'varchar2', length: 30 })
  sentById!: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @ManyToOne(
    () => Case,
    (c) => c.messages,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'caseId' })
  case!: Case;

  @ManyToOne(
    () => User,
    (user) => user.caseMessages,
    {},
  )
  @JoinColumn({ name: 'sentById' })
  sentBy!: User;
}
