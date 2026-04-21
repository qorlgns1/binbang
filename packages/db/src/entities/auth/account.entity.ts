import { Column, Entity, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { CuidEntity } from '../base/cuid-entity.ts';
import { User } from './user.entity.ts';

@Entity('Account')
@Unique(['provider', 'providerAccountId'])
export class Account extends CuidEntity {
  @Column({ type: 'varchar2', length: 30 })
  userId!: string;

  @Column({ type: 'varchar2', length: 100 })
  type!: string;

  @Column({ type: 'varchar2', length: 100 })
  provider!: string;

  @Column({ type: 'varchar2', length: 255 })
  providerAccountId!: string;

  @Column({ type: 'clob', nullable: true })
  refresh_token!: string | null;

  @Column({ type: 'clob', nullable: true })
  access_token!: string | null;

  @Column({ type: 'number', nullable: true })
  expires_at!: number | null;

  @Column({ type: 'varchar2', length: 100, nullable: true })
  token_type!: string | null;

  @Column({ type: 'varchar2', length: 255, nullable: true })
  scope!: string | null;

  @Column({ type: 'clob', nullable: true })
  id_token!: string | null;

  @Column({ type: 'varchar2', length: 255, nullable: true })
  session_state!: string | null;

  @Column({ type: 'number', nullable: true })
  refresh_token_expires_in!: number | null;

  @ManyToOne(
    () => User,
    (user) => user.accounts,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'userId' })
  user!: User;
}
