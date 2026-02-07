import * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "./prismaNamespace";
export type LogOptions<ClientOptions extends Prisma.PrismaClientOptions> = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never;
export interface PrismaClientConstructor {
    /**
   * ## Prisma Client
   *
   * Type-safe database client for TypeScript
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Accounts
   * const accounts = await prisma.account.findMany()
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/client).
   */
    new <Options extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions, LogOpts extends LogOptions<Options> = LogOptions<Options>, OmitOpts extends Prisma.PrismaClientOptions['omit'] = Options extends {
        omit: infer U;
    } ? U : Prisma.PrismaClientOptions['omit'], ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs>(options: Prisma.Subset<Options, Prisma.PrismaClientOptions>): PrismaClient<LogOpts, OmitOpts, ExtArgs>;
}
/**
 * ## Prisma Client
 *
 * Type-safe database client for TypeScript
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Accounts
 * const accounts = await prisma.account.findMany()
 * ```
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export interface PrismaClient<in LogOpts extends Prisma.LogLevel = never, in out OmitOpts extends Prisma.PrismaClientOptions['omit'] = undefined, in out ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['other'];
    };
    $on<V extends LogOpts>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;
    /**
     * Connect with the database
     */
    $connect(): runtime.Types.Utils.JsPromise<void>;
    /**
     * Disconnect from the database
     */
    $disconnect(): runtime.Types.Utils.JsPromise<void>;
    /**
       * Executes a prepared raw query and returns the number of affected rows.
       * @example
       * ```
       * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
       * ```
       *
       * Read more in our [docs](https://pris.ly/d/raw-queries).
       */
    $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;
    /**
     * Executes a raw query and returns the number of affected rows.
     * Susceptible to SQL injections, see documentation.
     * @example
     * ```
     * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
     * ```
     *
     * Read more in our [docs](https://pris.ly/d/raw-queries).
     */
    $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;
    /**
     * Performs a prepared raw query and returns the `SELECT` data.
     * @example
     * ```
     * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
     * ```
     *
     * Read more in our [docs](https://pris.ly/d/raw-queries).
     */
    $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;
    /**
     * Performs a raw query and returns the `SELECT` data.
     * Susceptible to SQL injections, see documentation.
     * @example
     * ```
     * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
     * ```
     *
     * Read more in our [docs](https://pris.ly/d/raw-queries).
     */
    $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;
    /**
     * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
     * @example
     * ```
     * const [george, bob, alice] = await prisma.$transaction([
     *   prisma.user.create({ data: { name: 'George' } }),
     *   prisma.user.create({ data: { name: 'Bob' } }),
     *   prisma.user.create({ data: { name: 'Alice' } }),
     * ])
     * ```
     *
     * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
     */
    $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: {
        isolationLevel?: Prisma.TransactionIsolationLevel;
    }): runtime.Types.Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>;
    $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => runtime.Types.Utils.JsPromise<R>, options?: {
        maxWait?: number;
        timeout?: number;
        isolationLevel?: Prisma.TransactionIsolationLevel;
    }): runtime.Types.Utils.JsPromise<R>;
    $extends: runtime.Types.Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<OmitOpts>, ExtArgs, runtime.Types.Utils.Call<Prisma.TypeMapCb<OmitOpts>, {
        extArgs: ExtArgs;
    }>>;
    /**
 * `prisma.account`: Exposes CRUD operations for the **Account** model.
  * Example usage:
  * ```ts
  * // Fetch zero or more Accounts
  * const accounts = await prisma.account.findMany()
  * ```
  */
    get account(): Prisma.AccountDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.session`: Exposes CRUD operations for the **Session** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more Sessions
      * const sessions = await prisma.session.findMany()
      * ```
      */
    get session(): Prisma.SessionDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.user`: Exposes CRUD operations for the **User** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more Users
      * const users = await prisma.user.findMany()
      * ```
      */
    get user(): Prisma.UserDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.verificationToken`: Exposes CRUD operations for the **VerificationToken** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more VerificationTokens
      * const verificationTokens = await prisma.verificationToken.findMany()
      * ```
      */
    get verificationToken(): Prisma.VerificationTokenDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.accommodation`: Exposes CRUD operations for the **Accommodation** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more Accommodations
      * const accommodations = await prisma.accommodation.findMany()
      * ```
      */
    get accommodation(): Prisma.AccommodationDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.checkCycle`: Exposes CRUD operations for the **CheckCycle** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more CheckCycles
      * const checkCycles = await prisma.checkCycle.findMany()
      * ```
      */
    get checkCycle(): Prisma.CheckCycleDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.checkLog`: Exposes CRUD operations for the **CheckLog** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more CheckLogs
      * const checkLogs = await prisma.checkLog.findMany()
      * ```
      */
    get checkLog(): Prisma.CheckLogDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.workerHeartbeat`: Exposes CRUD operations for the **WorkerHeartbeat** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more WorkerHeartbeats
      * const workerHeartbeats = await prisma.workerHeartbeat.findMany()
      * ```
      */
    get workerHeartbeat(): Prisma.WorkerHeartbeatDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.heartbeatHistory`: Exposes CRUD operations for the **HeartbeatHistory** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more HeartbeatHistories
      * const heartbeatHistories = await prisma.heartbeatHistory.findMany()
      * ```
      */
    get heartbeatHistory(): Prisma.HeartbeatHistoryDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.settingsChangeLog`: Exposes CRUD operations for the **SettingsChangeLog** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more SettingsChangeLogs
      * const settingsChangeLogs = await prisma.settingsChangeLog.findMany()
      * ```
      */
    get settingsChangeLog(): Prisma.SettingsChangeLogDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.systemSettings`: Exposes CRUD operations for the **SystemSettings** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more SystemSettings
      * const systemSettings = await prisma.systemSettings.findMany()
      * ```
      */
    get systemSettings(): Prisma.SystemSettingsDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.plan`: Exposes CRUD operations for the **Plan** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more Plans
      * const plans = await prisma.plan.findMany()
      * ```
      */
    get plan(): Prisma.PlanDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.planQuota`: Exposes CRUD operations for the **PlanQuota** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more PlanQuotas
      * const planQuotas = await prisma.planQuota.findMany()
      * ```
      */
    get planQuota(): Prisma.PlanQuotaDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.role`: Exposes CRUD operations for the **Role** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more Roles
      * const roles = await prisma.role.findMany()
      * ```
      */
    get role(): Prisma.RoleDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.permission`: Exposes CRUD operations for the **Permission** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more Permissions
      * const permissions = await prisma.permission.findMany()
      * ```
      */
    get permission(): Prisma.PermissionDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.auditLog`: Exposes CRUD operations for the **AuditLog** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more AuditLogs
      * const auditLogs = await prisma.auditLog.findMany()
      * ```
      */
    get auditLog(): Prisma.AuditLogDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.subscription`: Exposes CRUD operations for the **Subscription** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more Subscriptions
      * const subscriptions = await prisma.subscription.findMany()
      * ```
      */
    get subscription(): Prisma.SubscriptionDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.platformSelector`: Exposes CRUD operations for the **PlatformSelector** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more PlatformSelectors
      * const platformSelectors = await prisma.platformSelector.findMany()
      * ```
      */
    get platformSelector(): Prisma.PlatformSelectorDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.platformPattern`: Exposes CRUD operations for the **PlatformPattern** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more PlatformPatterns
      * const platformPatterns = await prisma.platformPattern.findMany()
      * ```
      */
    get platformPattern(): Prisma.PlatformPatternDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.selectorChangeLog`: Exposes CRUD operations for the **SelectorChangeLog** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more SelectorChangeLogs
      * const selectorChangeLogs = await prisma.selectorChangeLog.findMany()
      * ```
      */
    get selectorChangeLog(): Prisma.SelectorChangeLogDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
}
export declare function getPrismaClientClass(): PrismaClientConstructor;
//# sourceMappingURL=class.d.ts.map