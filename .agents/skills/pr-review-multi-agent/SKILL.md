---
name: pr-review-multi-agent
description: Multi-agent pull request review orchestration for security, correctness, and test maintainability. Use when Codex needs to review a PR or git diff by spawning three specialized agents in parallel and returning strict JSON findings for gating or reporting.
---

# pr-review-multi-agent

Run a three-agent PR review on one shared diff.

## Minimal Trigger

When the user writes a minimal request such as:

- `$pr-review-multi-agent 사용. PR #120 리뷰해.`

execute the full workflow immediately without asking extra questions first.

## Default Behavior For Minimal Requests

1. Read PR number from user text.
2. Collect diff with `gh pr diff <number>`.
3. Collect PR metadata with `gh pr view <number> --json number,title,url,baseRefName,headRefName`.
4. If `gh` is unavailable or unauthorized, tell the user exactly what failed and ask for one fallback:
   - provide diff text directly, or
   - allow `git diff <base>...<head>` mode.
5. Build one shared diff payload and continue multi-agent analysis.

## Use Fixed Roles

Create exactly three child agents with these role IDs:

1. `security`
2. `correctness`
3. `test-maintainability`

## Prepare Input

1. Build one shared diff payload (`sharedDiff`).
2. Add one role prompt (`role`) per child agent.
3. Keep payload scope limited to the provided diff and metadata.

## Execute

1. Spawn all three child agents in parallel.
2. Pass only the role-specific payload to each child.
3. Enforce strict JSON output from each child.
4. Merge findings by key: `filePath + lineStart + normalizedTitle`.
5. If duplicate severities differ, keep the highest severity.

## Child Output Contract

Return only JSON with this shape:

```json
{
  "agentId": "security|correctness|test-maintainability",
  "status": "success|error",
  "issues": [],
  "error": { "code": "", "message": "" },
  "durationMs": 0,
  "tokenUsage": { "input": 0, "output": 0, "total": 0 }
}
```

Omit `error` when status is `success`.

## Final Response Style

After child JSON is collected and merged:

1. Return a concise human-readable summary by default.
2. Include:
   - overall status (`pass`, `fail`, or `degraded`)
   - total findings
   - counts by severity
   - top findings with `file:line`
3. Return raw JSON only when user explicitly asks for JSON.

## Issue Contract

Each issue must include:

- `agentIssueId`
- `title`
- `category` (`security`, `correctness`, `test_maintainability`)
- `severity` (`critical`, `high`, `medium`, `low`, `info`)
- `confidence` (`0` to `1`)
- `evidence` with `filePath`, `lineStart`, `lineEnd`, `snippet`
- `rationale`
- `recommendation`

## Guardrails

- For child agent outputs, output no prose outside JSON.
- Base findings only on supplied payload/diff.
- Lower confidence when uncertain; do not fabricate certainty.
- Prefer no issue over weakly supported issue.
- Never invent code context not present in the PR diff.
