import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  UpdateDateColumn,
} from 'typeorm';
import { Cuid36Entity } from '../base/cuid36-entity.ts';
import { User } from '../auth/user.entity.ts';
import { AffiliateEvent } from '../affiliate/affiliate-event.entity.ts';
import { AffiliatePreferenceAuditLog } from '../affiliate/affiliate-preference-audit-log.entity.ts';
import { ConversationPreference } from '../affiliate/conversation-preference.entity.ts';
import { TravelEntity } from './travel-entity.entity.ts';
import { TravelMessage } from './travel-message.entity.ts';

@Entity('TravelConversation')
@Index(['sessionId'])
@Index(['userId'])
export class TravelConversation extends Cuid36Entity {
  @Column({ type: 'varchar2', length: 100 })
  sessionId!: string;

  @Column({ type: 'varchar2', length: 30, nullable: true })
  userId!: string | null;

  @Column({ type: 'varchar2', length: 500, nullable: true })
  title!: string | null;

  @Column({ type: 'number', default: 0 })
  messageCount!: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;

  @ManyToOne(
    () => User,
    (u) => u.travelConversations,
    { onDelete: 'SET NULL', nullable: true },
  )
  @JoinColumn({ name: 'userId' })
  user!: User | null;

  @OneToMany(
    () => TravelMessage,
    (m) => m.conversation,
  )
  messages!: TravelMessage[];

  @OneToMany(
    () => TravelEntity,
    (e) => e.conversation,
  )
  entities!: TravelEntity[];

  @OneToOne(
    () => ConversationPreference,
    (p) => p.conversation,
  )
  preference!: ConversationPreference | null;

  @OneToMany(
    () => AffiliateEvent,
    (e) => e.conversation,
  )
  affiliateEvents!: AffiliateEvent[];

  @OneToMany(
    () => AffiliatePreferenceAuditLog,
    (l) => l.conversation,
  )
  affiliatePreferenceAuditLogs!: AffiliatePreferenceAuditLog[];
}
