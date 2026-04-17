import { Column, Entity, PrimaryColumn, Unique } from 'typeorm';

@Entity('VerificationToken')
@Unique(['identifier', 'token'])
export class VerificationToken {
  @PrimaryColumn({ type: 'varchar2', length: 255 })
  identifier!: string;

  @Column({ type: 'varchar2', length: 255, unique: true })
  token!: string;

  @Column({ type: 'timestamp with time zone' })
  expires!: Date;
}
