import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { CuidEntity } from '../base/cuid-entity.ts';
import { TravelConversation } from './travel-conversation.entity.ts';

@Entity('TravelMessage')
@Index(['conversationId'])
@Index(['createdAt'])
export class TravelMessage extends CuidEntity {
  @Column({ type: 'varchar2', length: 30 })
  conversationId!: string;

  @Column({ type: 'varchar2', length: 20 })
  role!: string;

  @Column({ type: 'clob' })
  content!: string;

  @Column({ type: 'simple-json', nullable: true })
  toolCalls!: object | null;

  @Column({ type: 'simple-json', nullable: true })
  toolResults!: object | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @ManyToOne(
    () => TravelConversation,
    (conv) => conv.messages,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'conversationId' })
  conversation!: TravelConversation;
}
