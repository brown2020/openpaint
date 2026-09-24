# OpenPaint

A free, browser-based vector design tool for everyday screen graphics — logos, icons, diagrams, and simple UI assets — with optional cloud save via Firebase. Guest mode works without signing in; sign in to sync projects. Live demo: [openpaint.vercel.app](https://openpaint.vercel.app/).

## Features

Verified from the current codebase:

- Vector document model (layers + typed objects: rectangle, ellipse, line, polygon, path, text, group, image) rendered with Canvas 2D
- Tools: selection (move/resize/nudge), shapes, brush (freehand paths), pen (corner/smooth points), text (inline editor), eyedropper, fill (object fill), eraser (deletes whole object under cursor)
- Properties panel (name, position, size, rotation, opacity, fill/stroke) and color picker with presets
- Layers panel: visibility, lock, delete, drag-reorder of layers and objects
- Undo/redo (operation-based history on `documentStore`)
- Zoom/pan (Ctrl/Meta + wheel; middle-mouse pan)
- Export PNG composite and SVG
- Guest-first UX with dismissable cloud sign-in banner; local JSON / `localStorage` projects without auth
- Cloud projects (CRUD + thumbnails + auto-save) for signed-in users via Firestore + Storage
- Auth: Google popup, email/password, email link (passwordless), password reset; routes `/login`, `/signup`, `/forgot-password`

## Tech stack

| Area | Choice | Version (package.json) |
| --- | --- | --- |
| Framework | Next.js (App Router) | 16.3.5 |
| UI | React | ^19.2.7 |
| Language | TypeScript | ^6.0.3 |
| Styling | Tailwind CSS + `@tailwindcss/postcss` | ^4.3.2 |
| State | Zustand | ^5.0.14 |
| Backend | Firebase (Auth, Firestore, Storage) client SDK | ^12.16.0 |
| IDs | uuid | ^14.0.1 |
| Tests | Vitest + jsdom | vitest 4.1.11 |
| Lint | ESLint 9 + eslint-config-next | — |

No Stripe or AI providers in this repo.

## Project structure

```
src/
  app/
    page.tsx                 # Editor shell
    login|signup|forgot-password/
    layout.tsx               # AuthProvider wrapper
  components/
    auth/ canvas/ panels/ projects/ toolbar/ ui/
  hooks/                     # Tools, autosave, projects, keyboard shortcuts
  store/                     # authStore, canvasStore, documentStore, projectStore
  lib/
    firebase/                # config, auth, firestore, storage
    vector/                  # renderer, hitTest, svgExport, penPath, …
    sync/ security/
  types/
firestore.rules
storage.rules
firebase.json
cors.json                    # Storage CORS for localhost + production origin
.github/workflows/ci.yml
```

## Getting started

### Prerequisites

- Node.js 22 (matches CI) or a current LTS
- npm
- A Firebase project (optional for local drawing; required for auth/cloud save)

### Clone and install

```bash
git clone https://github.com/brown2020/openpaint.git
cd openpaint
npm install
```

### Environment variables

Create `.env.local` with public Firebase web config (never commit real values):

| Name | Purpose | Where to get it |
| --- | --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web API key | Firebase Console → Project settings → Your apps |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Auth domain | Same |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Project ID | Same |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage bucket | Same |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID | Same |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App ID | Same |

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

`src/lib/firebase/config.ts` treats Firebase as configured only when API key, auth domain, and project ID are set. Without them, the editor still loads in local/guest mode (`isFirebaseConfigured === false`).

CI also accepts an optional `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` secret; it is not read by `config.ts` today.

### Firebase setup

1. Create a Firebase project and a Web app; copy the config into `.env.local`.
2. Enable Auth providers you need: Google, Email/Password, and Email link if desired.
3. Deploy rules from this repo:
   - `firestore.rules` — `projects/{projectId}` owned by `userId`
   - `storage.rules` — `users/{userId}/projects/{projectId}/**` (PNG under 10MB)
4. Apply Storage CORS from `cors.json` for `http://localhost:3000` and `https://openpaint.vercel.app` as needed.
5. `firebase.json` points at those rules and the Storage bucket name used by the project.

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Next.js development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest (`vitest run`) |

## Testing and CI

- Vitest coverage includes vector helpers (bounds, pen path, SVG export, text, reorder, legacy import), document dirty sync, route protection, projects hook, guest banner, and `documentStore`.
- CI (`.github/workflows/ci.yml`): on push to `dev`/`main` and on pull requests — `npm ci`, lint, typecheck, test, build (Node 22). Firebase `NEXT_PUBLIC_*` values come from GitHub Actions secrets (never literals in the workflow).

## Deployment

Deploy as a Next.js app (demo: [openpaint.vercel.app](https://openpaint.vercel.app/)). Set the same `NEXT_PUBLIC_FIREBASE_*` env vars in the host. Deploy Firestore/Storage rules with the Firebase CLI when rules change.

## Contributing

1. Branch from `dev`.
2. Keep the vector scene graph (`documentStore` + `VectorCanvas`) as the single canvas path.
3. Run `npm run lint`, `npm run typecheck`, and `npm test` before opening a PR.
4. Never commit secrets or `.env*.local` files.

## License

[GNU Affero General Public License v3.0](LICENSE.md) (AGPL-3.0).
