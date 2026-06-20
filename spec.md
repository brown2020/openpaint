# spec.md — OpenPaint Product Specification

Authoritative product and roadmap document. For agent implementation rules, see `AGENTS.md`.

**Last aligned with codebase:** `dev` @ vector architecture (scene graph, `documentStore`, `VectorCanvas`). Older raster-only descriptions are obsolete.

---

## 1. Product overview

### Product promise

**The free, web-based vector design tool that is simple enough for anyone to start and capable enough for everyday screen graphics** — logos, icons, diagrams, and UI assets — without a subscription or install.

### Target users

- Hobbyists and students learning vector basics
- Developers and PMs who need quick diagrams or icons
- Designers who want a lightweight browser alternative for simple jobs
- Open-source contributors extending a Firebase-backed SPA

### Core workflows

1. **Start drawing** — Open app → (optional sign-in) → new or existing project → select tool → create/edit objects on canvas.
2. **Edit objects** — Selection tool → move, resize, nudge, adjust fill/stroke/opacity in Properties panel.
3. **Organize** — Layers for stacking; reorder layers; lock/hide layers.
4. **Iterate** — Undo/redo (operation-based history).
5. **Persist** — Sign in → cloud project with auto-save intent; or local JSON / `localStorage` without auth.
6. **Share output** — Export PNG composite.

### Product goals

- Ship a credible **vector** editor in the browser (editable objects, not burned pixels).
- Keep **time-to-first-stroke** low (minimal friction before canvas).
- Make **cloud save reliable** for signed-in users.
- Close gaps vs. table-stakes vector tools (pen, SVG, text UX) in small, shippable milestones.
- Stay maintainable: one scene graph, one active canvas path, retire dead raster code when safe.

---

## 2. Current application state

*Inferred from repository inspection unless noted as “declared in UI only”.*

### What the app does today

OpenPaint is a **single-route Next.js SPA** that edits a **vector document** (layers containing typed objects), renders it with Canvas 2D, and optionally syncs to Firebase. The main canvas is `VectorCanvas`; the older raster multi-canvas stack is **not wired** into `page.tsx`.

### Current feature inventory

| Feature | Status | Notes |
|---------|--------|-------|
| Vector object model | **Working** | `rectangle`, `ellipse`, `line`, `polygon`, `path`, `text`, `group` in `types/vector.ts` |
| Scene rendering | **Working** | `renderScene()` + transforms; solid + gradient fill types in renderer |
| Selection (V) | **Working** | Hit test, marquee, move, 8-handle resize, delete, keyboard nudge |
| Shapes R/O/L/polygon | **Working** | Create objects on drag; shift/alt modifiers in shape tool |
| Brush | **Working** | Freehand → smoothed path objects |
| Eraser | **Partial** | Deletes whole object under cursor, not partial erase |
| Fill (G) | **Partial** | Sets solid fill on object under cursor (not area flood fill) |
| Eyedropper (I) | **Working** | Samples object fill/stroke to tool defaults |
| Text (T) | **Working** | Inline on-canvas editor; double-click to re-edit |
| Properties panel | **Working** | Single-object: name, X/Y, W/H, rotation°, opacity, fill/stroke |
| Color picker | **Working** | Separate fill/stroke rows, presets, swap; applies to selection |
| Layers panel | **Working** | Vector layers + object list; select, visibility, lock, delete, drag-reorder |
| Undo/redo | **Working** | Operation-based, max 200, on `documentStore` |
| Zoom/pan | **Working** | Ctrl/meta + wheel; middle-mouse pan |
| PNG export | **Working** | White background composite |
| SVG export | **Working** | Solid + gradient fills; per-corner rounded rects; groups |
| Pen tool (P) | **Working** | Corner + smooth points; Enter/Escape; close on start |
| Direct selection (A) | **Not implemented** | |
| Groups UI | **Not implemented** | Model + renderer support `group` |
| Boolean/pathfinder | **Not implemented** | |
| Snapping / smart guides | **Not implemented** | |
| Gradient authoring UI | **Not implemented** | Renderer can draw gradients if set on object |
| On-canvas rotation handle | **Not implemented** | Rotation numeric in Properties only |
| Cloud projects | **Working** | CRUD, thumbnails, `vectorLayers` in Firestore |
| Auto-save | **Working** | Debounced save when signed in with open project |
| Guest-first entry | **Working** | No blocking auth modal; dismissable cloud banner |
| Local project JSON | **Working** | v2 `localStorage` / file open for `version` 2.x |
| Legacy raster load | **Working** | Imports Storage PNGs as locked `image` objects when `vectorLayers` empty |
| Auth modal on load | **On demand** | Unsigned users can draw locally; a dismissable banner and toolbar/cloud actions open a closable auth modal |
| Tests | **Partial** | Vitest unit tests cover vector helpers, sync dirty marking, auth route helper, project loading, and selected UI helpers |
| Dark mode | **Not implemented** | |
| Mobile layout | **Not implemented** | Desktop-oriented sidebars |

### Current user flows

```mermaid
flowchart TD
  A[Load /] --> B{Firebase configured?}
  B -->|No| C[Local canvas only]
  B -->|Yes| D{Signed in?}
  D -->|No| E[Local canvas plus cloud sign-in banner]
  D -->|Yes| F{Current project?}
  F -->|No| G[Project list modal]
  F -->|Yes| H[Editor]
  G --> H
  C --> H
  E --> H
  H --> I[Edit vector doc]
  I --> J{Save}
  J -->|Signed in| K[Firestore + Storage PNGs + vectorLayers JSON]
  J -->|Guest| L[localStorage JSON]
  I --> M[Export PNG]
```

### Existing integrations

- **Firebase Auth** — Google popup, email/password, email link
- **Firestore** — `projects` collection per user
- **Firebase Storage** — per-layer PNG + thumbnail (derived from vector render on save)
- **Vercel** — typical Next.js deploy target (no `vercel.json` in repo; standard build)

### Current architecture summary

- **UI:** React 19 + Tailwind v4, one page shell with toolbars and panels.
- **State:** Zustand — `documentStore` (scene + history), `canvasStore` (tools/view + legacy raster state), `projectStore`, `authStore`.
- **Render loop:** React effect re-renders main canvas when layers change; overlay updated imperatively during drags.
- **Persistence:** Dual write — JSON scene in `vectorLayers` + rasterized layer PNGs for thumbnails/previews.

### Existing technical constraints

- Client-only Firebase; 4096×4096 canvas cap in Firestore rules.
- Storage uploads `image/png` only (rules).
- All `NEXT_PUBLIC_` env vars exposed to browser.
- No service worker / offline-first.
- Single page — no project dashboard route.

### Known limitations

1. **Cloud save requires sign-in** — Guests save locally; cloud projects require authentication (by design).
2. **Text re-edit while selected** — Properties panel edits do not open inline overlay (use double-click).
3. **Eraser / fill semantics** — Object-level, not pixel/raster behavior users may expect from paint apps.
4. **Legacy raster state** — `canvasStore` still exposes raster-era layer canvas/history APIs that no longer drive `VectorCanvas`.
5. **Save cost** — Full layer PNG re-upload every save.
6. **Legacy projects** — Pre-vector saves without `vectorLayers` may load empty layers (metadata only).
7. **Limited automated tests** — Vitest exists for focused helpers and flows, but canvas interaction coverage remains thin.

---

## 3. Product roadmap

Ordered by **user value** and **dependency**. Each item is sized for one focused commit sequence on `dev`.

### Milestone 1 — Cloud save actually auto-saves ✅

**User value:** Signed-in users trust that work is saved without pressing Save.

**Status:** Complete.

**Implementation note:** `markDocumentDirty()` in `src/lib/sync/documentDirty.ts` is called from `documentStore` mutations, `pushHistory`, and undo/redo. `useAutoSave` debounces on `isDirty`.

---

### Milestone 2 — Guest-first canvas (optional auth) ✅

**User value:** New visitors can draw immediately; sign-in is for cloud features only.

**Status:** Complete.

**Acceptance criteria:**

- [x] With Firebase configured, unsigned users reach a blank (or last local) canvas without a blocking modal.
- [x] Dismissable banner with sign-in and cloud-project actions.
- [x] Auth modal opens only when user requests cloud features (banner, toolbar Sign in, Cloud projects).

**Implementation note:** `GuestSignInBanner` + on-demand `AuthModal` in `page.tsx`; local project restore from `localStorage` for guests; toolbar Sign in for guests.

---

### Milestone 3 — Inline text editing ✅

**User value:** Text is usable for real designs, not a browser prompt.

**Status:** Complete.

**Acceptance criteria:**

- [x] Click with Text tool places an on-canvas editable field (respects zoom/pan).
- [x] Typing updates a `text` object; Escape or click outside commits.
- [x] Double-click existing text with Selection tool re-enters edit mode.
- [x] Font size/family from `BrushSettings` / Properties apply to new and edited text.

**Implementation note:** `TextEditor` overlay inside the zoom/pan wrapper; `buildTextObject()` helper; `TextSettings` in toolbar and Properties panel; canvas text hidden during edit.

---

### Milestone 4 — Layers panel shows objects ✅

**User value:** Users can find, select, and reorder artwork without hunting on canvas.

**Status:** Complete.

**Acceptance criteria:**

- [x] Active layer expands to list object names (or type + truncated name).
- [x] Click row selects object on canvas; selection highlights row.
- [x] Delete/visibility/lock respected from object flags.

**Implementation note:** `LayersPanel` lists active-layer objects top-first via `formatObjectListLabel()`; row click selects; per-object visibility/lock/delete controls honor layer lock.

### Milestone 4 follow-up — Drag-reorder objects in layers panel ✅

**User value:** Stack order can be adjusted from the panel without moving objects on canvas.

**Status:** Complete.

**Acceptance criteria:**

- [x] Drag object rows within the active layer to change z-order (`reorderObject` in `documentStore`).

**Implementation note:** Drag handle on object rows; `computeObjectReorder()` maps top-first UI indices to `layer.objects`; disabled when layer is locked.

---

### Milestone 5 — SVG export ✅

**User value:** Users can hand off vectors to other tools and the web.

**Status:** Complete.

**Acceptance criteria:**

- [x] Export menu or toolbar action downloads `.svg` of visible document.
- [x] Supports at least: rect, ellipse, line, path, text (as `<text>`), groups.
- [x] Solid fills and strokes map correctly; transforms applied.

**Implementation note:** `exportDocumentToSvg()` + `downloadSvgFile()` in `src/lib/vector/svgExport.ts`; toolbar SVG button and Ctrl+Shift+E; PNG export remains Ctrl+E.

### Milestone 5 follow-up — SVG gradient fills and per-corner radii ✅

**User value:** Exported SVG matches on-canvas gradient and rounded-rectangle appearance.

**Status:** Complete.

**Acceptance criteria:**

- [x] Linear/radial gradient fills export as SVG `<defs>` gradients.
- [x] Rectangle corner radii export per-corner (not single `rx` approximation).

**Implementation note:** `SvgExportContext` dedupes gradient defs; `roundedRectPathD()` with arc segments; `gradientUnits="userSpaceOnUse"` in object local space.

---


### Milestone 6 — Pen tool (basic) ✅

**User value:** Users can draw custom paths like every vector app.

**Status:** Complete.

**Acceptance criteria:**

- [x] Tool P in toolbar and shortcuts.
- [x] Click adds corner points; click-drag adds smooth points with handles; Enter/Escape finishes open path; click start closes path.
- [x] Live preview segment to cursor.
- [x] Result is editable `path` object in scene graph.

**Implementation note:** `usePenTool` + `penPath.ts` segment builder; overlay preview with close-radius hint; commits `path` object and switches to selection.

---

### Milestone 7 — Open legacy raster projects ✅

**User value:** Existing users do not lose work when opening old cloud saves.

**Status:** Complete.

**Acceptance criteria:**

- [x] On load, if `vectorLayers` empty but Storage layer PNGs exist, import each PNG as a `rectangle` or locked `path`/image placeholder layer (documented approach: one image object per layer) **or** rasterize into a single locked background object.
- [x] Thumbnail and save round-trip still work.

**Implementation note:** `image` object type + `fetchLegacyRasterLayers()` in `loadProject`; one locked full-canvas image per layer from Storage; save still writes `vectorLayers` + PNG composites.

---

### Milestone 8 — Group / ungroup

**User value:** Users manage multi-shape selections as one unit.

**Acceptance criteria:**

- Ctrl+G groups selection into `group` object; Ctrl+Shift+G ungroups.
- Move/resize applies to group bounds.
- Layers panel shows group expandable (depends Milestone 4).

**Implementation intent:** `documentStore` group ops + history batch entries.

---

### Milestone 9 — Direct selection (anchor edit)

**User value:** Users refine paths after creation.

**Acceptance criteria:**

- Tool A selects anchors on one `path` at a time.
- Drag anchor moves; drag handle adjusts curve; double-click segment adds point; Delete removes anchor.

**Implementation intent:** `useDirectSelectionTool` + overlay anchor rendering.

---

### Milestone 10 — Remove raster dead path

**User value:** Faster loads, fewer agent mistakes, smaller mental model.

**Acceptance criteria:**

- No imports of `DrawingCanvas` / `useDrawing` / `useHistory` from active UI.
- Toolbar Clear clears active vector layer objects (with confirm).
- Build and lint pass.

**Implementation intent:** Delete or archive unused files; trim `canvasStore` raster APIs if unreferenced.

---

### Later (not next queue)

- Gradient fill UI, boolean ops, snapping, command palette, JPEG export, project dashboard route, dark mode, responsive layout, real-time collaboration.

These are **not** invented new product directions; they appear in prior planning (`competitor-analysis.md` archive) and partial code (gradient types, group type).

---

## 4. Out of scope (unchanged intent)

| Area | Reason |
|------|--------|
| CMYK / print prepress | Web RGB focus |
| AI generative features | Infra cost; not core |
| Real-time multiplayer | Large architecture change |
| Full Illustrator parity | 35 years of scope creep |

---

## 5. Related documents

| File | Role |
|------|------|
| `AGENTS.md` | Agent instructions, commands, git workflow |
| `README.md` | Human quick start |
| `competitor-analysis.md` | Archived market reference (pointer only) |
| `deps-verified.md` | Archived dependency note (pointer only) |
