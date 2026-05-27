# AGENTS.md — OpenPaint

Single source of truth for autonomous agents (Codex, Cursor, Claude Code, etc.). Read this file before making changes.

## Project overview

OpenPaint is a **web-based vector design application** (browser MS Paint / lightweight Illustrator alternative). Users create and edit **editable vector objects** on a canvas, organize them in layers, undo/redo changes, and optionally persist work to Firebase (Firestore + Storage).

The product direction (see `spec.md`) is: *free, web-native vector design that is simple to start and strong enough for everyday screen graphics.*

## Product purpose

- Let anyone open a URL and draw shapes, paths, and text without installing software.
- Support optional sign-in for cloud project list, auto-save, and thumbnails.
- Export finished work as PNG (rasterized composite today).

## Current tech stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| UI | React 19, Tailwind CSS v4 |
| State | Zustand 5 — `authStore`, `canvasStore`, `projectStore`, `documentStore` |
| Canvas | HTML5 Canvas 2D — scene graph rendered each frame |
| Auth / data | Firebase client SDK only (Auth, Firestore, Storage) |
| Deploy | Vercel (inferred from stack; no server Admin SDK) |

**No API routes, Server Actions, or Firebase Admin SDK.** Security is client SDK + Firestore/Storage rules.

## Repository structure

```
src/
├── app/                 # layout.tsx (AuthProvider), page.tsx (entire SPA), error.tsx, globals.css
├── components/
│   ├── auth/            # AuthModal, forms, UserMenu
│   ├── canvas/          # VectorCanvas, CanvasContainer
│   ├── panels/          # LayersPanel, PropertiesPanel, StatusBar
│   ├── projects/        # Project modals and dialogs
│   ├── toolbar/         # Toolbar, ToolPanel, ColorPicker, BrushSettings
│   └── ui/              # Modal, LoadingSpinner
├── hooks/               # Tools, projects, auto-save, keyboard shortcuts
├── lib/
│   ├── firebase/        # config, auth, firestore, storage
│   └── vector/          # renderer, hitTest, bounds
├── store/               # Zustand stores
├── types/               # ToolType + vector model (types/vector.ts)
└── utils/               # colorUtils
```

Root config: `next.config.ts`, `eslint.config.mjs`, `tsconfig.json`, `firebase.json`, `firestore.rules`, `storage.rules`, `cors.json`.

## Core architecture overview

**Single-page client app.** All editor UI is `src/app/page.tsx` (`"use client"`). Root `layout.tsx` is a Server Component that only wraps `AuthProvider`.

**Dual store model (migration in progress):**

- **`documentStore`** — Source of truth for editing: vector layers, objects, selection, operation-based undo/redo (max 200 entries).
- **`canvasStore`** — Tool UI, zoom/pan, fill/stroke defaults, and **legacy raster layer/canvas maps** still present but not driving the main canvas.

**Rendering:** `VectorCanvas` stacks three canvases — main (scene), overlay (selection handles + previews), event (pointer capture). `renderScene()` in `src/lib/vector/renderer.ts` walks layers and draws objects. Selection UI is drawn in `renderSelectionOverlay()`.

**Persistence:** Cloud saves write `vectorLayers` JSON to Firestore **and** re-render each layer to PNG in Storage (thumbnails + backward-compatible previews). Local save uses `localStorage` key `openpaint-project` at version `2.0.0` JSON.

## Key features that exist today

| Area | Status |
|------|--------|
| Vector scene graph | Working — rectangle, ellipse, line, polygon, path, text, group types in model; group UI limited |
| Selection tool (V) | Working — click select, marquee, move, 8-handle resize, delete, arrow nudge |
| Shape tools (R/O/L/polygon) | Working — create vector objects with fill/stroke defaults |
| Brush tool | Working — freehand → smoothed cubic-bezier `path` objects |
| Eraser | Partial — deletes object under click (not stroke erasing) |
| Fill tool | Partial — sets solid fill on hit object (not pixel flood fill) |
| Eyedropper | Working — samples object fill/stroke swatches |
| Text tool | Working — inline on-canvas editor; double-click to re-edit |
| Properties panel | Working for single selection — position, size, rotation, opacity, fill/stroke |
| Layers panel | Working — vector layers (visibility, lock, opacity, reorder); **no per-object tree** |
| Undo/redo | Working — operation-based on `documentStore` |
| Zoom/pan | Working — wheel (ctrl/meta), middle-mouse pan |
| PNG export | Working — composites via `renderScene` |
| Firebase auth | Google, email/password, email link |
| Cloud projects | Create, list, open, save, delete, rename, thumbnails |
| Auto-save hook | Present — **debounced save likely broken** (`markDirty` never called; see cautions) |
| Pen tool | **Not implemented** |
| Direct selection (anchor edit) | **Not implemented** |
| SVG export | **Not implemented** |
| Groups (Ctrl+G UI) | **Not implemented** (renderer supports `group`) |
| Gradient fills (UI) | **Not implemented** (types + renderer support gradients) |
| On-canvas rotation handle | **Not implemented** (rotation via Properties panel only) |
| Legacy raster state in `canvasStore` | **Partial** — layer canvas maps/history unused by `VectorCanvas`; trim in a dedicated pass |

## Important commands

Use **npm** only (`package-lock.json` is canonical).

```bash
npm install          # install dependencies
npm run dev          # dev server (http://localhost:3000)
npm run build        # production build
npm run start        # serve production build
npm run lint         # ESLint (eslint-config-next)
```

## Canonical validation / check command

Run before committing on `dev`:

```bash
CI=true npm run lint && CI=true npm run typecheck && CI=true npm run test && CI=true npm run build
```

TypeScript is also checked during `next build`; `typecheck` catches issues faster without a full compile.

## Non-interactive testing rules

- Never use watch mode (`--watch`).
- Never open a headed browser or require manual login for CI-style checks.
- Do not block on `npm run dev` unless explicitly debugging interactively.
- Prefer `npm run lint` and `npm run build` only for automated validation.

## Development conventions

- **Minimal diffs** — one focused, PR-sized change per autonomous run (see below).
- Match existing patterns: functional components, `"use client"` only where needed, Zustand actions in stores, hooks for tool behavior.
- Path alias: `@/*` → `src/*`.
- IDs: `uuid` v4 for objects; `crypto.randomUUID()` in some Firebase paths.
- Do not switch package managers or upgrade deps unless the task requires it.
- Do not edit generated files (`.next/`, `next-env.d.ts`) unless a source change demands it.

## TypeScript and lint expectations

- `strict: true` in `tsconfig.json`.
- ESLint: `eslint.config.mjs` extends `eslint-config-next` (core-web-vitals + typescript).
- Fix new lint errors in files you touch; do not drive repo-wide lint cleanup unless asked.

## Server / client boundary guidance

- **Default:** entire editor is client-side. Keep Firebase and canvas logic in `"use client"` modules.
- **Server Components:** only `layout.tsx` metadata/fonts and static shell — no secrets, no Firebase Admin.
- **No middleware auth** — Firebase session is client-side; rules enforce ownership.
- Do not add API routes unless the product explicitly needs server-side secrets (not current architecture).

## Route protection guidance

- **No Next.js routes beyond `/`** — no `/dashboard`, no protected segments.
- **Auth gating is UI-level:** `page.tsx` shows non-closable `AuthModal` when Firebase is configured and user is signed out; cloud project list opens when signed in without a current project.
- **Local mode:** works without auth; save goes to `localStorage` / JSON download path.
- Firestore/Storage rules require `request.auth.uid == resource.data.userId` for projects.

## State management guidance

| Store | Responsibility |
|-------|----------------|
| `authStore` | Firebase user, init/error flags |
| `canvasStore` | Active tool, brush/fill/stroke defaults, zoom/pan, canvas size, legacy raster layers |
| `documentStore` | Vector layers/objects, selection, undo/redo |
| `projectStore` | Project list, current project, sync status, `isDirty`, pending layer loads (legacy) |

**When editing canvas content:** mutate `documentStore` and call `pushHistory()` with reverse operations for undoable actions.

**When editing tools/view:** prefer `canvasStore`.

**Cloud dirty flag:** call `useProjectStore.getState().markDirty()` after document mutations if auto-save should run (currently missing — fix is a valid small task).

## Testing expectations

- No Jest/Vitest/Playwright setup in repo.
- Validation is lint + build only unless the task adds tests.
- Do not add trivial test scaffolding without user request.

## Files and systems requiring extra caution

- `src/lib/firebase/*` — client config; env vars are all `NEXT_PUBLIC_*`.
- `firestore.rules`, `storage.rules` — production security; coordinate rule + app changes.
- `src/store/documentStore.ts` — undo/redo correctness; batch operations carefully.
- `src/lib/vector/renderer.ts` — all visible output; regressions are user-visible.
- `src/hooks/useProjects.ts` — save/load format (`vectorLayers` + Storage PNGs).
- **`canvasStore` raster APIs** — `layerCanvases`, PNG snapshot history — still in store but not used by the vector canvas path.
- `Toolbar.tsx` `handleClear` — still targets raster `layerCanvases`; ineffective on vector canvas.

## Git workflow (main / dev)

| Branch | Role |
|--------|------|
| `main` | Stable production — **never push directly from agents** |
| `dev` | Autonomous integration branch — **all agent commits go here** |

Workflow for agents:

1. `git fetch origin`
2. `git checkout dev`
3. `git pull origin dev` (if branch exists on remote)
4. Make one focused change set; run canonical validation.
5. Commit on `dev`; push to `origin/dev` only.
6. **Do not** open PRs or merge to `main` unless the user explicitly asks.

Feature branches are not used for autonomous work.

## Definition of done

- [ ] On branch `dev` (not `main`).
- [ ] Change matches the assigned task scope (one PR-sized unit).
- [ ] `npm run lint && npm run build` pass (or documented why not).
- [ ] No secrets committed; no edits to `git config`.
- [ ] User-visible behavior sanity-checked for touched flows.
- [ ] Pushed to `origin/dev` when the task includes delivery (documentation tasks: push after commit).

## Rules for autonomous Codex runs

1. Read `AGENTS.md` and `spec.md` before coding.
2. Inspect the code path you will change; do not trust stale docs (including old raster descriptions).
3. One logical change per run — size suitable for a single reviewable PR, even when committing directly to `dev`.
4. Prefer extending `documentStore` / `VectorCanvas` / vector hooks over reviving raster canvas code.
5. Infer conclusions about behavior from code; label uncertainty in commit messages or comments only when necessary.
6. Never push to `main`.

## Stop conditions

Stop and report (do not guess) when:

- Uncommitted changes exist that you did not make and cannot safely reconcile.
- `git pull origin dev` has merge conflicts you cannot resolve with high confidence.
- `npm run build` fails for reasons outside your change scope.
- Firebase env is missing and the task requires live cloud verification.
- The user asked for a feature that needs product direction not supported by `spec.md` (propose spec update first).

After a successful docs-only task: commit, push `dev`, stop — no PR, no merge to `main`.

## Environment variables

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

App runs without them in local-only mode (`isFirebaseConfigured` checks).
