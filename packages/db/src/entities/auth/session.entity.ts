import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { CuidEntity } from '../base/cuid-entity.ts';
import { User } from './user.entity.ts';

@Entity('Session')
export class Session extends CuidEntity {
  @Column({ type: 'varchar2', length: 255, unique: true })
  sessionToken!: string;

  @Column({ type: 'varchar2', length: 30 })
  userId!: string;

  @Column({ type: 'timestamp with time zone' })
  expires!: Date;

  @ManyToOne(
    () => User,
    (user) => user.sessions,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'userId' })
  user!: User;
}
