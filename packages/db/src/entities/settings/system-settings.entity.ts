import { Column, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('SystemSettings')
@Index(['category'])
export class SystemSettings {
  @PrimaryColumn({ type: 'varchar2', length: 100 })
  key!: string;

  @Column({ type: 'varchar2', length: 2000 })
  value!: string;

  @Column({ type: 'varchar2', length: 20, default: 'string' })
  type!: string;

  @Column({ type: 'varchar2', length: 50 })
  category!: string;

  @Column({ type: 'varchar2', length: 500, nullable: true })
  description!: string | null;

  @Column({ type: 'varchar2', length: 50, nullable: true })
  minValue!: string | null;

  @Column({ type: 'varchar2', length: 50, nullable: true })
  maxValue!: string | null;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;
}
