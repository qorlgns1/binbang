import 'dotenv/config';

import oracledb from 'oracledb';
import { Client as PgClient } from 'pg';

type PhaseName = 'reference' | 'auth' | 'accommodation_agoda' | 'check_case_billing' | 'travel_affiliate' | 'logs';

interface TableSpec {
  phase: PhaseName;
  table: string;
  keys: string[];
  identityColumn?: string;
  sourceTable?: string;
  sourceColumns?: Record<string, string>;
}

const PHASES: readonly PhaseName[] = [
  'reference',
  'auth',
  'accommodation_agoda',
  'check_case_billing',
  'travel_affiliate',
  'logs',
] as const;

const DEFAULT_BATCH_SIZE = 1000;

const TABLES: readonly TableSpec[] = [
  { phase: 'reference', table: 'Role', keys: ['id'] },
  { phase: 'reference', table: 'Permission', keys: ['id'] },
  {
    phase: 'reference',
    table: 'RolePermission',
    keys: ['roleId', 'permissionId'],
    sourceTable: '_PermissionToRole',
    sourceColumns: {
      permissionId: 'A',
      roleId: 'B',
    },
  },
  { phase: 'reference', table: 'Plan', keys: ['id'] },
  {
    phase: 'reference',
    table: 'PlanRole',
    keys: ['planId', 'roleId'],
    sourceTable: '_PlanToRole',
    sourceColumns: {
      planId: 'A',
      roleId: 'B',
    },
  },
  { phase: 'reference', table: 'PlanQuota', keys: ['id'] },
  { phase: 'reference', table: 'SystemSettings', keys: ['key'] },
  { phase: 'reference', table: 'FormQuestionMapping', keys: ['id'] },
  { phase: 'reference', table: 'PlatformSelector', keys: ['id'] },
  { phase: 'reference', table: 'PlatformPattern', keys: ['id'] },
  { phase: 'reference', table: 'Destination', keys: ['id'] },

  { phase: 'auth', table: 'User', keys: ['id'] },
  {
    phase: 'auth',
    table: 'UserRole',
    keys: ['userId', 'roleId'],
    sourceTable: '_RoleToUser',
    sourceColumns: {
      roleId: 'A',
      userId: 'B',
    },
  },
  { phase: 'auth', table: 'Account', keys: ['id'] },
  { phase: 'auth', table: 'Session', keys: ['id'] },
  { phase: 'auth', table: 'VerificationToken', keys: ['identifier'] },
  { phase: 'auth', table: 'Subscription', keys: ['id'] },

  { phase: 'accommodation_agoda', table: 'Accommodation', keys: ['id'] },
  { phase: 'accommodation_agoda', table: 'agoda_hotels', keys: ['hotelId'] },
  { phase: 'accommodation_agoda', table: 'agoda_poll_runs', keys: ['id'], identityColumn: 'id' },
  { phase: 'accommodation_agoda', table: 'agoda_room_snapshots', keys: ['id'], identityColumn: 'id' },
  { phase: 'accommodation_agoda', table: 'agoda_alert_events', keys: ['id'], identityColumn: 'id' },
  { phase: 'accommodation_agoda', table: 'agoda_notifications', keys: ['id'], identityColumn: 'id' },
  { phase: 'accommodation_agoda', table: 'agoda_consent_logs', keys: ['id'], identityColumn: 'id' },

  { phase: 'check_case_billing', table: 'WorkerHeartbeat', keys: ['id'] },
  { phase: 'check_case_billing', table: 'HeartbeatHistory', keys: ['id'], identityColumn: 'id' },
  { phase: 'check_case_billing', table: 'CheckCycle', keys: ['id'] },
  { phase: 'check_case_billing', table: 'CheckLog', keys: ['id'] },
  { phase: 'check_case_billing', table: 'FormSubmission', keys: ['id'] },
  { phase: 'check_case_billing', table: 'Case', keys: ['id'] },
  { phase: 'check_case_billing', table: 'PriceQuote', keys: ['id'] },
  { phase: 'check_case_billing', table: 'CaseStatusLog', keys: ['id'] },
  { phase: 'check_case_billing', table: 'ConditionMetEvent', keys: ['id'] },
  { phase: 'check_case_billing', table: 'BillingEvent', keys: ['id'] },
  { phase: 'check_case_billing', table: 'CaseNotification', keys: ['id'] },
  { phase: 'check_case_billing', table: 'CaseMessage', keys: ['id'] },

  { phase: 'travel_affiliate', table: 'TravelConversation', keys: ['id'] },
  { phase: 'travel_affiliate', table: 'TravelMessage', keys: ['id'] },
  { phase: 'travel_affiliate', table: 'TravelEntity', keys: ['id'] },
  { phase: 'travel_affiliate', table: 'conversation_preferences', keys: ['id'] },
  { phase: 'travel_affiliate', table: 'affiliate_advertisers', keys: ['id'] },
  { phase: 'travel_affiliate', table: 'affiliate_events', keys: ['id'] },
  { phase: 'travel_affiliate', table: 'affiliate_preference_audit_logs', keys: ['id'] },
  { phase: 'travel_affiliate', table: 'affiliate_audit_job_states', keys: ['jobName'] },
  { phase: 'travel_affiliate', table: 'affiliate_audit_purge_runs', keys: ['id'] },

  { phase: 'logs', table: 'AuditLog', keys: ['id'] },
  { phase: 'logs', table: 'SettingsChangeLog', keys: ['id'] },
  { phase: 'logs', table: 'SelectorChangeLog', keys: ['id'] },
  { phase: 'logs', table: 'LandingEvent', keys: ['id'] },
  { phase: 'logs', table: 'PublicProperty', keys: ['id'] },
  { phase: 'logs', table: 'PublicAvailabilitySnapshot', keys: ['id'] },
  { phase: 'logs', table: 'PublicAvailabilityPrediction', keys: ['id'] },
] as const;

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

function toBindName(index: number): string {
  return `b${index}`;
}

function buildSourceValueExpression(spec: TableSpec, column: string): string {
  if (spec.table === 'TravelMessage' && column === 'content') {
    return `COALESCE(TO_CLOB(source.${quoteIdentifier(column)}), EMPTY_CLOB())`;
  }

  return `source.${quoteIdentifier(column)}`;
}

function parseArgs(argv: string[]): { dryRun: boolean; from: PhaseName; batchSize: number } {
  let dryRun = false;
  let from: PhaseName = PHASES[0];

  for (const arg of argv) {
    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }

    if (arg.startsWith('--from=')) {
      const value = arg.slice('--from='.length) as PhaseName;
      if (!PHASES.includes(value)) {
        throw new Error(`Unknown phase: ${value}`);
      }
      from = value;
      continue;
    }
  }

  return {
    dryRun,
    from,
    batchSize: DEFAULT_BATCH_SIZE,
  };
}

function normalizeValue(value: unknown): unknown {
  if (value === undefined) return null;
  if (value instanceof Date) return value;
  if (Buffer.isBuffer(value)) return value.toString('utf8');
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (Array.isArray(value)) return JSON.stringify(value);
  if (value && typeof value === 'object') return JSON.stringify(value);
  return value;
}

function normalizeRows(rows: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  return rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, normalizeValue(value)])));
}

function buildMergeStatement(
  spec: TableSpec,
  columns: string[],
): { sql: string; bindNameByColumn: Record<string, string> } {
  const quotedTable = quoteIdentifier(spec.table);
  const bindNameByColumn = Object.fromEntries(columns.map((column, index) => [column, toBindName(index)]));
  const selectColumns = columns.map((column) => `:${bindNameByColumn[column]} ${quoteIdentifier(column)}`).join(', ');
  const onClause = spec.keys
    .map((key) => `target.${quoteIdentifier(key)} = source.${quoteIdentifier(key)}`)
    .join(' AND ');

  const updateColumns = columns.filter((column) => !spec.keys.includes(column));
  const updateClause =
    updateColumns.length > 0
      ? `WHEN MATCHED THEN UPDATE SET ${updateColumns
          .map((column) => `target.${quoteIdentifier(column)} = ${buildSourceValueExpression(spec, column)}`)
          .join(', ')}`
      : '';

  return {
    bindNameByColumn,
    sql: `
    MERGE INTO ${quotedTable} target
    USING (SELECT ${selectColumns} FROM DUAL) source
      ON (${onClause})
    ${updateClause}
    WHEN NOT MATCHED THEN
      INSERT (${columns.map(quoteIdentifier).join(', ')})
      VALUES (${columns.map((column) => buildSourceValueExpression(spec, column)).join(', ')})
  `,
  };
}

async function fetchRowCount(client: PgClient, table: string): Promise<number> {
  const sql = `SELECT COUNT(*)::int AS count FROM ${quoteIdentifier(table)}`;
  const result = await client.query<{ count: number }>(sql);
  return result.rows[0]?.count ?? 0;
}

async function fetchRows(
  client: PgClient,
  spec: TableSpec,
  batchSize: number,
  offset: number,
): Promise<Array<Record<string, unknown>>> {
  const selectList = spec.sourceColumns
    ? Object.entries(spec.sourceColumns)
        .map(([targetColumn, sourceColumn]) => `${quoteIdentifier(sourceColumn)} AS ${quoteIdentifier(targetColumn)}`)
        .join(', ')
    : '*';
  const orderBy = spec.keys.map(quoteIdentifier).join(', ');
  const sourceTable = spec.sourceTable ?? spec.table;
  const sql = `SELECT ${selectList} FROM ${quoteIdentifier(sourceTable)} ORDER BY ${orderBy} OFFSET $1 LIMIT $2`;
  const result = await client.query(sql, [offset, batchSize]);
  return result.rows as Array<Record<string, unknown>>;
}

async function syncIdentityColumn(connection: any, table: string, column: string): Promise<void> {
  await connection.execute(`
    ALTER TABLE ${quoteIdentifier(table)}
    MODIFY (${quoteIdentifier(column)} GENERATED BY DEFAULT ON NULL AS IDENTITY (START WITH LIMIT VALUE))
  `);
}

async function migrateTable(
  pgClient: PgClient,
  oracleConnection: any,
  spec: TableSpec,
  batchSize: number,
  dryRun: boolean,
): Promise<void> {
  const total = await fetchRowCount(pgClient, spec.sourceTable ?? spec.table);
  console.log(`\n[${spec.phase}] ${spec.table}: ${total} rows`);

  if (dryRun || total === 0) {
    return;
  }

  for (let offset = 0; offset < total; offset += batchSize) {
    const rows = normalizeRows(await fetchRows(pgClient, spec, batchSize, offset));
    if (rows.length === 0) {
      continue;
    }

    const columns = Object.keys(rows[0]);
    const { sql, bindNameByColumn } = buildMergeStatement(spec, columns);
    const bindRows = rows.map((row) =>
      Object.fromEntries(columns.map((column) => [bindNameByColumn[column], row[column]])),
    );

    await oracleConnection.executeMany(sql, bindRows, {
      autoCommit: false,
      batchErrors: false,
    });
    await oracleConnection.commit();

    console.log(`   processed ${Math.min(offset + rows.length, total)}/${total}`);
  }

  if (spec.identityColumn) {
    await syncIdentityColumn(oracleConnection, spec.table, spec.identityColumn);
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const startPhaseIndex = PHASES.indexOf(args.from);
  const selectedPhases = PHASES.slice(startPhaseIndex);

  const sourceUrl = process.env.PG_SOURCE_DATABASE_URL?.trim();
  const oracleUser = process.env.ORACLE_USER?.trim();
  const oraclePassword = process.env.ORACLE_PASSWORD?.trim();
  const oracleConnectString = process.env.ORACLE_CONNECT_STRING?.trim();

  if (!sourceUrl) {
    throw new Error('PG_SOURCE_DATABASE_URL is required.');
  }
  if (!oracleUser || !oraclePassword || !oracleConnectString) {
    throw new Error('ORACLE_USER, ORACLE_PASSWORD, ORACLE_CONNECT_STRING are required.');
  }

  const pgClient = new PgClient({ connectionString: sourceUrl });
  const oracleConnection = await oracledb.getConnection({
    user: oracleUser,
    password: oraclePassword,
    connectString: oracleConnectString,
  });

  try {
    await pgClient.connect();
    console.log(`Starting PG → Oracle migration${args.dryRun ? ' (dry-run)' : ''}`);
    console.log(`Phases: ${selectedPhases.join(', ')}`);

    for (const phase of selectedPhases) {
      const phaseTables = TABLES.filter((table) => table.phase === phase);
      for (const spec of phaseTables) {
        await migrateTable(pgClient, oracleConnection, spec, args.batchSize, args.dryRun);
      }
    }

    console.log('\n✅ PG → Oracle migration completed.');
  } finally {
    await oracleConnection.close();
    await pgClient.end();
  }
}

main().catch((error) => {
  console.error('❌ PG → Oracle migration failed:', error);
  process.exit(1);
});
