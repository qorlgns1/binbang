import { Column, CreateDateColumn, Entity, Index, JoinColumn, OneToOne, UpdateDateColumn } from 'typeorm';
import { CuidEntity } from '../base/cuid-entity.ts';
import { ConversationAffiliateOverride } from '../../enums.ts';
import { TravelConversation } from '../travel/travel-conversation.entity.ts';

@Entity('conversation_preferences')
@Index(['affiliateOverride'])
export class ConversationPreference extends CuidEntity {
  @Column({ type: 'varchar2', length: 36, unique: true })
  conversationId!: string;

  @Column({ type: 'varchar2', length: 20, default: ConversationAffiliateOverride.inherit })
  affiliateOverride!: ConversationAffiliateOverride;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;

  @OneToOne(
    () => TravelConversation,
    (conv) => conv.preference,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'conversationId' })
  conversation!: TravelConversation;
}
