import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { CuidEntity } from '../base/cuid-entity.ts';
import { User } from '../auth/user.entity.ts';

@Entity('AuditLog')
@Index(['actorId'])
@Index(['targetId'])
@Index(['createdAt'])
export class AuditLog extends CuidEntity {
  @Column({ type: 'varchar2', length: 30, nullable: true })
  actorId!: string | null;

  @Column({ type: 'varchar2', length: 30 })
  targetId!: string;

  @Column({ type: 'varchar2', length: 100 })
  entityType!: string;

  @Column({ type: 'varchar2', length: 100 })
  action!: string;

  @Column({ type: 'simple-json', nullable: true })
  oldValue!: object | null;

  @Column({ type: 'simple-json', nullable: true })
  newValue!: object | null;

  @Column({ type: 'varchar2', length: 50, nullable: true })
  ipAddress!: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @ManyToOne(
    () => User,
    (user) => user.auditLogs,
    { onDelete: 'SET NULL', nullable: true },
  )
  @JoinColumn({ name: 'actorId' })
  actor!: User | null;

  @ManyToOne(
    () => User,
    (user) => user.auditLogsAsTarget,
    { onDelete: 'CASCADE', nullable: true },
  )
  @JoinColumn({ name: 'targetId' })
  targetUser!: User | null;
}
