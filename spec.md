# spec.md — OpenPaint Improvement Spec

> **Goal:** Transform OpenPaint from a raster pixel painter into a competitive web-based vector design tool.
>
> **Positioning:** "The free, web-based vector design tool that's simple enough for everyone and powerful enough for professionals."

---

## 1. Table Stakes Gaps

These are things Illustrator has that OpenPaint is missing entirely. Without them, we aren't a vector design tool at all. Must ship.

---

### 1.1 Vector Object Model & Scene Graph

**Current state:** No object model. Drawing burns pixels directly into canvas bitmaps. Once drawn, nothing can be selected, moved, or edited.

**Illustrator:** Every element (shape, path, text) is a persistent object with editable properties (position, size, fill, stroke, opacity). Objects live in a scene graph rendered to the canvas on every frame.

**Spec:**

Build a vector document model where every element is an object stored in a scene graph (ordered tree). Each object has:

- `id` (string)
- `type` (`"rectangle"` | `"ellipse"` | `"path"` | `"line"` | `"polygon"` | `"text"` | `"group"`)
- `transform` — position (x, y), rotation (degrees), scale (x, y)
- `fill` — color (hex + alpha), or gradient reference, or `null` (no fill)
- `stroke` — color (hex + alpha), width (px), dash pattern, line cap, line join, or `null`
- `opacity` — 0 to 1
- `locked` — boolean
- `visible` — boolean
- `name` — user-editable label

Type-specific properties:
- **Rectangle:** width, height, cornerRadius (per-corner)
- **Ellipse:** radiusX, radiusY
- **Path:** array of path segments (MoveTo, LineTo, CubicBezierTo, QuadraticBezierTo, ClosePath), each segment has anchor points and optional control handles
- **Line:** start point, end point
- **Polygon:** number of sides, radius (renders as a regular polygon path)
- **Text:** content string, fontFamily, fontSize, fontWeight, fontStyle, textAlign, lineHeight
- **Group:** ordered children array (recursive scene graph)

Rendering: On every frame (or when the document changes), walk the scene graph bottom-to-top and render each object to a single HTML5 Canvas using Canvas 2D API path drawing commands. This replaces the current per-layer pixel canvas stack.

Layers remain as an organizational concept — each layer is a top-level group in the scene graph. Objects within a layer render in order. Layers render bottom-to-top.

**Data model change:** The Firestore document model changes from storing layer pixel images in Storage to storing the scene graph as JSON in Firestore. Layer images in Storage are no longer needed for vector projects. Thumbnails are still rendered and uploaded.

---

### 1.2 Selection Tool (V)

**Current state:** Selection tool button exists but does nothing.

**Illustrator:** Click to select objects. Drag to move. Bounding box with handles for resize/rotate. Shift+click for multi-select. Drag marquee to select multiple.

**Spec:**

- **Click** on an object to select it. Show a bounding box with 8 resize handles (corners + edge midpoints) and a rotation handle above the top edge.
- **Drag** a selected object to move it. Show position in the status bar.
- **Drag a resize handle** to scale. Shift constrains proportions. Alt scales from center.
- **Drag the rotation handle** to rotate. Shift snaps to 15° increments. Show angle in status bar.
- **Shift+click** to toggle an object in/out of the multi-selection.
- **Drag on empty space** to draw a selection marquee. All objects intersecting the marquee are selected on mouse up.
- **Escape** or click on empty space to deselect all.
- **Delete/Backspace** to delete selected objects.
- **Arrow keys** to nudge selected objects by 1px (Shift+arrow for 10px).
- **Double-click** on a group to enter it (select children). Double-click outside to exit.

The Properties Panel (right sidebar) shows editable fields for the selected object: position X/Y, width/height, rotation, fill color, stroke color, stroke width, opacity, corner radius (for rectangles). Changes apply immediately.

Keyboard shortcut: **V**

---

### 1.3 Pen Tool (P)

**Current state:** Not implemented. No path editing of any kind.

**Illustrator:** Click to place corner anchor points. Click-drag to create smooth anchor points with bezier control handles. The core vector drawing tool.

**Spec:**

- **Click** on the canvas to place a corner anchor point. A straight path segment connects it to the previous point.
- **Click-drag** to place a smooth anchor point. Dragging pulls out symmetric control handles that define the curve. The further you drag, the more pronounced the curve.
- **Click on the first anchor point** to close the path.
- **Escape** or **Enter** to end an open path.
- **Backspace** while drawing to delete the last placed anchor point.
- While drawing, a **live preview line** shows where the next segment will go (from the last anchor to the cursor).
- After placing a smooth point, **Alt+click the same point** to break the handle symmetry (convert smooth to corner for the next segment only).

The resulting path is a vector object in the scene graph with full fill/stroke properties.

Keyboard shortcut: **P**

---

### 1.4 Direct Selection Tool (A)

**Current state:** Not implemented.

**Illustrator:** Select and drag individual anchor points and control handles to reshape paths.

**Spec:**

- **Click** on an anchor point to select it. Show control handles (if any) as lines extending from the anchor with draggable circles at the ends.
- **Drag an anchor point** to move it (and its handles move with it).
- **Drag a control handle** to reshape the curve. By default, handles stay symmetric (moving one moves the other). **Alt+drag** to break symmetry and move one handle independently.
- **Shift+click** to add/remove anchor points from the multi-selection.
- **Drag on empty space** to draw a marquee that selects all anchor points within it.
- **Double-click** on a path segment to add a new anchor point at that position.
- **Click an anchor point + Delete** to remove it (path reconnects through remaining points).

Keyboard shortcut: **A**

---

### 1.5 Shape Tools as Vector Objects

**Current state:** Rectangle, ellipse, and line tools exist but burn pixels. The result is not an editable object.

**Illustrator:** Shape tools create live objects with editable properties (corner radius, dimensions, position) that persist in the scene graph.

**Spec:**

Rework the existing shape tools so that instead of drawing pixels, they create vector objects in the scene graph:

- **Rectangle (R):** Click-drag to create. Shift constrains to square. Alt draws from center. After creation, the object has editable width, height, and per-corner radius in the Properties Panel. Double-click to show corner radius handles on-canvas.
- **Ellipse (O):** Click-drag to create. Shift constrains to circle. Creates an ellipse object with radiusX and radiusY.
- **Line (L):** Click-drag to create. Shift constrains to 45° angles. Creates a line object with start/end points and stroke properties.
- **Polygon:** New tool. Click-drag to create a regular polygon. Shift constrains rotation. Properties panel shows sides (3–12) and radius. Default: hexagon (6 sides).

All shapes are created with the current fill color, stroke color, and stroke width. They appear as objects in the Layers panel and can be selected, moved, resized, and edited after creation.

---

### 1.6 Fill & Stroke Per Object

**Current state:** One global brush color. Shapes are drawn with fill OR stroke, burned into pixels.

**Illustrator:** Every object has independent fill and stroke. Fill can be solid, gradient, or none. Stroke has color, width, dash, cap, and join properties. Both are editable anytime.

**Spec:**

Each vector object has independent:

- **Fill:** solid color (hex + alpha) or `null` (no fill). Gradient support added in §1.9.
- **Stroke:** color (hex + alpha), width (0.5–100px), line cap (`butt` | `round` | `square`), line join (`miter` | `round` | `bevel`), or `null` (no stroke).

The left sidebar's color area shows **two swatches** — fill (front) and stroke (back, offset). Click a swatch to pick its color. Click the small "swap" icon to swap fill and stroke. Press **X** to swap, **/** to toggle no-fill on the active swatch.

When an object is selected, changing fill/stroke updates that object. When nothing is selected, changes set defaults for the next created object.

---

### 1.7 Text Tool (T)

**Current state:** Tool button exists, declared in types, but clicking does nothing.

**Illustrator:** Full typography engine — point type, area type, type on a path, with granular character/paragraph controls.

**Spec:**

Implement basic point text:

- **Click** on the canvas to place a text cursor. A text input appears inline on the canvas (an editable `<div>` overlay positioned at the click point, matching the canvas zoom/pan).
- **Type** to enter text. The text renders as a vector text object in the scene graph.
- **Click away** or **Escape** to commit the text and deselect.
- **Double-click** a text object with the selection tool to re-enter editing mode.

Text object properties (editable in Properties Panel):
- fontFamily — dropdown of web-safe fonts + Google Fonts (load via `@fontsource` or Google Fonts API). Start with: Arial, Helvetica, Georgia, Times New Roman, Courier New, Verdana, Inter, Roboto, Open Sans, Playfair Display.
- fontSize — numeric input (8–200px)
- fontWeight — normal / bold (or numeric 100–900 for variable fonts)
- fontStyle — normal / italic
- textAlign — left / center / right
- fill color (text color) — uses the object's fill property
- stroke color — optional outline on text

Text renders on canvas via `ctx.fillText()` / `ctx.strokeText()` with the object's transform applied. For SVG export, text objects export as `<text>` elements.

Area text (text boxes with wrapping) and text on a path are out of scope for now.

---

### 1.8 Boolean / Pathfinder Operations

**Current state:** Not implemented.

**Illustrator:** Unite, minus front, minus back, intersect, exclude. Combine shapes into new complex paths.

**Spec:**

When 2+ vector objects are selected, the toolbar (or right-click menu) shows boolean operation buttons:

- **Union:** Merge all selected shapes into one path (outer outline).
- **Subtract:** Cut the front shape(s) out of the back shape.
- **Intersect:** Keep only the overlapping region.
- **Exclude:** Keep everything except the overlapping region (XOR).

Implementation: Use a path boolean library (e.g., `paper.js` `PathItem.unite/subtract/intersect/exclude`, or the standalone `polygon-clipping` package). Convert our path data to the library's format, perform the operation, convert back to our path segments.

The result is a single new path object that replaces the selected objects.

---

### 1.9 Gradients

**Current state:** Not implemented.

**Illustrator:** Linear, radial, and freeform gradients. Gradient on stroke. Gradient mesh.

**Spec:**

Support two gradient types as fill options:

- **Linear gradient:** Two or more color stops along a line. User drags on-canvas handles to set direction and extent.
- **Radial gradient:** Two or more color stops radiating from a center point. User drags handles for center, radius, and focal point.

In the Properties Panel, when an object's fill is set to gradient:
- Show a gradient bar with color stops. Click to add a stop, drag to reposition, click a stop to change its color. Double-click a stop to remove it.
- A dropdown to switch between linear and radial.
- On-canvas: two handles (start/end for linear; center/edge for radial) that can be dragged to reposition the gradient.

Canvas rendering: Use `ctx.createLinearGradient()` / `ctx.createRadialGradient()` when filling objects.

SVG export: Map to `<linearGradient>` / `<radialGradient>` in `<defs>`.

---

### 1.10 SVG Export

**Current state:** Only PNG export exists.

**Illustrator:** Exports to AI, SVG, EPS, PDF, PNG, JPEG, and more.

**Spec:**

Add an "Export as SVG" option alongside the existing PNG export:

- Walk the scene graph and generate an SVG document.
- Rectangles → `<rect>`, Ellipses → `<ellipse>`, Paths → `<path>` with d attribute, Lines → `<line>`, Text → `<text>`, Groups → `<g>`.
- Apply transforms, fill, stroke, opacity as SVG attributes.
- Gradients go in `<defs>` and are referenced via `url(#id)`.
- Output a clean, minimal SVG (no unnecessary wrappers or metadata).
- Trigger browser download of the `.svg` file.

Also add **JPEG export** — render scene graph to canvas, export as JPEG with quality slider (0.1–1.0).

Export menu becomes a dropdown: PNG | SVG | JPEG.

---

### 1.11 Snapping & Alignment

**Current state:** No snapping or alignment guides.

**Illustrator:** Smart guides, snap to grid, snap to objects, align/distribute panel.

**Spec:**

**Smart Guides:** When dragging or resizing an object, show temporary guide lines when the object's edges or center align with other objects' edges or center. Snap to these positions with a 5px magnetic threshold. Guides appear as thin blue lines spanning the canvas.

**Snap to Grid:** Toggle-able grid overlay (View menu or shortcut). When enabled, object positions snap to grid points. Grid size configurable (default 10px).

**Align Panel:** When 2+ objects are selected, show alignment buttons in the Properties Panel:
- Align left / center / right / top / middle / bottom (relative to selection bounds)
- Distribute horizontally / vertically (even spacing)

When 1 object is selected, align operations align to the canvas/artboard bounds.

---

### 1.12 Groups

**Current state:** Not implemented.

**Illustrator:** Group objects for collective manipulation. Groups can be nested.

**Spec:**

- **Ctrl+G** to group selected objects. Creates a `group` node in the scene graph with the selected objects as children.
- **Ctrl+Shift+G** to ungroup. Moves children back to the parent layer.
- Groups appear as collapsible items in the Layers Panel with a folder icon.
- Selecting a group with the Selection Tool selects the whole group. Transform operations (move, scale, rotate) apply to all children.
- **Double-click** a group to "enter" it — now clicks select individual children. Click outside or press Escape to exit the group.
- Groups can be nested (group of groups).

---

### 1.13 Transform with Numeric Input

**Current state:** No numeric input for transforms. Objects can't be selected at all.

**Illustrator:** Precise numeric control for position, size, rotation via Properties panel and Transform dialog.

**Spec:**

The Properties Panel (right sidebar) shows for any selected object:

- **X, Y** — position (top-left corner relative to canvas). Editable number inputs.
- **W, H** — width and height. Editable. A lock icon toggles constrained proportions.
- **R** — rotation in degrees. Editable.
- **Opacity** — slider 0–100%.

All fields update the object in real-time as the user types. Pressing Enter commits. Tab moves to the next field.

For multi-selection: fields show the bounding box dimensions. Changing values applies to the group transform.

---

## 2. Improvement Opportunities

These are things both OpenPaint and Illustrator have, but Illustrator does better. We should match or exceed them.

---

### 2.1 Layers Panel Upgrade

**Current state:** Flat list of layers. Each layer has visibility, lock, opacity, and up/down reorder buttons. Layers contain pixel data.

**Illustrator:** Hierarchical layers with sublayers. Each object visible in the layer tree. Drag-to-reorder.

**Spec:**

Redesign the Layers Panel to show the scene graph:

- Each layer is a collapsible group. Expanding it shows the objects within it.
- Objects show their name, a visibility eye icon, and a lock icon.
- **Drag-to-reorder** objects within and between layers (replace up/down buttons).
- **Click** an object in the Layers Panel to select it on canvas (and vice versa — selecting on canvas highlights it in the panel).
- Small thumbnail preview next to each object name showing its appearance.
- Right-click context menu on objects: Rename, Duplicate, Delete, Group, Ungroup, Lock, Hide.

---

### 2.2 Color Picker Upgrade

**Current state:** Basic HTML color input + hex input + opacity slider. Handful of preset swatches.

**Illustrator:** Full color picker with spectrum, sliders (HSB/RGB/Hex), swatches panel, global swatches, Pantone libraries.

**Spec:**

Replace the current color picker with:

- **Color spectrum area** — a square/rectangle saturation-brightness field with a hue slider bar beside it (standard HSB picker layout). Click/drag to select.
- **Input fields** below: Hex input, R/G/B number inputs, and an opacity/alpha slider.
- **Recent colors row** — last 12 used colors, persisted in localStorage.
- **Saved swatches** — user can click a "+" to save the current color. Saved swatches persist per project (stored in Firestore doc).
- **Eyedropper** button in the picker — activates eyedropper tool to sample from canvas.

The two fill/stroke swatches (§1.6) are shown at the top of the color area.

---

### 2.3 Zoom & Pan Improvements

**Current state:** Zoom with scroll wheel/buttons/keyboard. Pan with middle mouse. Reset zoom button.

**Illustrator:** Zoom to selection, fit to canvas, fit to all objects. Smooth animated zoom. Minimap.

**Spec:**

Add:
- **Ctrl+0:** Fit canvas to viewport (zoom and center so the entire canvas is visible with padding).
- **Ctrl+1:** Zoom to 100% (actual pixels).
- **Ctrl+Shift+0:** Zoom to fit all objects (bounding box of all objects fills the viewport).
- **Zoom to selection:** When objects are selected, Ctrl+Shift+1 zooms to fit the selection.
- **Smooth animated zoom** — transitions are animated over ~150ms using `requestAnimationFrame` instead of instant jumps.
- **Space+drag** as an alternative pan method (hold Space, then drag). This is the Illustrator/Photoshop convention and muscle memory for most designers.

---

### 2.4 History Improvements

**Current state:** Stores full canvas PNG snapshots as base64 data URLs. 50-entry limit. Very memory-heavy.

**Illustrator:** Operation-based undo. Can undo hundreds of operations with minimal memory.

**Spec:**

Switch to **operation-based undo** that stores diffs rather than full snapshots:

- Each history entry records the operation type and the minimal data needed to reverse it:
  - Object create → store the object ID (undo = delete it)
  - Object delete → store the full object data (undo = re-insert it)
  - Object modify → store the object ID + the previous property values that changed (undo = restore those properties)
  - Object reorder → store the old position (undo = move back)
- Increase history limit to 200 entries.
- Undo walks backward through entries, applying reverse operations.
- Redo walks forward, re-applying operations.

This eliminates the base64 PNG snapshot memory problem entirely since we're working with vector objects, not pixel data.

---

### 2.5 Export Improvements

**Current state:** PNG download only. No resolution control. No background options.

**Spec:**

Export dialog with options:

- **Format:** PNG | SVG | JPEG (dropdown)
- **Scale:** 1x, 2x, 3x, or custom (for PNG/JPEG — affects pixel dimensions)
- **Background:** Transparent (PNG only) | White | Custom color
- **Quality:** 0.1–1.0 slider (JPEG only)
- **Selection only:** Export only the selected objects (crops to selection bounding box)

Show a preview of the export dimensions and estimated file size before downloading.

---

## 3. Differentiators

Things we can do that Illustrator doesn't, or where we can be meaningfully better.

---

### 3.1 Zero-Install, Instant Start

**Current state:** Already web-based. But requires auth to save, and presents an auth modal immediately.

**Spec:**

- When a non-authenticated user opens the app, skip the auth modal entirely. Drop them into a blank canvas with full tool access.
- Show a subtle banner: "Sign in to save your work to the cloud" with a sign-in button. Dismissable.
- All tools work without auth. Local save (download file) works without auth.
- Auth prompt only appears when the user tries to use a cloud feature (save to cloud, open projects).

This is the "instant start" experience Illustrator can never match — zero friction from URL to canvas.

---

### 3.2 Clean, Minimal UI

**Current state:** Functional but crowded with all panels always visible. No way to toggle panels.

**Illustrator:** Dozens of panels, deeply nested menus. Overwhelming for new users.

**Spec:**

- **Collapsible panels:** Left tool sidebar, left settings panel, and right layers/properties panel can each be collapsed to icons with a single click. Double-click or drag the edge to resize.
- **Context-sensitive Properties Panel:** The right sidebar shows different content depending on what's selected:
  - Nothing selected → canvas/document properties (size, background color, grid settings)
  - Object selected → that object's properties (position, size, fill, stroke, opacity, type-specific)
  - Multiple objects → shared properties + alignment buttons
- **Minimal toolbar:** Top toolbar shows only essential actions. Advanced options live in menus or keyboard shortcuts, not visible buttons.
- **Dark mode:** Add a dark theme (dark gray backgrounds, light text) toggled via a button in the toolbar or system preference. Use Tailwind's `dark:` variant. Persist preference in localStorage.

---

### 3.3 Cloud-Native Project Management

**Current state:** Already have cloud projects with save/load/auto-save. But project list is a basic modal with cards.

**Spec:**

Improve the project management experience:

- **Dashboard route** (`/dashboard`): A dedicated page listing all projects as a grid of thumbnail cards. Show name, last modified date, canvas dimensions.
- **Sorting:** By last modified (default), name (A-Z), date created.
- **Search:** Filter projects by name.
- **Duplicate project:** Button on each project card to create a full copy.
- **Import SVG:** Upload an SVG file and parse it into OpenPaint's vector object model. Basic support: `<rect>`, `<ellipse>`, `<circle>`, `<line>`, `<path>`, `<text>`, `<g>`, with fill/stroke/transform.

---

### 3.4 Keyboard-First Workflow

**Current state:** Good shortcut coverage for tools and basic operations.

**Spec:**

Add:
- **Command palette (Ctrl+K):** Searchable list of all actions. Type to filter, Enter to execute. Covers every action in the app — tools, file operations, view toggles, alignment, boolean ops. Shows the keyboard shortcut for each action.
- **Quick color:** Press **1–9** (with no modifier) to select from the recent colors palette. **0** for the last-used color.
- **Duplicate in place:** Ctrl+D duplicates the selected object(s) at a +10px,+10px offset.
- **Copy/paste style:** Ctrl+Shift+C copies the fill/stroke/opacity of the selected object. Ctrl+Shift+V pastes those properties onto another selection.

---

## 4. Not Doing

Features Illustrator has that we're intentionally skipping, and why.

| Feature | Why Not |
|---------|---------|
| CMYK / spot colors / prepress | Niche print-industry feature. Web app works in RGB/sRGB. |
| Mesh gradients | Enormous engineering cost, rarely used in practice. |
| Image trace (raster to vector) | Requires ML infrastructure. Not core to vector editing. |
| 3D effects (revolve, extrude) | Not core to 2D vector design. Adds massive complexity. |
| Adobe Fonts integration | Licensing impossibility. We use Google Fonts instead. |
| Envelope distort / complex warps | Power-user features with very low usage. Low ROI. |
| AI generative features | Requires massive infra. Not a differentiator for open source. |
| Variable font axes | Requires complex typography engine. Use standard weight/style. |
| Pattern fills | Complex tiling system. Can add later if demanded. |
| Blend tool (shape morphing) | Niche illustration feature. Low priority. |
| Symbols / instances | Useful but complex. Can add later. |
| Artboards (multiple canvases) | Useful but adds significant UI complexity. Ship single canvas first, add later. |
| Type on a path | Complex text layout engine. Ship basic text first, add later. |
| Area text (text boxes) | Complex text wrapping. Ship point text first, add later. |
| Clipping masks | Useful but can add in a future iteration. |
| Real-time collaboration | Major architecture investment. Not needed for v1 competitive feature set. |
| Freeform pen / pencil to vector | Converts freehand drawing to smooth vector paths. Complex smoothing algorithms. Add later. |

---

## Summary: Priority Order

| Priority | Section | Items |
|----------|---------|-------|
| **Must ship (Table Stakes)** | §1.1 | Vector object model & scene graph |
| | §1.2 | Selection tool |
| | §1.5 | Shape tools as vector objects |
| | §1.6 | Fill & stroke per object |
| | §1.13 | Transform with numeric input |
| | §1.12 | Groups |
| | §1.7 | Text tool |
| | §1.3 | Pen tool |
| | §1.4 | Direct selection tool |
| | §1.8 | Boolean operations |
| | §1.9 | Gradients |
| | §1.10 | SVG export |
| | §1.11 | Snapping & alignment |
| **Improvements** | §2.1 | Layers panel upgrade |
| | §2.2 | Color picker upgrade |
| | §2.3 | Zoom & pan improvements |
| | §2.4 | History improvements (operation-based undo) |
| | §2.5 | Export improvements |
| **Differentiators** | §3.1 | Zero-install instant start |
| | §3.2 | Clean, minimal UI + dark mode |
| | §3.3 | Cloud-native project management + SVG import |
| | §3.4 | Keyboard-first workflow + command palette |
