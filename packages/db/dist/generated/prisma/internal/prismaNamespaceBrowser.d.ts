import * as runtime from "@prisma/client/runtime/index-browser";
export type * from '../models';
export type * from './prismaNamespace';
export declare const Decimal: typeof runtime.Decimal;
export declare const NullTypes: {
    DbNull: (new (secret: never) => typeof runtime.DbNull);
    JsonNull: (new (secret: never) => typeof runtime.JsonNull);
    AnyNull: (new (secret: never) => typeof runtime.AnyNull);
};
/**
 * Helper for filtering JSON entries that have `null` on the database (empty on the db)
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const DbNull: import("@prisma/client/runtime/client").DbNullClass;
/**
 * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const JsonNull: import("@prisma/client/runtime/client").JsonNullClass;
/**
 * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const AnyNull: import("@prisma/client/runtime/client").AnyNullClass;
export declare const ModelName: {
    readonly Account: "Account";
    readonly Session: "Session";
    readonly User: "User";
    readonly VerificationToken: "VerificationToken";
    readonly Accommodation: "Accommodation";
    readonly CheckCycle: "CheckCycle";
    readonly CheckLog: "CheckLog";
    readonly WorkerHeartbeat: "WorkerHeartbeat";
    readonly HeartbeatHistory: "HeartbeatHistory";
    readonly SettingsChangeLog: "SettingsChangeLog";
    readonly SystemSettings: "SystemSettings";
    readonly Plan: "Plan";
    readonly PlanQuota: "PlanQuota";
    readonly Role: "Role";
    readonly Permission: "Permission";
    readonly AuditLog: "AuditLog";
    readonly Subscription: "Subscription";
    readonly PlatformSelector: "PlatformSelector";
    readonly PlatformPattern: "PlatformPattern";
    readonly SelectorChangeLog: "SelectorChangeLog";
};
export type ModelName = (typeof ModelName)[keyof typeof ModelName];
export declare const TransactionIsolationLevel: {
    readonly ReadUncommitted: "ReadUncommitted";
    readonly ReadCommitted: "ReadCommitted";
    readonly RepeatableRead: "RepeatableRead";
    readonly Serializable: "Serializable";
};
export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel];
export declare const AccountScalarFieldEnum: {
    readonly id: "id";
    readonly userId: "userId";
    readonly type: "type";
    readonly provider: "provider";
    readonly providerAccountId: "providerAccountId";
    readonly refresh_token: "refresh_token";
    readonly access_token: "access_token";
    readonly expires_at: "expires_at";
    readonly token_type: "token_type";
    readonly scope: "scope";
    readonly id_token: "id_token";
    readonly session_state: "session_state";
    readonly refresh_token_expires_in: "refresh_token_expires_in";
};
export type AccountScalarFieldEnum = (typeof AccountScalarFieldEnum)[keyof typeof AccountScalarFieldEnum];
export declare const SessionScalarFieldEnum: {
    readonly id: "id";
    readonly sessionToken: "sessionToken";
    readonly userId: "userId";
    readonly expires: "expires";
};
export type SessionScalarFieldEnum = (typeof SessionScalarFieldEnum)[keyof typeof SessionScalarFieldEnum];
export declare const UserScalarFieldEnum: {
    readonly id: "id";
    readonly name: "name";
    readonly email: "email";
    readonly emailVerified: "emailVerified";
    readonly image: "image";
    readonly password: "password";
    readonly kakaoAccessToken: "kakaoAccessToken";
    readonly kakaoRefreshToken: "kakaoRefreshToken";
    readonly kakaoTokenExpiry: "kakaoTokenExpiry";
    readonly planId: "planId";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum];
export declare const VerificationTokenScalarFieldEnum: {
    readonly identifier: "identifier";
    readonly token: "token";
    readonly expires: "expires";
};
export type VerificationTokenScalarFieldEnum = (typeof VerificationTokenScalarFieldEnum)[keyof typeof VerificationTokenScalarFieldEnum];
export declare const AccommodationScalarFieldEnum: {
    readonly id: "id";
    readonly userId: "userId";
    readonly name: "name";
    readonly platform: "platform";
    readonly url: "url";
    readonly checkIn: "checkIn";
    readonly checkOut: "checkOut";
    readonly adults: "adults";
    readonly rooms: "rooms";
    readonly isActive: "isActive";
    readonly lastCheck: "lastCheck";
    readonly lastStatus: "lastStatus";
    readonly lastPrice: "lastPrice";
    readonly lastPriceAmount: "lastPriceAmount";
    readonly lastPriceCurrency: "lastPriceCurrency";
    readonly platformId: "platformId";
    readonly platformName: "platformName";
    readonly platformImage: "platformImage";
    readonly platformDescription: "platformDescription";
    readonly addressCountry: "addressCountry";
    readonly addressRegion: "addressRegion";
    readonly addressLocality: "addressLocality";
    readonly postalCode: "postalCode";
    readonly streetAddress: "streetAddress";
    readonly ratingValue: "ratingValue";
    readonly reviewCount: "reviewCount";
    readonly latitude: "latitude";
    readonly longitude: "longitude";
    readonly platformMetadata: "platformMetadata";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type AccommodationScalarFieldEnum = (typeof AccommodationScalarFieldEnum)[keyof typeof AccommodationScalarFieldEnum];
export declare const CheckCycleScalarFieldEnum: {
    readonly id: "id";
    readonly startedAt: "startedAt";
    readonly completedAt: "completedAt";
    readonly durationMs: "durationMs";
    readonly totalCount: "totalCount";
    readonly successCount: "successCount";
    readonly errorCount: "errorCount";
    readonly concurrency: "concurrency";
    readonly browserPoolSize: "browserPoolSize";
    readonly navigationTimeoutMs: "navigationTimeoutMs";
    readonly contentWaitMs: "contentWaitMs";
    readonly maxRetries: "maxRetries";
    readonly createdAt: "createdAt";
};
export type CheckCycleScalarFieldEnum = (typeof CheckCycleScalarFieldEnum)[keyof typeof CheckCycleScalarFieldEnum];
export declare const CheckLogScalarFieldEnum: {
    readonly id: "id";
    readonly accommodationId: "accommodationId";
    readonly userId: "userId";
    readonly status: "status";
    readonly price: "price";
    readonly priceAmount: "priceAmount";
    readonly priceCurrency: "priceCurrency";
    readonly errorMessage: "errorMessage";
    readonly notificationSent: "notificationSent";
    readonly checkIn: "checkIn";
    readonly checkOut: "checkOut";
    readonly pricePerNight: "pricePerNight";
    readonly cycleId: "cycleId";
    readonly durationMs: "durationMs";
    readonly retryCount: "retryCount";
    readonly previousStatus: "previousStatus";
    readonly createdAt: "createdAt";
};
export type CheckLogScalarFieldEnum = (typeof CheckLogScalarFieldEnum)[keyof typeof CheckLogScalarFieldEnum];
export declare const WorkerHeartbeatScalarFieldEnum: {
    readonly id: "id";
    readonly startedAt: "startedAt";
    readonly lastHeartbeatAt: "lastHeartbeatAt";
    readonly isProcessing: "isProcessing";
    readonly schedule: "schedule";
    readonly accommodationsChecked: "accommodationsChecked";
    readonly lastCycleErrors: "lastCycleErrors";
    readonly lastCycleDurationMs: "lastCycleDurationMs";
    readonly updatedAt: "updatedAt";
};
export type WorkerHeartbeatScalarFieldEnum = (typeof WorkerHeartbeatScalarFieldEnum)[keyof typeof WorkerHeartbeatScalarFieldEnum];
export declare const HeartbeatHistoryScalarFieldEnum: {
    readonly id: "id";
    readonly timestamp: "timestamp";
    readonly status: "status";
    readonly isProcessing: "isProcessing";
    readonly uptime: "uptime";
    readonly workerId: "workerId";
};
export type HeartbeatHistoryScalarFieldEnum = (typeof HeartbeatHistoryScalarFieldEnum)[keyof typeof HeartbeatHistoryScalarFieldEnum];
export declare const SettingsChangeLogScalarFieldEnum: {
    readonly id: "id";
    readonly settingKey: "settingKey";
    readonly oldValue: "oldValue";
    readonly newValue: "newValue";
    readonly changedById: "changedById";
    readonly createdAt: "createdAt";
};
export type SettingsChangeLogScalarFieldEnum = (typeof SettingsChangeLogScalarFieldEnum)[keyof typeof SettingsChangeLogScalarFieldEnum];
export declare const SystemSettingsScalarFieldEnum: {
    readonly key: "key";
    readonly value: "value";
    readonly type: "type";
    readonly category: "category";
    readonly description: "description";
    readonly updatedAt: "updatedAt";
};
export type SystemSettingsScalarFieldEnum = (typeof SystemSettingsScalarFieldEnum)[keyof typeof SystemSettingsScalarFieldEnum];
export declare const PlanScalarFieldEnum: {
    readonly id: "id";
    readonly name: "name";
    readonly description: "description";
    readonly price: "price";
    readonly interval: "interval";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type PlanScalarFieldEnum = (typeof PlanScalarFieldEnum)[keyof typeof PlanScalarFieldEnum];
export declare const PlanQuotaScalarFieldEnum: {
    readonly id: "id";
    readonly planId: "planId";
    readonly key: "key";
    readonly value: "value";
};
export type PlanQuotaScalarFieldEnum = (typeof PlanQuotaScalarFieldEnum)[keyof typeof PlanQuotaScalarFieldEnum];
export declare const RoleScalarFieldEnum: {
    readonly id: "id";
    readonly name: "name";
    readonly description: "description";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type RoleScalarFieldEnum = (typeof RoleScalarFieldEnum)[keyof typeof RoleScalarFieldEnum];
export declare const PermissionScalarFieldEnum: {
    readonly id: "id";
    readonly action: "action";
    readonly description: "description";
    readonly createdAt: "createdAt";
};
export type PermissionScalarFieldEnum = (typeof PermissionScalarFieldEnum)[keyof typeof PermissionScalarFieldEnum];
export declare const AuditLogScalarFieldEnum: {
    readonly id: "id";
    readonly actorId: "actorId";
    readonly targetId: "targetId";
    readonly entityType: "entityType";
    readonly action: "action";
    readonly oldValue: "oldValue";
    readonly newValue: "newValue";
    readonly ipAddress: "ipAddress";
    readonly createdAt: "createdAt";
};
export type AuditLogScalarFieldEnum = (typeof AuditLogScalarFieldEnum)[keyof typeof AuditLogScalarFieldEnum];
export declare const SubscriptionScalarFieldEnum: {
    readonly id: "id";
    readonly userId: "userId";
    readonly planId: "planId";
    readonly status: "status";
    readonly currentPeriodStart: "currentPeriodStart";
    readonly currentPeriodEnd: "currentPeriodEnd";
    readonly canceledAt: "canceledAt";
    readonly cancelReason: "cancelReason";
    readonly paymentProvider: "paymentProvider";
    readonly externalSubscriptionId: "externalSubscriptionId";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type SubscriptionScalarFieldEnum = (typeof SubscriptionScalarFieldEnum)[keyof typeof SubscriptionScalarFieldEnum];
export declare const PlatformSelectorScalarFieldEnum: {
    readonly id: "id";
    readonly platform: "platform";
    readonly category: "category";
    readonly name: "name";
    readonly selector: "selector";
    readonly extractorCode: "extractorCode";
    readonly priority: "priority";
    readonly isActive: "isActive";
    readonly description: "description";
    readonly createdById: "createdById";
    readonly updatedById: "updatedById";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type PlatformSelectorScalarFieldEnum = (typeof PlatformSelectorScalarFieldEnum)[keyof typeof PlatformSelectorScalarFieldEnum];
export declare const PlatformPatternScalarFieldEnum: {
    readonly id: "id";
    readonly platform: "platform";
    readonly patternType: "patternType";
    readonly pattern: "pattern";
    readonly locale: "locale";
    readonly isActive: "isActive";
    readonly priority: "priority";
    readonly createdById: "createdById";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type PlatformPatternScalarFieldEnum = (typeof PlatformPatternScalarFieldEnum)[keyof typeof PlatformPatternScalarFieldEnum];
export declare const SelectorChangeLogScalarFieldEnum: {
    readonly id: "id";
    readonly entityType: "entityType";
    readonly entityId: "entityId";
    readonly action: "action";
    readonly field: "field";
    readonly oldValue: "oldValue";
    readonly newValue: "newValue";
    readonly changedById: "changedById";
    readonly createdAt: "createdAt";
};
export type SelectorChangeLogScalarFieldEnum = (typeof SelectorChangeLogScalarFieldEnum)[keyof typeof SelectorChangeLogScalarFieldEnum];
export declare const SortOrder: {
    readonly asc: "asc";
    readonly desc: "desc";
};
export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];
export declare const NullableJsonNullValueInput: {
    readonly DbNull: import("@prisma/client/runtime/client").DbNullClass;
    readonly JsonNull: import("@prisma/client/runtime/client").JsonNullClass;
};
export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput];
export declare const QueryMode: {
    readonly default: "default";
    readonly insensitive: "insensitive";
};
export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode];
export declare const NullsOrder: {
    readonly first: "first";
    readonly last: "last";
};
export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder];
export declare const JsonNullValueFilter: {
    readonly DbNull: import("@prisma/client/runtime/client").DbNullClass;
    readonly JsonNull: import("@prisma/client/runtime/client").JsonNullClass;
    readonly AnyNull: import("@prisma/client/runtime/client").AnyNullClass;
};
export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter];
//# sourceMappingURL=prismaNamespaceBrowser.d.ts.map