# Agent Report

## Agent

Name: Codex

## Scope

Reviewed dependency compatibility, audit paths, lint coverage, async save/history lifecycles, source markers, import usage, module hotspots, and the deferred legacy raster surface. No source or package files were changed.

## Inputs

Baseline report; `package.json`; npm registry metadata and peer requirements; `npm audit fix --dry-run`; Git history/blame; source searches; `useProjects`, `useAutoSave`, `projectStore`, `useKeyboardShortcuts`, `canvasStore`, and related tests.

## Branch and Push

- Branch: dev
- Upstream: origin/dev
- Commit: `6509123`
- Pushed to: `origin/dev`
- Sync status: clean and exact at `5c4b819` before report edits

## Loop

- Name: Findings Queue Loop, Architecture Fitness Loop, Lean Code Loop (read-only)
- Goal: convert only reproducible bugs, warnings, dependency drift, and dead-code evidence into bounded tasks
- Verify gate: each finding has severity, file/command evidence, risk, ownership, and verification
- Stop condition: execution order is clear and speculative architecture work is deferred
- Attempt: 1/2
- Result: Passed; three source/config fixes and one package batch are locally executable

## Run State

- Current phase: Findings Backlog
- Current task: T-003
- Last pushed commit: 5c4b819
- Next action: checkpoint findings, then execute F-001/F-002/F-003 before package migration
- Blockers: None

## Commands Run

```text
rg -n <markers/async lifecycle/import usage> src
find src -type f <TypeScript patterns> -exec wc -l {} +
git log / git blame for package and ESLint history
npm view <major packages> version engines peerDependencies --json
npm ls eslint eslint-plugin-react eslint-plugin-react-hooks typescript-eslint @typescript-eslint/parser
npm view @types/uuid@latest version deprecated description --json
npm audit fix --dry-run --json
npm view next@16.2.10 dependencies.postcss --json
```

## Findings

| ID | Severity | Type | Status | Area | Summary | Evidence | Risk | Effort | Verification | Next Step |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F-001 | P2 | Bug / warning coverage | Open | `eslint.config.mjs` | A stale ESLint 10 workaround disables every `react/*` rule even though the repo intentionally runs ESLint 9 | Config lines 2-16/30; blame `162cfb05`; installed React plugin supports ESLint 9.7 but not 10 | React correctness/style defects can pass lint silently | Small | Remove override; lint entire repo; fix all surfaced findings | T-004 |
| F-002 | P1 | Race condition | Open | `projectStore`, `useProjects`, `useAutoSave` | A cloud save unconditionally clears the boolean dirty flag, so edits made while uploads are in flight can be marked saved without being in the uploaded snapshot | `saveProject()` captures layers, awaits per-layer/thumbnail uploads, then calls `clearDirty()`; `markDirty()` has no revision token | User may close the app believing recent edits are synced | Medium | Add dirty revision compare-and-clear; add store regression tests; run tests/lint/typecheck | T-004 |
| F-003 | P2 | Bug | Open | `useKeyboardShortcuts` | Nudge history is built from the selection at timer fire, not the objects nudged at timer start; changing selection within 500ms loses the undo entry. The timer also survives unmount | `nudgeBeforeRef` stores originals, but callback iterates `ds.selectedObjectIds`; effect cleanup only removes listener | Undo can fail after a quick nudge-and-select interaction; delayed side effect after teardown | Small | Commit operations from saved IDs and flush pending history in cleanup; lint/typecheck/tests | T-004 |
| F-004 | P2 | Package update / advisory | Open | Direct dependency tree | Ten direct package rows are behind and audit reports esbuild plus Next-bundled PostCSS advisories | Baseline `npm outdated`/`npm audit`; current direct tree resolves | Missed fixes and known development/build-chain advisories | Medium | Update all compatible direct packages, validate each batch, re-run outdated/audit | T-005 |
| F-005 | P3 | Dead dependency | Open | `@types/uuid` | Installed package is officially deprecated as a stub because UUID ships its own types | npm registry deprecation plus UUID's `types` field | Needless dependency and warning surface | Small | Remove package; typecheck and build | T-005 |
| F-006 | P3 | Dead code / architecture | Deferred | `canvasStore` legacy raster API | Raster layers/canvas/history remain unused by the active vector editor | Search finds active undo/layers only in `documentStore`; legacy symbols are self-contained in `canvasStore` | Larger state surface and agent confusion, but removal overlaps an explicit spec milestone | Medium | Dedicated product-approved milestone with store/type deletion proof | Defer to Milestone 10 |
| F-007 | P3 | Package compatibility | Deferred pending upstream | ESLint 10 / TypeScript 7 | Current upstream lint plugins do not support both latest majors without disabling rules or accepting unsupported TypeScript | `eslint-plugin-react@7.37.5` peer ends at ESLint 9; its rules previously crashed on 10. `typescript-eslint@8.64.0` supports TS `<6.1.0` | Forcing latest would create peer warnings, disable React lint coverage, or run an unsupported parser | None locally safe | Keep latest compatible ESLint 9 / TS 6; recheck upstream metadata in future | T-005 records exact deferral |

## Changes Made

- Wrote the prioritized finding log and execution order.
- Classified broad legacy raster removal as a spec-owned deferred milestone instead of silently expanding this pass.

## Verification

Every executable finding is backed by source/registry evidence and has a local gate. Major-package metadata was read from the npm registry; the repository remains unchanged and clean before report edits.

## Architecture and Lean Code Scorecard

| Area | Status | Evidence | Action |
| --- | --- | --- | --- |
| Dependency direction | Pass | UI -> hooks/stores -> lib/types boundaries are consistent; Firebase stays client-side | Preserve |
| Module cohesion | Watch | `VectorCanvas` 617 lines, `documentStore` 633, `renderer` 555; no small verified split is needed for this update | Defer taste-driven splitting |
| Public surface area | Watch | `canvasStore` exposes self-contained raster APIs unused by active UI | Defer to spec Milestone 10 |
| Data and side-effect flow | Fail | Dirty boolean lacks save snapshot/version semantics | Fix F-002 |
| Async/cache/resource lifecycle | Fail | Nudge timer can commit against new selection and outlive hook cleanup | Fix F-003 |
| Duplication and dead code | Watch | Legacy raster state and deprecated UUID stub exist | Remove stub; defer raster milestone |
| Dependency lean-ness | Fail | Direct drift, audit findings, deprecated stub, and stale lint workaround | Fix F-001/F-004/F-005 |
| Testability | Pass | Store dirty behavior has an existing focused test file; canonical gates are fast | Add regression cases and run full suite |

## Quality Gate

- Command: `CI=true npm run lint` (baseline evidence)
- Result: Passed under current config
- Notes: result is incomplete until F-001 restores React lint rules; rerun immediately after that change

## Commit-Push Checkpoint

- Status inspected: clean before report edits
- Diff checked: Passed
- Files staged: findings report, run state, and task queue
- Dry-run push: Passed
- Push: Passed
- Post-push sync: Passed (`0 0`)

## Stabilization

- Cycle: Not started
- Completion criteria status: executable issues queued
- Remaining blockers: none; F-006/F-007 are evidence-backed deferrals, not current blockers

## Risks

Live Firebase timing cannot be exercised without service credentials, so F-002 will be verified through deterministic store revision semantics and existing local gates. Next 16.2.10 still pins PostCSS 8.4.31; overriding its private dependency is not considered a supported remediation.

## Open Questions

- None.

## Recommended Next Step

Restore full React lint coverage and fix surfaced findings, then implement dirty-revision save semantics and nudge lifecycle/history repair before changing packages.
