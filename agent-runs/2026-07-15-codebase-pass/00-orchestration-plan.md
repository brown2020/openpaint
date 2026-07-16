# Orchestration Plan

## Mode Selection

- Repo: `/Users/stephenbrown/Code/OPENSOURCE/openpaint`
- Branch: `dev`
- Work mode: full dependency and quality pass
- Run folder: `agent-runs/2026-07-15-codebase-pass`
- Verifiable gates: Git sync/push preflight; `npm outdated`; `npm audit`; lint; typecheck; Vitest; Next production build; targeted regression tests; diff review
- Human-decision blockers: product behavior changes, forced audit remediations that downgrade or break the declared stack, or broad architecture changes without local proof
- Resume policy: re-run Git preflight, read `run-state.md` and `task-queue.md`, then continue the recorded next action only when dirty files belong to the active task

## Loop Plan

| Phase | Loop | Verify Gate | Stop Condition |
| --- | --- | --- | --- |
| Preflight and Repo Docs | Orchestration Planning Loop, Docs Sweep Loop | Docs match current repo and checks pass | Plan, state, queue, docs, and report pushed |
| Baseline Validation | Baseline Validation Loop | Canonical gates and dependency diagnostics are classified | Baseline report is pushed with exact failures or a clean result |
| Findings Backlog | Findings Queue Loop, Architecture Fitness Loop, Lean Code Loop | Evidence-backed backlog and scorecard | Backlog, scorecard, and queue are pushed |
| Execute Fixes | Task Queue Loop, Fix Validation Loop | Confirmed bugs/warnings have targeted proof and lint passes | Executable bug tasks are pushed or evidence-backed deferrals recorded |
| Package Cleanup | Package Cleanup Loop, Dead Code Loop | Declared and resolved dependencies are current; canonical gates pass | Safe majors are applied; any truly blocked updates are documented |
| Review | Judge Loop | Strict diff review returns PASS or bounded tasks | Review report and fixes are pushed |
| Stabilization | Stabilization Loop, Judge Loop | Canonical validation and final completion criteria pass | No P0/P1, regressions, or actionable warnings remain |
| Integrate | Commit-Push Checkpoint Loop | Final report, clean tree, and branch sync are confirmed | Final checkpoint is pushed to `origin/dev` |

## File Ownership

| Task | Owned Files | Notes |
| --- | --- | --- |
| T-001 | `AGENTS.md`, `spec.md`, run planning/report files | Startup planning and evidence-based guidance refresh |
| T-002 | Baseline report only | Read-only validation and dependency diagnostics |
| T-003 | Findings report and queue | Evidence-backed bug, warning, package, dead-code, and architecture review |
| T-004 | Source/config/tests named by findings | Confirmed bug and warning fixes only |
| T-005 | `package.json`, `package-lock.json`, package-related config/tests | Update every direct dependency, including majors that pass migration gates |
| T-006 | Review and stabilization reports plus files named by review | Judge/fix cycles and full validation |
| T-007 | Final report and run ledger | Final clean/synced integration checkpoint |
