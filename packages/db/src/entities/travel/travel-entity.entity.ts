import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { CuidEntity } from '../base/cuid-entity.ts';
import { TravelConversation } from './travel-conversation.entity.ts';

@Entity('TravelEntity')
@Index(['conversationId'])
export class TravelEntity extends CuidEntity {
  @Column({ type: 'varchar2', length: 36 })
  conversationId!: string;

  @Column({ type: 'varchar2', length: 50 })
  type!: string;

  @Column({ type: 'varchar2', length: 500 })
  name!: string;

  @Column({ type: 'double precision', nullable: true })
  latitude!: number | null;

  @Column({ type: 'double precision', nullable: true })
  longitude!: number | null;

  @Column({ type: 'simple-json' })
  metadata!: object;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @ManyToOne(
    () => TravelConversation,
    (conv) => conv.entities,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'conversationId' })
  conversation!: TravelConversation;
}
