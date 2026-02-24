#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

type SourceMode = 'auto' | 'gh' | 'git';
type RunMode = 'shadow' | 'enforced';
type OutputFormat = 'text' | 'json';
type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
type AgentId = 'security' | 'correctness' | 'test-maintainability';
type Category = 'security' | 'correctness' | 'test_maintainability';

type CliOptions = Record<string, string | boolean>;

type RepoInfo = {
  owner: string;
  name: string;
  defaultBranch: string;
};

type PullRequestInfo = {
  number: number;
  title: string;
  url: string;
  baseRef: string;
  headRef: string;
};

type ParsedDiffFile = {
  filePath: string;
  patchLines: string[];
  insertions: number;
  deletions: number;
  filterReason?: string;
};

type SharedDiffFile = {
  filePath: string;
  patch: string;
  truncated: boolean;
};

type CommandResult = {
  code: number;
  stdout: string;
  stderr: string;
  timedOut: boolean;
};

type AgentIssue = {
  agentIssueId: string;
  title: string;
  category: Category;
  severity: Severity;
  confidence: number;
  evidence: {
    filePath: string;
    lineStart: number;
    lineEnd: number;
    snippet: string;
  };
  rationale: string;
  recommendation: string;
  tags?: string[];
};

type AgentResult = {
  agentId: AgentId;
  status: 'success' | 'timeout' | 'error';
  model: string;
  promptVersion: string;
  durationMs: number;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
  issueCount: number;
  issues: AgentIssue[];
  error?: {
    code: string;
    message: string;
  };
  rawOutputPath: string;
};

type MergedIssue = {
  issueId: string;
  title: string;
  category: Category;
  severity: Severity;
  confidence: number;
  evidence: {
    filePath: string;
    lineStart: number;
    lineEnd: number;
    snippet: string;
  };
  rationale: string;
  recommendation: string;
  sourceAgentIds: AgentId[];
  mergedFromIssueIds: string[];
  dedupeRule: 'highest_severity';
  normalizedTitle: string;
  resolutionState: 'open';
};

type Report = {
  version: string;
  runId: string;
  repository: RepoInfo;
  pr: PullRequestInfo;
  mode: RunMode;
  status: 'pass' | 'fail' | 'degraded';
  gate: {
    status: 'pass' | 'fail' | 'not_applicable';
    blockingSeverities: Severity[];
    blockedIssueIds: string[];
    reason: string;
  };
  input: {
    source: 'gh' | 'git';
    changedFiles: number;
    filteredOutFiles: number;
    filterRules: string[];
    diffStats: {
      insertions: number;
      deletions: number;
    };
    truncatedFiles: number;
    maxPatchLines: number;
  };
  config: {
    model: string;
    timeoutSec: number;
    retryMax: number;
    dedupeRule: 'file+line+normalized_title';
    maskSecrets: boolean;
    failSeverities: Severity[];
  };
  agents: AgentResult[];
  issues: MergedIssue[];
  summary: {
    totalIssues: number;
    totalsBySeverity: Record<Severity, number>;
    totalsByCategory: Record<Category, number>;
  };
  artifacts: {
    rootDir: string;
    summaryMarkdownPath: string;
    feedbackTemplatePath: string;
    reportJsonPath: string;
    diffJsonPath: string;
    agentInputDir: string;
    agentInputByAgent: Record<AgentId, string>;
    rawDir: string;
    rawByAgent: Record<AgentId, string>;
  };
  feedbackMetrics: {
    falsePositiveRate: number | null;
    missRate: number | null;
    severityAgreementRate: number | null;
    developerAcceptanceRate: number | null;
  };
  createdAt: string;
  finishedAt: string;
};

const AGENT_IDS: AgentId[] = ['security', 'correctness', 'test-maintainability'];
const CATEGORY_BY_AGENT: Record<AgentId, Category> = {
  security: 'security',
  correctness: 'correctness',
  'test-maintainability': 'test_maintainability',
};
const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
};
const FILTER_RULES = [
  {
    name: 'lock',
    test: (filePath: string) => /(pnpm-lock\.yaml|package-lock\.json|yarn\.lock|Cargo\.lock|\.lock)$/i.test(filePath),
  },
  { name: 'minified', test: (filePath: string) => /\.min\.(js|css)$/i.test(filePath) },
  { name: 'generated', test: (filePath: string) => /(^|\/)(generated|gen)(\/|$)|\.generated\./i.test(filePath) },
  { name: 'vendor', test: (filePath: string) => /(^|\/)vendor(\/|$)/i.test(filePath) },
] as const;
const DEFAULT_FAIL_SEVERITIES: Severity[] = ['critical', 'high'];
const PROMPT_VERSION = '2026-02-23.1';

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[pr-review] ${message}`);
  process.exit(3);
});

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const command = argv[0];
  const options = parseOptions(argv.slice(1));

  if (!command || command === '--help' || command === '-h' || command === 'help') {
    printHelp();
    return;
  }

  if (command === 'run') {
    await runCommand(options);
    return;
  }
  if (command === 'validate') {
    await validateCommand(options);
    return;
  }
  if (command === 'summarize') {
    await summarizeCommand(options);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

function printHelp(): void {
  console.log(
    [
      'Usage:',
      '  pr-review run --pr <number> [options]',
      '  pr-review validate --report <path>',
      '  pr-review summarize --report <path>',
      '',
      'Run options:',
      '  --pr <number>                 Pull request number (required)',
      '  --mode <shadow|enforced>      Default: shadow',
      '  --source <auto|gh|git>        Default: auto',
      '  --base <ref>                  Required for source=git',
      '  --head <ref>                  Required for source=git',
      '  --model <id>                  Default: gpt-5',
      '  --timeout-sec <n>             Default: 60',
      '  --retry <n>                   Default: 1',
      '  --max-patch-lines <n>         Default: 400',
      '  --out <path>                  Default: .codex/reviews',
      '  --format <text|json>          Default: text',
      '  --fail-on-degraded            Exit with code 2 on degraded',
      '',
      'Exit codes:',
      '  0: success',
      '  1: enforced gate fail',
      '  2: degraded (with --fail-on-degraded)',
      '  3: input or runtime error',
      '  4: validation failure',
    ].join('\n'),
  );
}

function parseOptions(argv: string[]): CliOptions {
  const options: CliOptions = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      continue;
    }
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      options[key] = true;
      continue;
    }
    options[key] = next;
    index += 1;
  }
  return options;
}

function getStringOption(options: CliOptions, key: string, fallback?: string): string {
  const value = options[key];
  if (typeof value === 'string') {
    return value;
  }
  if (fallback !== undefined) {
    return fallback;
  }
  throw new Error(`Missing required option --${key}`);
}

function getNumberOption(options: CliOptions, key: string, fallback?: number): number {
  const value = options[key];
  if (typeof value === 'boolean') {
    throw new Error(`Option --${key} needs a number value`);
  }
  if (typeof value === 'string') {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue) || Number.isNaN(numberValue)) {
      throw new Error(`Option --${key} must be a number`);
    }
    return numberValue;
  }
  if (fallback !== undefined) {
    return fallback;
  }
  throw new Error(`Missing required option --${key}`);
}

function getBooleanOption(options: CliOptions, key: string): boolean {
  return options[key] === true;
}

async function runCommand(options: CliOptions): Promise<void> {
  const createdAt = new Date();
  const prNumber = getNumberOption(options, 'pr');
  if (!Number.isInteger(prNumber) || prNumber <= 0) {
    throw new Error('--pr must be a positive integer');
  }

  const mode = getStringOption(options, 'mode', 'shadow') as RunMode;
  if (mode !== 'shadow' && mode !== 'enforced') {
    throw new Error('--mode must be shadow or enforced');
  }

  const source = getStringOption(options, 'source', 'auto') as SourceMode;
  if (source !== 'auto' && source !== 'gh' && source !== 'git') {
    throw new Error('--source must be auto, gh, or git');
  }

  const baseRefOption = typeof options.base === 'string' ? options.base : undefined;
  const headRefOption = typeof options.head === 'string' ? options.head : undefined;
  const model = getStringOption(options, 'model', 'gpt-5');
  const timeoutSec = getNumberOption(options, 'timeout-sec', 60);
  const retryMax = getNumberOption(options, 'retry', 1);
  const maxPatchLines = getNumberOption(options, 'max-patch-lines', 400);
  if (!Number.isInteger(maxPatchLines) || maxPatchLines <= 0) {
    throw new Error('--max-patch-lines must be a positive integer');
  }
  const outputRoot = getStringOption(options, 'out', '.codex/reviews');
  const format = getStringOption(options, 'format', 'text') as OutputFormat;
  const failOnDegraded = getBooleanOption(options, 'fail-on-degraded');

  if (format !== 'text' && format !== 'json') {
    throw new Error('--format must be text or json');
  }

  const runTimestamp = toRunTimestamp(createdAt.toISOString());
  const runId = `pr-${prNumber}-${runTimestamp}`;
  const runDir = path.join(outputRoot, `pr-${prNumber}`, runTimestamp);
  const agentInputDir = path.join(runDir, 'agent-inputs');
  const rawDir = path.join(runDir, 'raw');
  await mkdir(agentInputDir, { recursive: true });
  await mkdir(rawDir, { recursive: true });

  const diffInput = await resolveDiffInput({
    source,
    prNumber,
    baseRef: baseRefOption,
    headRef: headRefOption,
  });

  const parsedFiles = parseUnifiedDiff(diffInput.rawDiff);
  const includedFiles: SharedDiffFile[] = [];
  const filteredFiles: ParsedDiffFile[] = [];
  let truncatedFiles = 0;
  let insertions = 0;
  let deletions = 0;

  for (const file of parsedFiles) {
    const filterRule = FILTER_RULES.find((rule) => rule.test(file.filePath));
    if (filterRule) {
      filteredFiles.push({ ...file, filterReason: filterRule.name });
      continue;
    }

    const patchLines = file.patchLines.slice();
    let truncated = false;
    if (patchLines.length > maxPatchLines) {
      const remaining = patchLines.length - maxPatchLines;
      patchLines.length = maxPatchLines;
      patchLines.push(`... [TRUNCATED ${remaining} lines]`);
      truncated = true;
      truncatedFiles += 1;
    }

    includedFiles.push({
      filePath: file.filePath,
      patch: patchLines.join('\n'),
      truncated,
    });

    insertions += file.insertions;
    deletions += file.deletions;
  }

  const inputDiffPath = path.join(runDir, 'input-diff.json');
  await writeJson(inputDiffPath, {
    source: diffInput.source,
    changedFiles: includedFiles.length,
    filteredOutFiles: filteredFiles.length,
    filterRules: FILTER_RULES.map((rule) => rule.name),
    diffStats: { insertions, deletions },
    truncatedFiles,
    maxPatchLines,
    files: includedFiles,
    filtered: filteredFiles.map((file) => ({ filePath: file.filePath, reason: file.filterReason ?? 'unknown' })),
  });

  const rolePrompts: Record<AgentId, string> = {
    security:
      'Focus on exploitable attack paths and data exposure. Prioritize authN/authZ, injection, SSRF, secrets leakage, and unsafe deserialization. Avoid low-value style findings.',
    correctness:
      'Focus on logic/behavior bugs that can break user flows or produce wrong outputs. Prioritize edge cases, null handling, race conditions, and state consistency. Avoid style-only findings.',
    'test-maintainability':
      'Focus on missing tests and maintainability risks that can reduce change safety. Prioritize fragile abstractions, missing assertions, flaky patterns, and migration risk. Avoid pure formatting remarks.',
  };

  const agentInputByAgent: Record<AgentId, string> = {
    security: toRel(path.join(agentInputDir, 'security.json')),
    correctness: toRel(path.join(agentInputDir, 'correctness.json')),
    'test-maintainability': toRel(path.join(agentInputDir, 'test-maintainability.json')),
  };

  for (const agentId of AGENT_IDS) {
    await writeJson(path.join(process.cwd(), agentInputByAgent[agentId]), {
      agentId,
      role: rolePrompts[agentId],
      repository: diffInput.repo,
      pr: diffInput.pr,
      mode,
      sharedDiff: {
        changedFiles: includedFiles.length,
        files: includedFiles,
      },
      constraints: {
        evidenceRequired: true,
        noProseOutsideJson: true,
      },
    });
  }

  const outputLastMessagePath = path.join(runDir, 'last-message.json');
  const promptPayload = {
    runId,
    mode,
    repository: diffInput.repo,
    pr: diffInput.pr,
    sharedDiff: {
      changedFiles: includedFiles.length,
      files: includedFiles,
    },
    roles: rolePrompts,
    requirements: {
      topLevel: { agents: 'array(3)' },
      allowedAgents: AGENT_IDS,
      issueEvidenceRequired: true,
      strictJson: true,
    },
  };

  const prompt = [
    'Use $pr-review-multi-agent.',
    'Spawn exactly three child agents in parallel for security, correctness, and test-maintainability.',
    "Return JSON only with top-level key 'agents'.",
    'Each agent item must include agentId, status, issues and optionally error, durationMs, tokenUsage.',
    'Each issue must include agentIssueId, title, category, severity, confidence, evidence(filePath,lineStart,lineEnd,snippet), rationale, recommendation.',
    'If no issue exists, return an empty issues array.',
    '',
    'Payload JSON:',
    JSON.stringify(promptPayload),
  ].join('\n');

  let rawCodexResponse: unknown = null;
  let codexTimedOut = false;
  let codexErrorMessage = '';

  for (let attempt = 0; attempt <= retryMax; attempt += 1) {
    const timeoutMs = Math.max((timeoutSec + 30) * 1000, 120_000);
    const result = await runCommandWithInput(
      'codex',
      ['exec', '--enable', 'multi_agent', '--model', model, '--output-last-message', outputLastMessagePath, '-'],
      prompt,
      timeoutMs,
    );

    if (result.code === 0 && existsSync(outputLastMessagePath)) {
      const lastMessageText = await readFile(outputLastMessagePath, 'utf8');
      try {
        rawCodexResponse = parseJsonFromText(lastMessageText);
        codexErrorMessage = '';
        codexTimedOut = false;
        break;
      } catch (error) {
        codexErrorMessage = error instanceof Error ? error.message : 'invalid JSON response';
      }
    } else {
      codexTimedOut = result.timedOut;
      codexErrorMessage = result.stderr.trim() || result.stdout.trim() || 'codex exec failed';
    }

    if (attempt === retryMax) {
      break;
    }
  }

  const rawByAgent: Record<AgentId, string> = {
    security: toRel(path.join(rawDir, 'security.json')),
    correctness: toRel(path.join(rawDir, 'correctness.json')),
    'test-maintainability': toRel(path.join(rawDir, 'test-maintainability.json')),
  };

  const normalizedAgentResults = normalizeAgentResults({
    rawResponse: rawCodexResponse,
    model,
    rawByAgent,
    codexTimedOut,
    codexErrorMessage,
  });

  for (const agentId of AGENT_IDS) {
    const normalized = normalizedAgentResults.find((entry) => entry.agentId === agentId);
    await writeJson(path.join(process.cwd(), rawByAgent[agentId]), normalized ?? { agentId, missing: true });
  }

  const mergedIssues = maskSecrets(mergeIssues(normalizedAgentResults)) as MergedIssue[];
  const maskedAgentResults = maskSecrets(normalizedAgentResults) as AgentResult[];

  const gate = computeGate({
    mode,
    issues: mergedIssues,
    failSeverities: DEFAULT_FAIL_SEVERITIES,
  });

  const hasAgentError = maskedAgentResults.some((agent) => agent.status !== 'success');
  const status: Report['status'] = hasAgentError
    ? mode === 'enforced' && gate.status === 'fail'
      ? 'fail'
      : 'degraded'
    : mode === 'enforced' && gate.status === 'fail'
      ? 'fail'
      : 'pass';

  const summary = buildSummary(mergedIssues);
  const finishedAt = new Date();

  const reportPath = path.join(runDir, 'report.json');
  const summaryPath = path.join(runDir, 'summary.md');
  const feedbackPath = path.join(runDir, 'feedback.md');

  const report: Report = {
    version: '1.0.0',
    runId,
    repository: diffInput.repo,
    pr: diffInput.pr,
    mode,
    status,
    gate,
    input: {
      source: diffInput.source,
      changedFiles: includedFiles.length,
      filteredOutFiles: filteredFiles.length,
      filterRules: FILTER_RULES.map((rule) => rule.name),
      diffStats: { insertions, deletions },
      truncatedFiles,
      maxPatchLines,
    },
    config: {
      model,
      timeoutSec,
      retryMax,
      dedupeRule: 'file+line+normalized_title',
      maskSecrets: true,
      failSeverities: DEFAULT_FAIL_SEVERITIES,
    },
    agents: maskedAgentResults,
    issues: mergedIssues,
    summary,
    artifacts: {
      rootDir: toRel(runDir),
      summaryMarkdownPath: toRel(summaryPath),
      feedbackTemplatePath: toRel(feedbackPath),
      reportJsonPath: toRel(reportPath),
      diffJsonPath: toRel(inputDiffPath),
      agentInputDir: toRel(agentInputDir),
      agentInputByAgent,
      rawDir: toRel(rawDir),
      rawByAgent,
    },
    feedbackMetrics: {
      falsePositiveRate: null,
      missRate: null,
      severityAgreementRate: null,
      developerAcceptanceRate: null,
    },
    createdAt: createdAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
  };

  const validationErrors = validateReportShape(report);
  if (validationErrors.length > 0) {
    await writeJson(reportPath, report);
    console.error(`[pr-review] Validation failed (${validationErrors.length})`);
    for (const issue of validationErrors) {
      console.error(`  - ${issue}`);
    }
    process.exit(4);
  }

  await writeJson(reportPath, report);
  await writeFile(summaryPath, renderSummaryMarkdown(report), 'utf8');
  await writeFile(feedbackPath, renderFeedbackTemplate(report), 'utf8');

  if (format === 'json') {
    console.log(
      JSON.stringify(
        {
          runId: report.runId,
          status: report.status,
          gate: report.gate.status,
          totalIssues: report.summary.totalIssues,
          reportPath: report.artifacts.reportJsonPath,
        },
        null,
        2,
      ),
    );
  } else {
    printSummaryToConsole(report);
  }

  if (report.status === 'fail') {
    process.exit(1);
  }
  if (report.status === 'degraded' && failOnDegraded) {
    process.exit(2);
  }
}

async function validateCommand(options: CliOptions): Promise<void> {
  const reportPath = getStringOption(options, 'report');
  const rawText = await readFile(reportPath, 'utf8');
  const report = parseJsonFromText(rawText);
  const errors = validateReportShape(report);
  if (errors.length > 0) {
    console.error(`[pr-review] Validation failed (${errors.length}):`);
    for (const issue of errors) {
      console.error(`  - ${issue}`);
    }
    process.exit(4);
  }
  console.log(`[pr-review] Validation passed: ${reportPath}`);
}

async function summarizeCommand(options: CliOptions): Promise<void> {
  const reportPath = getStringOption(options, 'report');
  const rawText = await readFile(reportPath, 'utf8');
  const report = parseJsonFromText(rawText) as Report;
  printSummaryToConsole(report);
}

async function resolveDiffInput(params: {
  source: SourceMode;
  prNumber: number;
  baseRef?: string;
  headRef?: string;
}): Promise<{ source: 'gh' | 'git'; rawDiff: string; repo: RepoInfo; pr: PullRequestInfo }> {
  if (params.source === 'gh') {
    return resolveFromGh(params.prNumber);
  }
  if (params.source === 'git') {
    if (!params.baseRef || !params.headRef) {
      throw new Error('--base and --head are required when --source=git');
    }
    return resolveFromGit({
      prNumber: params.prNumber,
      baseRef: params.baseRef,
      headRef: params.headRef,
    });
  }

  const ghResult = await resolveFromGh(params.prNumber).catch(() => null);
  if (ghResult) {
    return ghResult;
  }

  const headRef = params.headRef ?? 'HEAD';
  let baseRef = params.baseRef;
  if (!baseRef) {
    const defaultBranchResult = await runCommandWithInput(
      'git',
      ['rev-parse', '--abbrev-ref', 'origin/HEAD'],
      '',
      5_000,
    );
    if (defaultBranchResult.code === 0) {
      baseRef = defaultBranchResult.stdout.trim();
    } else {
      // Detect actual default branch instead of assuming 'origin/main'
      for (const candidate of ['origin/main', 'origin/master']) {
        const check = await runCommandWithInput('git', ['rev-parse', '--verify', candidate], '', 3_000);
        if (check.code === 0) {
          baseRef = candidate;
          break;
        }
      }
      baseRef = baseRef ?? 'origin/main';
    }
  }
  return resolveFromGit({
    prNumber: params.prNumber,
    baseRef,
    headRef,
  });
}

async function resolveFromGh(
  prNumber: number,
): Promise<{ source: 'gh'; rawDiff: string; repo: RepoInfo; pr: PullRequestInfo }> {
  const auth = await runCommandWithInput('gh', ['auth', 'status'], '', 10_000);
  if (auth.code !== 0) {
    throw new Error('gh auth unavailable');
  }

  const prView = await runCommandWithInput(
    'gh',
    ['pr', 'view', String(prNumber), '--json', 'number,title,url,baseRefName,headRefName'],
    '',
    20_000,
  );
  if (prView.code !== 0) {
    throw new Error(prView.stderr.trim() || 'gh pr view failed');
  }

  const repoView = await runCommandWithInput(
    'gh',
    ['repo', 'view', '--json', 'owner,name,defaultBranchRef'],
    '',
    20_000,
  );
  if (repoView.code !== 0) {
    throw new Error(repoView.stderr.trim() || 'gh repo view failed');
  }

  const diffResult = await runCommandWithInput('gh', ['pr', 'diff', String(prNumber)], '', 30_000);
  if (diffResult.code !== 0) {
    throw new Error(diffResult.stderr.trim() || 'gh pr diff failed');
  }

  const prJson = parseJsonFromText(prView.stdout) as Record<string, unknown>;
  const repoJson = parseJsonFromText(repoView.stdout) as Record<string, unknown>;

  const ownerObj = repoJson.owner as Record<string, unknown> | undefined;
  const defaultBranchRef = repoJson.defaultBranchRef as Record<string, unknown> | undefined;

  return {
    source: 'gh',
    rawDiff: stripAnsi(diffResult.stdout),
    repo: {
      owner: toNonEmptyString(ownerObj?.login, 'repo.owner.login'),
      name: toNonEmptyString(repoJson.name, 'repo.name'),
      defaultBranch: toNonEmptyString(defaultBranchRef?.name, 'repo.defaultBranchRef.name'),
    },
    pr: {
      number: toPositiveInt(prJson.number, 'pr.number'),
      title: toNonEmptyString(prJson.title, 'pr.title'),
      url: toNonEmptyString(prJson.url, 'pr.url'),
      baseRef: toNonEmptyString(prJson.baseRefName, 'pr.baseRefName'),
      headRef: toNonEmptyString(prJson.headRefName, 'pr.headRefName'),
    },
  };
}

async function resolveFromGit(params: {
  prNumber: number;
  baseRef: string;
  headRef: string;
}): Promise<{ source: 'git'; rawDiff: string; repo: RepoInfo; pr: PullRequestInfo }> {
  const diffResult = await runCommandWithInput(
    'git',
    ['diff', '--no-color', `${params.baseRef}...${params.headRef}`],
    '',
    30_000,
  );
  if (diffResult.code !== 0) {
    throw new Error(diffResult.stderr.trim() || 'git diff failed');
  }

  const remoteUrlResult = await runCommandWithInput('git', ['config', '--get', 'remote.origin.url'], '', 5_000);
  if (remoteUrlResult.code !== 0) {
    throw new Error(remoteUrlResult.stderr.trim() || 'git remote origin missing');
  }

  const parsedRepo = parseRepoFromRemoteUrl(remoteUrlResult.stdout.trim());
  const defaultBranchResult = await runCommandWithInput('git', ['symbolic-ref', 'refs/remotes/origin/HEAD'], '', 5_000);
  const defaultBranch =
    defaultBranchResult.code === 0
      ? defaultBranchResult.stdout.trim().split('/').at(-1) || params.baseRef
      : params.baseRef;

  return {
    source: 'git',
    rawDiff: stripAnsi(diffResult.stdout),
    repo: {
      owner: parsedRepo.owner,
      name: parsedRepo.name,
      defaultBranch,
    },
    pr: {
      number: params.prNumber,
      title: `PR #${params.prNumber}`,
      url: `https://github.com/${parsedRepo.owner}/${parsedRepo.name}/pull/${params.prNumber}`,
      baseRef: params.baseRef,
      headRef: params.headRef,
    },
  };
}

function parseRepoFromRemoteUrl(remoteUrl: string): { owner: string; name: string } {
  const match = remoteUrl.match(/[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (!match) {
    throw new Error(`Could not parse repository from remote URL: ${remoteUrl}`);
  }
  return {
    owner: match[1],
    name: match[2],
  };
}

function parseUnifiedDiff(diffText: string): ParsedDiffFile[] {
  const lines = diffText.split(/\r?\n/);
  const files: ParsedDiffFile[] = [];
  let current: ParsedDiffFile | null = null;

  const flush = (): void => {
    if (current && current.filePath) {
      files.push(current);
    }
    current = null;
  };

  for (const line of lines) {
    if (line.startsWith('diff --git ')) {
      flush();
      const match = line.match(/^diff --git a\/(.+?) b\/(.+)$/);
      current = {
        filePath: match?.[2] ?? '',
        patchLines: [line],
        insertions: 0,
        deletions: 0,
      };
      continue;
    }

    if (!current) {
      continue;
    }

    current.patchLines.push(line);
    if (line.startsWith('+') && !line.startsWith('+++')) {
      current.insertions += 1;
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      current.deletions += 1;
    }
  }

  flush();
  return files;
}

function normalizeAgentResults(params: {
  rawResponse: unknown;
  model: string;
  rawByAgent: Record<AgentId, string>;
  codexTimedOut: boolean;
  codexErrorMessage: string;
}): AgentResult[] {
  if (!isRecord(params.rawResponse) || !Array.isArray(params.rawResponse.agents)) {
    return AGENT_IDS.map((agentId) => ({
      agentId,
      status: params.codexTimedOut ? 'timeout' : 'error',
      model: params.model,
      promptVersion: PROMPT_VERSION,
      durationMs: 0,
      tokenUsage: { input: 0, output: 0, total: 0 },
      issueCount: 0,
      issues: [],
      error: {
        code: params.codexTimedOut ? 'CODEX_TIMEOUT' : 'CODEX_BAD_RESPONSE',
        message: params.codexErrorMessage || 'codex did not produce a valid multi-agent payload',
      },
      rawOutputPath: params.rawByAgent[agentId],
    }));
  }

  const items = params.rawResponse.agents;

  return AGENT_IDS.map((agentId) => {
    const rawItem = items.find((candidate) => isRecord(candidate) && candidate.agentId === agentId) as
      | Record<string, unknown>
      | undefined;

    if (!rawItem) {
      return {
        agentId,
        status: 'error',
        model: params.model,
        promptVersion: PROMPT_VERSION,
        durationMs: 0,
        tokenUsage: { input: 0, output: 0, total: 0 },
        issueCount: 0,
        issues: [],
        error: {
          code: 'MISSING_AGENT_RESULT',
          message: `agent result missing: ${agentId}`,
        },
        rawOutputPath: params.rawByAgent[agentId],
      };
    }

    const issues = Array.isArray(rawItem.issues) ? rawItem.issues : [];
    const normalizedIssues = issues.map((issue, index) => normalizeAgentIssue(issue, agentId, index));

    const tokenUsage = isRecord(rawItem.tokenUsage)
      ? {
          input: toSafeInt(rawItem.tokenUsage.input, 0),
          output: toSafeInt(rawItem.tokenUsage.output, 0),
          total: toSafeInt(rawItem.tokenUsage.total, 0),
        }
      : { input: 0, output: 0, total: 0 };

    const status = rawItem.status === 'success' ? 'success' : 'error';

    const normalized: AgentResult = {
      agentId,
      status,
      model: params.model,
      promptVersion: PROMPT_VERSION,
      durationMs: toSafeInt(rawItem.durationMs, 0),
      tokenUsage,
      issueCount: normalizedIssues.length,
      issues: normalizedIssues,
      rawOutputPath: params.rawByAgent[agentId],
    };

    if (status !== 'success') {
      const rawError = isRecord(rawItem.error) ? rawItem.error : {};
      normalized.error = {
        code: toSafeString(rawError.code, 'AGENT_ERROR'),
        message: toSafeString(rawError.message, 'agent returned error'),
      };
    }

    return normalized;
  });
}

function normalizeAgentIssue(rawIssue: unknown, agentId: AgentId, index: number): AgentIssue {
  const issue = isRecord(rawIssue) ? rawIssue : {};
  const evidenceRaw = isRecord(issue.evidence) ? issue.evidence : {};
  const lineStart = Math.max(1, toSafeInt(evidenceRaw.lineStart, 1));
  const lineEnd = Math.max(lineStart, toSafeInt(evidenceRaw.lineEnd, lineStart));

  return {
    agentIssueId: toSafeString(issue.agentIssueId, `${agentId}-issue-${index + 1}`),
    title: toSafeString(issue.title, `Potential issue ${index + 1}`),
    category: normalizeCategory(issue.category, agentId),
    severity: normalizeSeverity(issue.severity),
    confidence: clampNumber(typeof issue.confidence === 'number' ? issue.confidence : 0.5, 0, 1),
    evidence: {
      filePath: toSafeString(evidenceRaw.filePath, 'unknown'),
      lineStart,
      lineEnd,
      snippet: toSafeString(evidenceRaw.snippet, 'n/a'),
    },
    rationale: toSafeString(issue.rationale, 'No rationale provided.'),
    recommendation: toSafeString(issue.recommendation, 'No recommendation provided.'),
    tags: Array.isArray(issue.tags)
      ? issue.tags.filter((tag): tag is string => typeof tag === 'string' && tag.length > 0)
      : undefined,
  };
}

function normalizeCategory(rawCategory: unknown, agentId: AgentId): Category {
  if (rawCategory === 'security' || rawCategory === 'correctness' || rawCategory === 'test_maintainability') {
    return rawCategory;
  }
  if (rawCategory === 'test-maintainability') {
    return 'test_maintainability';
  }
  return CATEGORY_BY_AGENT[agentId];
}

function normalizeSeverity(rawSeverity: unknown): Severity {
  if (
    rawSeverity === 'critical' ||
    rawSeverity === 'high' ||
    rawSeverity === 'medium' ||
    rawSeverity === 'low' ||
    rawSeverity === 'info'
  ) {
    return rawSeverity;
  }
  return 'low';
}

function mergeIssues(agentResults: AgentResult[]): MergedIssue[] {
  const mergedByKey = new Map<
    string,
    {
      issue: AgentIssue;
      sourceAgentIds: Set<AgentId>;
      mergedFromIssueIds: Set<string>;
    }
  >();

  for (const agent of agentResults) {
    for (const issue of agent.issues) {
      const key = `${issue.evidence.filePath}:${issue.evidence.lineStart}:${normalizeTitle(issue.title)}`;
      const existing = mergedByKey.get(key);
      const mergedIssueId = `${agent.agentId}:${issue.agentIssueId}`;

      if (!existing) {
        mergedByKey.set(key, {
          issue,
          sourceAgentIds: new Set([agent.agentId]),
          mergedFromIssueIds: new Set([mergedIssueId]),
        });
        continue;
      }

      existing.sourceAgentIds.add(agent.agentId);
      existing.mergedFromIssueIds.add(mergedIssueId);

      const existingRank = SEVERITY_ORDER[existing.issue.severity];
      const incomingRank = SEVERITY_ORDER[issue.severity];
      if (
        incomingRank > existingRank ||
        (incomingRank === existingRank && issue.confidence > existing.issue.confidence)
      ) {
        existing.issue = issue;
      }
    }
  }

  const merged = Array.from(mergedByKey.entries()).map(([key, value], index) => {
    const normalizedTitle = key.split(':').slice(2).join(':');
    return {
      issueId: `ISSUE-${String(index + 1).padStart(4, '0')}`,
      title: value.issue.title,
      category: value.issue.category,
      severity: value.issue.severity,
      confidence: value.issue.confidence,
      evidence: value.issue.evidence,
      rationale: value.issue.rationale,
      recommendation: value.issue.recommendation,
      sourceAgentIds: sortAgentIds(Array.from(value.sourceAgentIds)),
      mergedFromIssueIds: Array.from(value.mergedFromIssueIds).sort(),
      dedupeRule: 'highest_severity' as const,
      normalizedTitle,
      resolutionState: 'open' as const,
    };
  });

  merged.sort((left, right) => {
    const severityDelta = SEVERITY_ORDER[right.severity] - SEVERITY_ORDER[left.severity];
    if (severityDelta !== 0) {
      return severityDelta;
    }
    if (left.evidence.filePath !== right.evidence.filePath) {
      return left.evidence.filePath.localeCompare(right.evidence.filePath);
    }
    return left.evidence.lineStart - right.evidence.lineStart;
  });

  return merged.map((issue, index) => ({
    ...issue,
    issueId: `ISSUE-${String(index + 1).padStart(4, '0')}`,
  }));
}

function computeGate(params: { mode: RunMode; issues: MergedIssue[]; failSeverities: Severity[] }): Report['gate'] {
  if (params.mode === 'shadow') {
    return {
      status: 'not_applicable',
      blockingSeverities: params.failSeverities,
      blockedIssueIds: [],
      reason: 'Shadow mode: gate does not block merges.',
    };
  }

  const blockedIssueIds = params.issues
    .filter((issue) => params.failSeverities.includes(issue.severity))
    .map((issue) => issue.issueId);

  if (blockedIssueIds.length > 0) {
    return {
      status: 'fail',
      blockingSeverities: params.failSeverities,
      blockedIssueIds,
      reason: `Blocking severities detected: ${params.failSeverities.join(', ')}`,
    };
  }

  return {
    status: 'pass',
    blockingSeverities: params.failSeverities,
    blockedIssueIds: [],
    reason: 'No blocking severities found.',
  };
}

function buildSummary(issues: MergedIssue[]): Report['summary'] {
  const totalsBySeverity: Record<Severity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };

  const totalsByCategory: Record<Category, number> = {
    security: 0,
    correctness: 0,
    test_maintainability: 0,
  };

  for (const issue of issues) {
    totalsBySeverity[issue.severity] += 1;
    totalsByCategory[issue.category] += 1;
  }

  return {
    totalIssues: issues.length,
    totalsBySeverity,
    totalsByCategory,
  };
}

function renderSummaryMarkdown(report: Report): string {
  const lines: string[] = [];
  lines.push(`# PR Review Summary: ${report.pr.number}`);
  lines.push('');
  lines.push(`- Run ID: \`${report.runId}\``);
  lines.push(`- Status: **${report.status.toUpperCase()}**`);
  lines.push(`- Gate: **${report.gate.status.toUpperCase()}**`);
  lines.push(`- Model: \`${report.config.model}\``);
  lines.push(`- Total Issues: **${report.summary.totalIssues}**`);
  lines.push('');
  lines.push('## Totals by Severity');
  lines.push('');
  lines.push(`- critical: ${report.summary.totalsBySeverity.critical}`);
  lines.push(`- high: ${report.summary.totalsBySeverity.high}`);
  lines.push(`- medium: ${report.summary.totalsBySeverity.medium}`);
  lines.push(`- low: ${report.summary.totalsBySeverity.low}`);
  lines.push(`- info: ${report.summary.totalsBySeverity.info}`);
  lines.push('');
  lines.push('## Top Findings');
  lines.push('');

  if (report.issues.length === 0) {
    lines.push('- No findings.');
  } else {
    for (const issue of report.issues.slice(0, 20)) {
      lines.push(
        `- [${issue.severity.toUpperCase()}] ${issue.title} (${issue.evidence.filePath}:${issue.evidence.lineStart}) [${issue.sourceAgentIds.join(', ')}]`,
      );
    }
  }

  lines.push('');
  return lines.join('\n');
}

function renderFeedbackTemplate(report: Report): string {
  return [
    '# PR Review Feedback Template',
    '',
    `Run ID: ${report.runId}`,
    `PR: #${report.pr.number}`,
    `Status: ${report.status}`,
    '',
    '## Developer Feedback',
    '',
    '- Which findings are valid?',
    '- Which findings are false positives?',
    '- Which severity ratings should be adjusted?',
    '- Which missing issues should be added?',
    '',
  ].join('\n');
}

function printSummaryToConsole(report: Report): void {
  console.log(
    [
      `[pr-review] runId=${report.runId}`,
      `[pr-review] status=${report.status} gate=${report.gate.status}`,
      `[pr-review] issues=${report.summary.totalIssues} critical=${report.summary.totalsBySeverity.critical} high=${report.summary.totalsBySeverity.high}`,
      `[pr-review] report=${report.artifacts.reportJsonPath}`,
      `[pr-review] summary=${report.artifacts.summaryMarkdownPath}`,
    ].join('\n'),
  );
}

function validateReportShape(report: unknown): string[] {
  const errors: string[] = [];
  if (!isRecord(report)) {
    return ['root must be object'];
  }

  const requiredTopLevel = [
    'version',
    'runId',
    'repository',
    'pr',
    'mode',
    'status',
    'gate',
    'input',
    'config',
    'agents',
    'issues',
    'summary',
    'artifacts',
    'createdAt',
    'finishedAt',
  ];

  for (const key of requiredTopLevel) {
    if (!(key in report)) {
      errors.push(`missing top-level key: ${key}`);
    }
  }

  if (typeof report.version !== 'string' || !/^1\.0\.0(?:-[A-Za-z0-9.-]+)?$/.test(report.version)) {
    errors.push('version must match 1.0.0 pattern');
  }

  if (typeof report.runId !== 'string' || report.runId.length === 0) {
    errors.push('runId must be non-empty string');
  }

  if (!isRecord(report.repository)) {
    errors.push('repository must be object');
  } else {
    if (typeof report.repository.owner !== 'string' || report.repository.owner.length === 0) {
      errors.push('repository.owner must be non-empty string');
    }
    if (typeof report.repository.name !== 'string' || report.repository.name.length === 0) {
      errors.push('repository.name must be non-empty string');
    }
    if (typeof report.repository.defaultBranch !== 'string' || report.repository.defaultBranch.length === 0) {
      errors.push('repository.defaultBranch must be non-empty string');
    }
  }

  if (!isRecord(report.pr)) {
    errors.push('pr must be object');
  } else {
    if (!Number.isInteger(report.pr.number) || report.pr.number <= 0) {
      errors.push('pr.number must be positive integer');
    }
    if (typeof report.pr.title !== 'string' || report.pr.title.length === 0) {
      errors.push('pr.title must be non-empty string');
    }
    if (typeof report.pr.url !== 'string' || report.pr.url.length === 0) {
      errors.push('pr.url must be non-empty string');
    }
    if (typeof report.pr.baseRef !== 'string' || report.pr.baseRef.length === 0) {
      errors.push('pr.baseRef must be non-empty string');
    }
    if (typeof report.pr.headRef !== 'string' || report.pr.headRef.length === 0) {
      errors.push('pr.headRef must be non-empty string');
    }
  }

  if (report.mode !== 'shadow' && report.mode !== 'enforced') {
    errors.push('mode must be shadow or enforced');
  }

  if (report.status !== 'pass' && report.status !== 'fail' && report.status !== 'degraded') {
    errors.push('status must be pass|fail|degraded');
  }

  if (!isRecord(report.gate)) {
    errors.push('gate must be object');
  } else {
    if (report.gate.status !== 'pass' && report.gate.status !== 'fail' && report.gate.status !== 'not_applicable') {
      errors.push('gate.status must be pass|fail|not_applicable');
    }
    if (!Array.isArray(report.gate.blockingSeverities)) {
      errors.push('gate.blockingSeverities must be array');
    }
    if (!Array.isArray(report.gate.blockedIssueIds)) {
      errors.push('gate.blockedIssueIds must be array');
    }
    if (typeof report.gate.reason !== 'string') {
      errors.push('gate.reason must be string');
    }
  }

  if (!Array.isArray(report.agents) || report.agents.length !== 3) {
    errors.push('agents must be array of length 3');
  } else {
    for (const [index, agent] of report.agents.entries()) {
      if (!isRecord(agent)) {
        errors.push(`agents[${index}] must be object`);
        continue;
      }
      if (!AGENT_IDS.includes(agent.agentId as AgentId)) {
        errors.push(`agents[${index}].agentId invalid`);
      }
      if (agent.status !== 'success' && agent.status !== 'timeout' && agent.status !== 'error') {
        errors.push(`agents[${index}].status invalid`);
      }
      if (!Array.isArray(agent.issues)) {
        errors.push(`agents[${index}].issues must be array`);
      }
    }
  }

  if (!Array.isArray(report.issues)) {
    errors.push('issues must be array');
  }

  if (!isRecord(report.summary)) {
    errors.push('summary must be object');
  }

  if (!isRecord(report.artifacts)) {
    errors.push('artifacts must be object');
  }

  if (typeof report.createdAt !== 'string' || Number.isNaN(Date.parse(report.createdAt))) {
    errors.push('createdAt must be date-time string');
  }
  if (typeof report.finishedAt !== 'string' || Number.isNaN(Date.parse(report.finishedAt))) {
    errors.push('finishedAt must be date-time string');
  }

  return errors;
}

function parseJsonFromText(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('Empty JSON payload');
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    // continue
  }

  const fencedMatch = trimmed.match(/^```(?:json)?\s*([\s\S]+?)\s*```$/i);
  if (fencedMatch) {
    try {
      return JSON.parse(fencedMatch[1]);
    } catch {
      // continue
    }
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    try {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
    } catch {
      // continue
    }
  }

  throw new Error('Failed to parse JSON payload');
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function toRel(targetPath: string): string {
  const relative = path.relative(process.cwd(), targetPath);
  return (relative || '.').split(path.sep).join('/');
}

function normalizeTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function sortAgentIds(agentIds: AgentId[]): AgentId[] {
  return AGENT_IDS.filter((agentId) => agentIds.includes(agentId));
}

function toRunTimestamp(isoString: string): string {
  return isoString.replace(/[:.]/g, '-');
}

function toSafeString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

function toSafeInt(value: unknown, fallback: number): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric) || Number.isNaN(numeric)) {
    return fallback;
  }
  return Math.max(0, Math.floor(numeric));
}

function toPositiveInt(value: unknown, label: string): number {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }
  return numeric;
}

function toNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function runCommandWithInput(
  command: string,
  args: string[],
  input: string,
  timeoutMs: number,
): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let done = false;
    let timedOut = false;

    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      setTimeout(() => {
        child.kill('SIGKILL');
      }, 1500);
    }, timeoutMs);

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8');
    });

    child.on('error', (error) => {
      if (done) {
        return;
      }
      done = true;
      clearTimeout(timeout);
      reject(error);
    });

    child.on('close', (code) => {
      if (done) {
        return;
      }
      done = true;
      clearTimeout(timeout);
      resolve({
        code: code ?? 1,
        stdout,
        stderr,
        timedOut,
      });
    });

    if (input.length > 0) {
      child.stdin.write(input);
    }
    child.stdin.end();
  });
}

function stripAnsi(text: string): string {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: \x1b is the ESC character needed for ANSI escape sequences
  return text.replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, '');
}

function maskSecrets<T>(value: T): T {
  const secretPatterns = [
    /sk-[A-Za-z0-9]{20,}/g,
    /ghp_[A-Za-z0-9]{20,}/g,
    /github_pat_[A-Za-z0-9_]{20,}/g,
    /AKIA[0-9A-Z]{16}/g,
    /(?<=password\s*[=:]\s*)[^\s"']+/gi,
    /(?<=token\s*[=:]\s*)[^\s"']+/gi,
    /(?<=secret\s*[=:]\s*)[^\s"']+/gi,
  ];

  const redactString = (input: string): string => {
    let output = input;
    for (const pattern of secretPatterns) {
      output = output.replace(pattern, '[REDACTED_SECRET]');
    }
    return output;
  };

  const visit = (node: unknown): unknown => {
    if (typeof node === 'string') {
      return redactString(node);
    }
    if (Array.isArray(node)) {
      return node.map((entry) => visit(entry));
    }
    if (isRecord(node)) {
      const output: Record<string, unknown> = {};
      for (const [key, entry] of Object.entries(node)) {
        output[key] = visit(entry);
      }
      return output;
    }
    return node;
  };

  return visit(value) as T;
}
