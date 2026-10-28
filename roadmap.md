# roadmap.md — OpenPaint punchlist

Next steps, known bugs, and open issues. Current behavior is `spec.md`. Do not treat this file as a commitment to ship everything in it.

**Last aligned with the codebase:** 2026-10-28 on `dev`.

## Next steps

Ordered by user value. Each item is one reviewable change on `dev`.

### 1. Group and ungroup

Ctrl+G groups the selection into a `group` object. Ctrl+Shift+G ungroups. Move and resize use the group bounds. The layers panel can expand a group. The model and renderer already draw groups.

### 2. Direct selection

A tool selects anchors on one path. Drag an anchor to move it, drag a handle to reshape the curve, double-click a segment to insert a point, and Delete to remove an anchor.

### 3. Remove the unused raster path

`canvasStore` still keeps layer canvas maps and PNG snapshot history. `VectorCanvas` does not read them. Delete or isolate that state once nothing imports it. Toolbar Clear already clears the active vector layer.

### 4. Later, already sketched in the model or earlier planning

- Gradient fill controls in the Properties panel (renderer and SVG export already draw gradients)
- Boolean path operations
- Snapping and smart guides
- Command palette
- JPEG export
- A project dashboard route
- Dark mode
- A layout that works on a narrow screen
- Real-time collaboration

## Known bugs and limits

- Eraser deletes the whole object under the cursor. It does not erase part of a stroke.
- Fill paints the hit object's solid fill. It does not flood-fill pixels.
- Rotation is a Properties field. There is no on-canvas rotation handle.
- Text can be re-edited by double-clicking it. The Properties panel does not reopen the inline editor.
- Local save downloads JSON and writes `localStorage`. If `localStorage` is full, the download still runs and the backup error is only logged.
- Sign-out does not flush an in-flight auto-save. Rules still reject a write for a different user.
- Cloud save re-uploads every layer PNG.
- Legacy cloud projects with no `vectorLayers` import Storage PNGs as locked images. That fetch needs bucket CORS. Vector reopen does not.
- Content Security Policy allows inline and eval scripts so Next.js and Firebase can boot. It does not use nonces.
- Automated tests do not drive canvas pointer gestures.

## Open issues

- Confirm the live Storage bucket CORS matches `cors.json`. At the last promotion, `gsutil cors set` was still pending. Vector save of PNGs from a new origin fails until the bucket allows that origin. Firestore rules, indexes, and Storage rules from `b82ec6b` were already deployed then. This repo does not deploy them.
- Firebase JS packages warn `EBADENGINE` on Node 22 (`engines.node >= 24.12.0`). CI is Node 22 and the production build passes. Leave the CI Node version until an install or build actually fails.
- TypeScript 7 is the `tsc` binary (`@typescript/native`). The `typescript` dependency stays on the 6.0 API (`@typescript/typescript6`) because `typescript-eslint` refuses to load TypeScript 7. Drop the side-by-side install when `eslint-config-next` supports TypeScript 7.
- `firebase-admin` is not a dependency. Do not add a `jwks-rsa` / `jose` override unless that package is introduced.
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` may be present in CI secrets. `src/lib/firebase/config.ts` does not read it.
