import { Column, CreateDateColumn, Entity, ManyToMany } from 'typeorm';
import { CuidEntity } from '../base/cuid-entity.ts';
import { Role } from './role.entity.ts';

@Entity('Permission')
export class Permission extends CuidEntity {
  @Column({ type: 'varchar2', length: 100, unique: true })
  action!: string;

  @Column({ type: 'varchar2', length: 500, nullable: true })
  description!: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @ManyToMany(
    () => Role,
    (role) => role.permissions,
  )
  roles!: Role[];
}
