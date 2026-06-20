# Agent Report

## Agent

Name: Codex

## Scope

Read-only source, dependency, and architecture scan to create a prioritized findings backlog.

## Inputs

Baseline report, AGENTS.md, spec.md, package.json, vitest.config.ts, src/store/documentStore.ts, src/hooks/useKeyboardShortcuts.ts, src/store/canvasStore.ts, src/hooks/useProjects.ts, src/components/canvas/VectorCanvas.tsx, src/lib/firebase/firestore.ts, src/lib/vector/legacyProjectImport.ts, `npm outdated`, `npm audit --audit-level=moderate`, source searches.

## Branch and Push

- Branch: dev
- Upstream: origin/dev
- Commit: pending findings report checkpoint
- Pushed to: pending
- Sync status: clean and synced after baseline commit `0012c73`

## Loop

- Name: Findings Queue Loop, Architecture Fitness Loop, Lean Code Loop
- Goal: identify evidence-backed bugs, package risks, dead-code/lean-code opportunities, and architecture scorecard items
- Verify gate: each finding has severity, file/command evidence, proposed fix, and verification method
- Stop condition: prioritized backlog and first executable task are clear
- Attempt: 1/1
- Result: Backlog written; first task is the undo-order bug

## Run State

- Current phase: Findings Backlog
- Current task: T-004
- Last pushed commit: 0012c73
- Next action: commit/push findings report, then execute F-001
- Blockers: None

## Commands Run

```text
rg -n "TODO|FIXME|HACK|legacy|layerCanvases|floodFill|DrawingCanvas|useDrawing|useHistory|setTimeout|setInterval|addEventListener|removeEventListener|markDocumentDirty|pushHistory|loadDocument|newDocument|clearActiveLayer|environmentMatchGlobs" src package.json vitest.config.ts spec.md AGENTS.md
find src -type f \( -name '*.ts' -o -name '*.tsx' \) -not -name '*.test.ts' -print0 | xargs -0 wc -l | sort -nr | head -30
npx tsc --noEmit --listFilesOnly
npm outdated
npm audit --audit-level=moderate
rg -n "removeLayer\(|addLayer\(|reorderLayer\(|updateLayer\(|clearActiveLayer|removeObject\(" src/components src/hooks src/store
nl -ba src/store/documentStore.ts | sed -n '370,400p'
nl -ba src/hooks/useKeyboardShortcuts.ts | sed -n '130,160p'
nl -ba vitest.config.ts | sed -n '1,30p'
nl -ba src/store/canvasStore.ts | sed -n '1,90p'
```

## Findings

| ID | Severity | Type | Status | Area | Summary | Evidence | Risk | Effort | Verification | Next Step |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F-001 | P1 | Bug | Open | Undo/history | Batch remove operations restore objects out of order on undo. `clearActiveLayer()` records remove operations in ascending layer order, and keyboard delete records ops in selection order while removing separately. Because undo applies operations in reverse, clearing `[A,B,C]` can restore `[A,C,B]`, and deleting adjacent objects can move later objects after unrelated siblings. | `src/store/documentStore.ts:381-395`, `src/hooks/useKeyboardShortcuts.ts:138-152` | User-visible document corruption after undoing delete/clear | Small | Add/adjust unit tests for batch remove undo order; run targeted tests, lint, typecheck | Fix first |
| F-002 | P1 | Package update | Open | Dependencies/security | `npm audit --audit-level=moderate` reports 10 vulnerabilities, including critical `vitest <3.2.6`, high `vite`, high `undici`, plus moderate/low transitive advisories. `npm outdated` shows safe wanted patch/minor updates for Next/Firebase/React/Vitest/Zustand/Tailwind and types. | `npm audit --audit-level=moderate`, `npm outdated` | Dev/tooling and transitive security exposure; some fixes may require lockfile updates | Medium | `npm audit`, `npm run lint`, `npm run test`, `npm run build` | Handle in package cleanup after bug fix |
| F-003 | P3 | Lean code | Open | Test config | Vitest warns that `environmentMatchGlobs` is deprecated. | `vitest.config.ts:8-10`, `CI=true npm run test` warning | Future Vitest upgrades may break config or keep noisy output | Small | Run `npm run test`; migrate to supported config if straightforward | Consider with package cleanup |
| F-004 | P3 | Architecture | Deferred | Legacy raster state | `canvasStore` still owns raster-era `layers`, `layerCanvases`, raster history, selection, and layer actions while the active UI uses `documentStore` + `VectorCanvas`. | `src/store/canvasStore.ts:41-49`, `src/store/canvasStore.ts:85-104`, AGENTS.md cautions | Extra mental model and public surface for future agents; cleanup touches broad state consumers | Medium/Large | Search references, remove in a dedicated pass with lint/build | Defer unless package/dead-code phase has a narrow proof |
| F-005 | P3 | Documentation | Open | spec.md current-state accuracy | Known limitation still names old raster files (`DrawingCanvas`, `useDrawing`, `useHistory`, `floodFill`) that are no longer present; current evidence points to legacy raster APIs inside `canvasStore` instead. | `spec.md:134`, `rg` found no active files with those names | Stale docs can misdirect future cleanup | Small | Docs-only diff, lint | Update during cleanup/final docs if touched |
| F-006 | P2 | Test gap | Open | Undo/history | There is no focused `documentStore` test covering batch undo/redo order even though the store is central to editing correctness. | `rg --files src/store` shows no `documentStore.test.ts`; baseline tests pass elsewhere | Core regression can recur silently | Small | Add targeted Vitest coverage with F-001 | Bundle with F-001 |

## Changes Made

- No source changes.
- Wrote prioritized findings and architecture scorecard.
- Updated task queue to make F-001 the first execution task and package/audit work the cleanup task.

## Verification

Read-only findings checks completed. Baseline lint/typecheck/test/build were clean before this phase; package diagnostics found advisories and outdated packages.

## Architecture and Lean Code Scorecard

| Area | Status | Evidence | Action |
| --- | --- | --- | --- |
| Dependency direction | Pass | App entry stays client-side; active editor flow is page -> hooks/components -> stores/vector libs | No action |
| Module cohesion | Watch | `VectorCanvas` (617 lines), `documentStore` (631 lines), and `canvasStore` legacy state are hotspots | Queue narrow fixes only |
| Public surface area | Watch | `canvasStore` exposes inactive raster layer/history APIs | Defer broad trimming |
| Data and side-effect flow | Fail | Batch remove history ordering can corrupt undo state | Fix F-001 |
| Async/cache/resource lifecycle | Watch | Auto-save timers clean up; save still uploads full layer PNGs per save | Defer save optimization |
| Duplication and dead code | Watch | Legacy raster state remains, but active file names in spec are stale/absent | Defer broad deletion; update docs |
| Dependency lean-ness | Fail | `npm audit` reports 10 vulnerabilities; `npm outdated` shows patch/minor drift | Handle F-002 in cleanup |
| Testability | Fail | Missing `documentStore` undo-order regression test for central behavior | Add with F-001 |

## Quality Gate

- Command: `CI=true npm run lint`
- Result: Passed
- Notes: Report-only push; baseline typecheck/test/build already passed before findings.

## Commit-Push Checkpoint

- Status inspected: `git status --short` showed only owned findings report files
- Diff checked: `git diff --check` passed
- Files staged: pending
- Dry-run push: pending
- Push: pending
- Post-push sync: pending

## Stabilization

- Cycle: Not started
- Completion criteria status: Not applicable in findings
- Remaining blockers: None

## Risks

Package updates may require lockfile churn and should be batched separately from the undo bug. Legacy `canvasStore` cleanup is broad enough to defer unless a narrow proof appears.

## Open Questions

- None.

## Recommended Next Step

Commit/push findings, then fix F-001 with targeted tests.
