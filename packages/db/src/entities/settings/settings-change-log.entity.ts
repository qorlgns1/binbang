import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { CuidEntity } from '../base/cuid-entity.ts';
import { User } from '../auth/user.entity.ts';

@Entity('SettingsChangeLog')
@Index(['settingKey'])
@Index(['createdAt'])
export class SettingsChangeLog extends CuidEntity {
  @Column({ type: 'varchar2', length: 100 })
  settingKey!: string;

  @Column({ type: 'varchar2', length: 2000 })
  oldValue!: string;

  @Column({ type: 'varchar2', length: 2000 })
  newValue!: string;

  @Column({ type: 'varchar2', length: 30 })
  changedById!: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @ManyToOne(
    () => User,
    (u) => u.settingsChangeLogs,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'changedById' })
  changedBy!: User;
}
