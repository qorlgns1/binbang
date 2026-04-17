import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, UpdateDateColumn } from 'typeorm';
import { CuidEntity } from '../base/cuid-entity.ts';
import { Permission } from './permission.entity.ts';
import { Plan } from './plan.entity.ts';
import { User } from '../auth/user.entity.ts';

@Entity('Role')
export class Role extends CuidEntity {
  @Column({ type: 'varchar2', length: 50, unique: true })
  name!: string;

  @Column({ type: 'varchar2', length: 500, nullable: true })
  description!: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;

  @ManyToMany(
    () => Permission,
    (perm) => perm.roles,
  )
  @JoinTable({
    name: 'RolePermission',
    joinColumn: { name: 'roleId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permissionId', referencedColumnName: 'id' },
  })
  permissions!: Permission[];

  @ManyToMany(
    () => User,
    (user) => user.roles,
  )
  users!: User[];

  @ManyToMany(
    () => Plan,
    (plan) => plan.roles,
  )
  @JoinTable({
    name: 'PlanRole',
    joinColumn: { name: 'roleId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'planId', referencedColumnName: 'id' },
  })
  plans!: Plan[];
}
