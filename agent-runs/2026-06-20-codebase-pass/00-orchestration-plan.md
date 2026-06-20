# Orchestration Plan

## Mode Selection

- Repo: /Users/stephenbrown/Code/OPENSOURCE/openpaint
- Branch: dev
- Work mode: full
- Run folder: /Users/stephenbrown/Code/OPENSOURCE/openpaint/agent-runs/2026-06-20-codebase-pass
- Verifiable gates: git remote read, dry-run push, lint, typecheck, Vitest, Next build, targeted source searches, diff review
- Human-decision blockers: product roadmap changes, broad architecture rewrites, Firebase live verification without credentials, unsafe unrelated local changes
- Resume policy: re-run Git preflight, read run-state.md and task-queue.md, push any validated local phase commit before new edits, continue only with clean synced dev

## Loop Plan

| Phase | Loop | Verify Gate | Stop Condition |
| --- | --- | --- | --- |
| Preflight and Repo Docs | Orchestration Planning Loop, Docs Sweep Loop | Docs match current repo and checks pass | Plan, state, queue, docs, and report pushed |
| Baseline Validation | Baseline Validation Loop, Quality Gate Selection Loop | lint/typecheck/test/build results recorded | Baseline clean or failures classified |
| Findings Backlog | Findings Queue Loop, Architecture Fitness Loop, Lean Code Loop | Evidence-backed backlog and scorecard | Backlog, scorecard, and queue are pushed |
| Execute Fixes and Improvements | Task Queue Loop, Fix Validation Loop, Architecture Fitness Loop, Lean Code Loop | Targeted checks plus lint pass | Highest-priority verifiable fixes pushed or deferred |
| Package and Dead-Code Cleanup | Package Cleanup Loop, Dead Code Loop | Safe diagnostics and checks pass | Safe cleanup pushed or deferred |
| Review | Judge Loop | PASS or bounded follow-up tasks | Review report pushed |
| Stabilization | Stabilization Loop, Judge Loop | Completion criteria pass | Final blockers or clean state recorded |
| Integrator | Final Completion Gate | dev matches origin/dev, tree clean, gates recorded | Final report pushed |

## File Ownership

| Task | Owned Files | Notes |
| --- | --- | --- |
| T-001 | 00-orchestration-plan.md, run-state.md, task-queue.md | Startup planning and resume state |
| T-002 | AGENTS.md, spec.md, 01-preflight-and-repo-docs.md | Evidence-backed docs alignment |
| T-003 | 02-baseline-validation.md | Baseline validation report |
| T-004 | 03-findings-backlog.md, task-queue.md | Findings backlog and scorecard |
| T-005 | Source files listed by selected backlog item, 04-execute-fixes-and-improvements.md, task-queue.md | Focused fix batch |
| T-006 | package.json, package-lock.json, dead-code targets if proven, 05-package-and-dead-code-cleanup.md | Safe dependency/dead-code cleanup |
| T-007 | 06-review.md, task-queue.md | Review and judge findings |
| T-008 | 07-stabilization-loop.md, run-state.md, task-queue.md | Stabilization cycles |
| T-009 | 08-integrator.md, final-report.md, run-state.md | Final completion gate |
