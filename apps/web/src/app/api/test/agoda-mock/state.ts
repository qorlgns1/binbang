import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// 테스트 전용 — production에서는 사용되지 않음
export type AgodaMockScenario = 'sold_out' | 'available';

const DEFAULT_SCENARIO: AgodaMockScenario = 'sold_out';
const STATE_DIR = join(tmpdir(), 'binbang-agoda-mock');
const STATE_FILE = join(STATE_DIR, 'scenario.json');

interface AgodaMockStatePayload {
  scenario?: string;
}

function normalizeScenario(value: unknown): AgodaMockScenario {
  return value === 'available' ? 'available' : DEFAULT_SCENARIO;
}

export async function getAgodaMockScenario(): Promise<AgodaMockScenario> {
  try {
    const raw = await readFile(STATE_FILE, 'utf8');
    const payload = JSON.parse(raw) as AgodaMockStatePayload;
    return normalizeScenario(payload.scenario);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return DEFAULT_SCENARIO;
    }
    throw error;
  }
}

export async function setAgodaMockScenario(scenario: AgodaMockScenario): Promise<void> {
  await mkdir(STATE_DIR, { recursive: true });
  await writeFile(STATE_FILE, JSON.stringify({ scenario }), 'utf8');
}
