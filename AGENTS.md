# AGENTS Guide

This repository uses Codex multi-agent review workflows.

## Required Setup

- Enable `multi_agent` in `.codex/config.toml`.
- Run Codex with `--enable multi_agent` for parallel child-agent tasks.

## Skill Location

- Store project skills under `.agents/skills/`.
- Use `$pr-review-multi-agent` for PR or diff reviews that need parallel specialists.

## Default Multi-Agent Review Flow

1. Collect PR diff (`gh` first, `git diff` fallback).
2. Spawn exactly 3 child agents in parallel: `security`, `correctness`, `test-maintainability`.
3. Merge and deduplicate issues.
4. Save `report.json`, `summary.md`, and raw agent outputs under `.codex/reviews`.
