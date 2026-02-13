#!/usr/bin/env node
/**
 * Legacy i18n path 변경 차단 (WU-12)
 *
 * CI에서 apps/web/public/locales/** 에 대한 변경을 감지하고 실패시킨다.
 * 신규 번역은 apps/web/messages/** 에 추가해야 한다.
 *
 * EOL: 2026-06-30 (i18n-architecture-plan.md 참고)
 *
 * 사용법:
 *   node scripts/i18n/check-legacy.mjs [base-ref]
 *   - base-ref: 비교 대상 (기본: CI에서 GITHUB_BASE_REF, 로컬에서 HEAD)
 */
import { execSync } from 'node:child_process';

const LEGACY_PATH = 'apps/web/public/locales/';

function getChangedFiles() {
	if (process.env.CI && process.env.GITHUB_BASE_REF) {
		const baseRef = process.env.GITHUB_BASE_REF;
		execSync(`git fetch origin ${baseRef} --depth=1`, { stdio: 'pipe' });
		return execSync(`git diff --name-only origin/${baseRef}...HEAD`, {
			encoding: 'utf-8',
		});
	}

	const baseRef = process.argv[2];
	if (baseRef) {
		return execSync(`git diff --name-only ${baseRef}...HEAD`, {
			encoding: 'utf-8',
		});
	}

	// 로컬: staged + unstaged 변경 확인
	const staged = execSync('git diff --name-only --cached', {
		encoding: 'utf-8',
	});
	const unstaged = execSync('git diff --name-only', { encoding: 'utf-8' });
	return `${staged}\n${unstaged}`;
}

try {
	const changedFiles = getChangedFiles();
	const legacyChanges = changedFiles
		.split('\n')
		.map((f) => f.trim())
		.filter((f) => f.startsWith(LEGACY_PATH));

	if (legacyChanges.length > 0) {
		console.error(
			'✗ Legacy i18n path changes detected (EOL: 2026-06-30):',
		);
		for (const file of legacyChanges) {
			console.error(`  - ${file}`);
		}
		console.error(
			'\nNew translations must be added to apps/web/messages/ instead.',
		);
		console.error(
			'See: docs/backlog/i18n-architecture-plan.md section 8.3',
		);
		process.exit(1);
	}

	console.log('✓ No legacy i18n path changes');
} catch (error) {
	if (process.env.CI) {
		console.error(`✗ Legacy path check FAILED (unexpected error): ${error.message}`);
		process.exit(1);
	}
	console.warn(`⚠ Legacy path check skipped: ${error.message}`);
}
