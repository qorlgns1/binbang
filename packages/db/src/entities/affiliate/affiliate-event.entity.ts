import { booleanTransformer } from '../base/transformers.js';
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { CuidEntity } from '../base/cuid-entity.ts';
import { AffiliateAdvertiserCategory, AffiliateEventType } from '../../enums.ts';
import { User } from '../auth/user.entity.ts';
import { TravelConversation } from '../travel/travel-conversation.entity.ts';

@Entity('affiliate_events')
@Index(['provider', 'eventType'])
@Index(['eventType', 'reasonCode'])
@Index(['category', 'eventType'])
@Index(['occurredAt'])
@Index(['conversationId', 'productId'])
export class AffiliateEvent extends CuidEntity {
  @Column({ type: 'varchar2', length: 36, nullable: true })
  conversationId!: string | null;

  @Column({ type: 'varchar2', length: 30, nullable: true })
  userId!: string | null;

  @Column({ type: 'varchar2', length: 100, nullable: true })
  userTimezone!: string | null;

  @Column({ type: 'varchar2', length: 100 })
  provider!: string;

  @Column({ type: 'varchar2', length: 30 })
  eventType!: AffiliateEventType;

  @Column({ type: 'varchar2', length: 100, nullable: true })
  reasonCode!: string | null;

  @Column({ type: 'varchar2', length: 255, nullable: true, unique: true })
  idempotencyKey!: string | null;

  @Column({ type: 'varchar2', length: 255 })
  productId!: string;

  @Column({ type: 'varchar2', length: 500 })
  productName!: string;

  @Column({ type: 'varchar2', length: 30 })
  category!: AffiliateAdvertiserCategory;

  @Column({ type: 'smallint', default: 0, transformer: booleanTransformer })
  isCtaEnabled!: boolean;

  @Column({ type: 'timestamp with time zone', default: () => 'SYSTIMESTAMP' })
  occurredAt!: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @ManyToOne(
    () => TravelConversation,
    (conv) => conv.affiliateEvents,
    {
      onDelete: 'SET NULL',
      nullable: true,
    },
  )
  @JoinColumn({ name: 'conversationId' })
  conversation!: TravelConversation | null;

  @ManyToOne(
    () => User,
    (u) => u.affiliateEvents,
    { onDelete: 'SET NULL', nullable: true },
  )
  @JoinColumn({ name: 'userId' })
  user!: User | null;
}
