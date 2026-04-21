import { booleanTransformer } from '../base/transformers.js';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';
import { CuidEntity } from '../base/cuid-entity.ts';
import { AffiliateEvent } from '../affiliate/affiliate-event.entity.ts';
import { AffiliatePreferenceAuditLog } from '../affiliate/affiliate-preference-audit-log.entity.ts';
import { AgodaConsentLog } from '../agoda/agoda-consent-log.entity.ts';
import { Accommodation } from '../core/accommodation.entity.ts';
import { CheckLog } from '../core/check-log.entity.ts';
import { Subscription } from '../billing/subscription.entity.ts';
import { PlatformSelector } from '../selector/platform-selector.entity.ts';
import { PlatformPattern } from '../selector/platform-pattern.entity.ts';
import { SelectorChangeLog } from '../selector/selector-change-log.entity.ts';
import { SettingsChangeLog } from '../settings/settings-change-log.entity.ts';
import { TravelConversation } from '../travel/travel-conversation.entity.ts';
import { Account } from './account.entity.ts';
import { Session } from './session.entity.ts';
import { AuditLog } from '../rbac/audit-log.entity.ts';
import { Plan } from '../rbac/plan.entity.ts';
import { Role } from '../rbac/role.entity.ts';
import { CaseMessage } from '../case/case-message.entity.ts';

@Entity('User')
@Index(['email'])
export class User extends CuidEntity {
  @Column({ type: 'varchar2', length: 255, nullable: true })
  name!: string | null;

  @Column({ type: 'varchar2', length: 255, nullable: true, unique: true })
  email!: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  emailVerified!: Date | null;

  @Column({ type: 'varchar2', length: 500, nullable: true })
  image!: string | null;

  @Column({ type: 'varchar2', length: 255, nullable: true })
  password!: string | null;

  @Column({ type: 'clob', nullable: true, select: false })
  kakaoAccessToken!: string | null;

  @Column({ type: 'clob', nullable: true, select: false })
  kakaoRefreshToken!: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  kakaoTokenExpiry!: Date | null;

  @Column({ type: 'varchar2', length: 30, nullable: true })
  planId!: string | null;

  @Column({ type: 'varchar2', length: 100, nullable: true })
  timezone!: string | null;

  @Column({ type: 'smallint', default: 1, transformer: booleanTransformer })
  affiliateLinksEnabled!: boolean;

  @Column({ type: 'timestamp with time zone', nullable: true })
  tutorialCompletedAt!: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  tutorialDismissedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;

  @ManyToOne(
    () => Plan,
    (plan) => plan.users,
    { onDelete: 'SET NULL', nullable: true },
  )
  @JoinColumn({ name: 'planId' })
  plan!: Plan | null;

  @ManyToMany(
    () => Role,
    (role) => role.users,
  )
  @JoinTable({
    name: 'UserRole',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'roleId', referencedColumnName: 'id' },
  })
  roles!: Role[];

  @OneToMany(
    () => Account,
    (account) => account.user,
  )
  accounts!: Account[];

  @OneToMany(
    () => Session,
    (session) => session.user,
  )
  sessions!: Session[];

  @OneToMany(
    () => Accommodation,
    (acc) => acc.user,
  )
  accommodations!: Accommodation[];

  @OneToMany(
    () => CheckLog,
    (log) => log.user,
  )
  checkLogs!: CheckLog[];

  @OneToMany(
    () => SettingsChangeLog,
    (log) => log.changedBy,
  )
  settingsChangeLogs!: SettingsChangeLog[];

  @OneToMany(
    () => AuditLog,
    (log) => log.actor,
  )
  auditLogs!: AuditLog[];

  @OneToMany(
    () => AuditLog,
    (log) => log.targetUser,
  )
  auditLogsAsTarget!: AuditLog[];

  @OneToMany(
    () => Subscription,
    (sub) => sub.user,
  )
  subscriptions!: Subscription[];

  @OneToMany(
    () => PlatformSelector,
    (sel) => sel.createdBy,
  )
  createdSelectors!: PlatformSelector[];

  @OneToMany(
    () => PlatformSelector,
    (sel) => sel.updatedBy,
  )
  updatedSelectors!: PlatformSelector[];

  @OneToMany(
    () => PlatformPattern,
    (pat) => pat.createdBy,
  )
  createdPatterns!: PlatformPattern[];

  @OneToMany(
    () => SelectorChangeLog,
    (log) => log.changedBy,
  )
  selectorChangeLogs!: SelectorChangeLog[];

  @OneToMany(
    () => CaseMessage,
    (msg) => msg.sentBy,
  )
  caseMessages!: CaseMessage[];

  @OneToMany(
    () => TravelConversation,
    (conv) => conv.user,
  )
  travelConversations!: TravelConversation[];

  @OneToMany(
    () => AffiliateEvent,
    (evt) => evt.user,
  )
  affiliateEvents!: AffiliateEvent[];

  @OneToMany(
    () => AffiliatePreferenceAuditLog,
    (log) => log.actorUser,
  )
  affiliatePreferenceAuditLogs!: AffiliatePreferenceAuditLog[];

  @OneToMany(
    () => AgodaConsentLog,
    (log) => log.user,
  )
  agodaConsentLogs!: AgodaConsentLog[];
}
