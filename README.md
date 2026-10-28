# OpenPaint

A free, browser-based vector design tool for everyday screen graphics: logos, icons, diagrams, and simple UI assets. Guest mode works without signing in. Sign in to keep projects in Firebase. Live demo: [openpaint.vercel.app](https://openpaint.vercel.app/).

## Features

- Vector document (layers of rectangles, ellipses, lines, polygons, paths, text, groups, and images) rendered with Canvas 2D
- Tools: selection (move, resize, nudge), rectangle, ellipse, line, polygon, pen, brush, eraser, fill, eyedropper, text
- Properties panel (name, position, size, rotation, opacity, fill, stroke) and a color picker
- Layers panel: visibility, lock, delete, and drag-reorder of layers and objects
- Undo and redo
- Zoom and pan (Ctrl/Meta + wheel, middle-mouse pan)
- Export PNG (Ctrl+E) and SVG (Ctrl+Shift+E)
- Local save (Ctrl+S when no cloud project is open): downloads a version `2.0.0` JSON file and keeps a `localStorage` copy under `openpaint-project`. Open loads that JSON.
- Cloud projects for signed-in users: create, list, open, save, rename, delete, thumbnails, and debounced auto-save
- Auth: Google, email/password, email link, and password reset. Routes: `/`, `/login`, `/signup`, `/forgot-password`

Eraser deletes the object under the cursor. Fill sets that object's solid fill. Grouping, direct anchor editing, gradient authoring, and an on-canvas rotation handle are not in the UI yet. See `roadmap.md`.

## Tech stack

| Area | Choice | Version |
| --- | --- | --- |
| Framework | Next.js (App Router) | ^16.4.3 |
| UI | React, React DOM | ^19.3.1 |
| Language | TypeScript | 7.0.2 compiler (`@typescript/native`); 6.0 API package (`typescript`, from `@typescript/typescript6`) for ESLint |
| Styling | Tailwind CSS, `@tailwindcss/postcss` | ^4.3.3 |
| State | Zustand | ^5.0.16 |
| Backend | Firebase client SDK (Auth, Firestore, Storage) | ^13.1.0 |
| IDs | uuid | ^14.0.3 |
| Tests | Vitest, Vite, jsdom | vitest ^5.0.5, vite ^8.3.5, jsdom ^30.1.3 |
| Lint | ESLint, eslint-config-next | eslint ^10.13.0, eslint-config-next ^16.4.3 |

There is no Firebase Admin SDK, no API routes, and no AI provider in this repo. `tsc` is TypeScript 7. The `typescript` package stays on the 6.0 API because `typescript-eslint` (pulled in by `eslint-config-next`) does not load against TypeScript 7.

## Project structure

```
src/
  app/                       # Editor, /login, /signup, /forgot-password
  components/                # auth, canvas, panels, projects, toolbar, ui
  hooks/                     # Tools, autosave, projects, keyboard shortcuts
  store/                     # authStore, canvasStore, documentStore, projectStore
  lib/
    firebase/                # config, auth, firestore, storage
    vector/                  # renderer, hit testing, svg export
    projects/                # local JSON snapshot
    security/
firestore.rules
firestore.indexes.json
storage.rules
firebase.json
cors.json
.github/workflows/ci.yml
```

## Getting started

### Prerequisites

- Node.js 22 (the version CI uses) or a current LTS
- npm
- A Firebase project if you want auth and cloud save. Drawing works without it.

The Firebase JS SDK declares `engines.node >= 24.12.0`. `npm install` on Node 22 prints `EBADENGINE` warnings. CI stays on Node 22 because the app still installs, tests, and builds there.

### Install

```bash
git clone https://github.com/brown2020/openpaint.git
cd openpaint
npm install
```

### Environment variables

Create `.env.local`. These names are public web-config keys. Do not commit real values.

| Name | Purpose |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Web app ID |

`src/lib/firebase/config.ts` treats Firebase as configured only when the API key, auth domain, and project ID are set. Without them the editor stays in local mode.

CI can also receive `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`. The app does not read that name.

### Firebase setup

1. Create a Firebase project and a Web app. Copy the config names above into `.env.local`.
2. Enable the Auth providers you use: Google, Email/Password, and Email link.
3. Deploy rules and indexes from this repo. The Next.js host does not deploy them.

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

- `firestore.rules` — `projects/{projectId}` owned by `userId`, integer canvas size from 1 to 4096
- `firestore.indexes.json` — `projects` index on `userId` ASC and `modifiedAt` DESC
- `storage.rules` — `users/{userId}/projects/{projectId}/**`, content type exactly `image/png`, under 10MB

4. Apply Storage CORS from `cors.json`. The Firebase CLI does not deploy it. Replace the bucket with your own.

```bash
gsutil cors set cors.json gs://YOUR_BUCKET
```

`cors.json` allows every origin and the methods Storage uploads need. Security rules still require the owning user.

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
| `npm run typecheck` | `tsc --noEmit` (TypeScript 7) |
| `npm test` | Vitest once (`vitest run`) |

## Testing and CI

Vitest covers vector helpers, SVG export, local project JSON, document history, auth/session helpers, security headers, deploy config, sync dirty marking, and the projects hook.

GitHub Actions (`.github/workflows/ci.yml`) runs on pushes to `dev` and `main`: `npm ci`, lint, typecheck, test, and build on Node 22. Firebase `NEXT_PUBLIC_*` values come from GitHub Actions secrets.

## Deployment

Deploy as a Next.js app. Set the same `NEXT_PUBLIC_FIREBASE_*` names on the host. Deploy Firestore and Storage rules with the Firebase CLI when those files change, and apply `cors.json` with `gsutil` when that file changes.

## Contributing

1. Branch from `dev`.
2. Keep `documentStore` and `VectorCanvas` as the canvas path.
3. Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` before opening a PR.
4. Do not commit secrets or `.env*.local` files.

Product behavior is in `spec.md`. Next work is in `roadmap.md`. Agent workflow is in `AGENTS.md`.

## License

[GNU Affero General Public License v3.0](LICENSE.md) (AGPL-3.0).
