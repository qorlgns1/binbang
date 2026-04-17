import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { CuidEntity } from '../base/cuid-entity.ts';
import { ConversationAffiliateOverride } from '../../enums.ts';
import { User } from '../auth/user.entity.ts';
import { TravelConversation } from '../travel/travel-conversation.entity.ts';

@Entity('affiliate_preference_audit_logs')
@Index(['conversationId', 'changedAt'])
@Index(['changedAt'])
export class AffiliatePreferenceAuditLog extends CuidEntity {
  @Column({ type: 'varchar2', length: 30 })
  conversationId!: string;

  @Column({ type: 'varchar2', length: 30, nullable: true })
  actorUserId!: string | null;

  @Column({ type: 'varchar2', length: 20 })
  fromValue!: ConversationAffiliateOverride;

  @Column({ type: 'varchar2', length: 20 })
  toValue!: ConversationAffiliateOverride;

  @Column({ type: 'timestamp with time zone', default: () => 'SYSTIMESTAMP' })
  changedAt!: Date;

  @ManyToOne(
    () => TravelConversation,
    (conv) => conv.affiliatePreferenceAuditLogs,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'conversationId' })
  conversation!: TravelConversation;

  @ManyToOne(
    () => User,
    (u) => u.affiliatePreferenceAuditLogs,
    {
      onDelete: 'SET NULL',
      nullable: true,
    },
  )
  @JoinColumn({ name: 'actorUserId' })
  actorUser!: User | null;
}
