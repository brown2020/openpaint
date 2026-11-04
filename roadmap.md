# roadmap.md — OpenPaint punchlist

Next steps, known bugs, and open issues. Current behavior is `spec.md`. Do not treat this file as a commitment to ship everything in it.

**Last aligned with the codebase:** 2026-11-04 on `dev`.

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
- CI and local validation use Node 24. The Firebase JS SDK declares `engines.node >= 24.12.0`. Node 22 still installs, with `EBADENGINE` warnings.
- `typescript` stays on 6.0.3. TypeScript 7 has no compiler API, and `typescript-eslint@8.72.1` peers `typescript >=4.8.4 <6.1.0`.
- `@types/node` stays on 24.x (`^24.19.2`) to match the Node 24 runtime. Latest on npm is 26.x.
- `minimatch` 10 is overridden to `11.0.4` (GHSA-g3hv-75wg-m249). `minimatch@3.1.5` remains under `eslint-plugin-import`, `eslint-plugin-jsx-a11y`, and `eslint-plugin-react`. Those plugins call the v3 function export, and minimatch 11 only exposes named exports, so a blanket override breaks lint. No patched 3.x exists. `npm audit` still reports those five moderate findings. Do not downgrade `eslint-config-next` to clear them.
- `postcss` stays overridden to `8.5.32` and `@grpc/grpc-js` to `1.14.7` (the current latest of each pin).
- `firebase-admin` is not a dependency. Do not add a `jwks-rsa` / `jose` override unless that package is introduced.
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` may be present in CI secrets. `src/lib/firebase/config.ts` does not read it.
