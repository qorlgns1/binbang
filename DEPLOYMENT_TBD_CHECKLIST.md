# Deployment TBD Checklist

Last updated: 2026-02-15
Purpose: finalize all `TBD` values in deployment source-of-truth docs in one pass.

## 1) Ownership and On-call

- [ ] `Owner` in `DEPLOYMENT.md` / `ENVIRONMENTS.md` / `RUNBOOK.md`
  - Value:
- [ ] `Service owner/on-call` in `DEPLOYMENT.md`
  - Value:
- [ ] `owners.primary` in `llm-context.yaml`
  - Value:
- [ ] `owners.secondary` in `llm-context.yaml`
  - Value:
- [ ] `owners.oncall_channel` in `llm-context.yaml`
  - Value:
- [ ] `Primary on-call` in `RUNBOOK.md`
  - Value:
- [ ] `Secondary on-call` in `RUNBOOK.md`
  - Value:
- [ ] `Escalation path` in `RUNBOOK.md`
  - Value:
- [ ] `Vendor/infra support contacts` in `RUNBOOK.md`
  - Value:

## 2) Infrastructure Metadata

- [ ] `region` in `llm-context.yaml`
  - Value:
- [ ] `Object storage` in `DEPLOYMENT.md`
  - Value:
- [ ] `storage` in `llm-context.yaml`
  - Value:

## 3) Observability and Alerts

- [ ] `Metrics/trace dashboard` in `DEPLOYMENT.md`
  - Value:
- [ ] `Incident channel and on-call routing` in `DEPLOYMENT.md`
  - Value:
- [ ] `Metrics/traces dashboard` in `RUNBOOK.md`
  - Value:
- [ ] `observability.metrics` in `llm-context.yaml`
  - Value:
- [ ] `observability.traces` in `llm-context.yaml`
  - Value:
- [ ] `observability.alerts` in `llm-context.yaml`
  - Value:

## 4) Completion Steps

1. Fill all `Value:` lines above.
2. Replace matching `TBD` entries in:
   - `DEPLOYMENT.md`
   - `ENVIRONMENTS.md`
   - `RUNBOOK.md`
   - `llm-context.yaml`
3. Update `Last verified` date in all four SOT files.
4. Commit with:
   - `docs: finalize deployment SOT TBD values`
