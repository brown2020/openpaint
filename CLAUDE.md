# CLAUDE.md — OpenPaint Codebase Documentation

## What This Is

OpenPaint is a **raster/bitmap painting application** built as a web app. It operates on pixel canvases using HTML5 Canvas 2D API. Users draw with brushes, erase, fill, and use basic shape tools — all operating on pixel data, not vector objects. Think MS Paint in a browser, not Adobe Illustrator.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 (App Router) |
| Language | TypeScript (strict mode) |
| UI | React 19, Tailwind CSS v4 |
| State | Zustand 5 (3 stores) |
| Auth | Firebase Auth (Client SDK) |
| Database | Firestore (Client SDK) |
| File Storage | Firebase Storage (Client SDK) |
| Deployment | Vercel |

**No server-side Firebase Admin SDK is used.** All Firebase operations happen client-side.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout (AuthProvider wrapper)
│   ├── page.tsx            # Single-page app (entire UI)
│   ├── error.tsx           # Error boundary
│   └── globals.css         # Tailwind + custom styles
├── components/
│   ├── auth/               # Authentication UI
│   ├── canvas/             # Canvas rendering (3 files)
│   ├── panels/             # Side panels (layers, status bar)
│   ├── projects/           # Project management modals
│   ├── toolbar/            # Top toolbar + tool panel + settings
│   └── ui/                 # Generic UI (Modal, LoadingSpinner)
├── hooks/                  # Custom React hooks (7 files)
├── lib/firebase/           # Firebase client SDK wrappers
├── store/                  # Zustand stores (3 files)
├── types/                  # TypeScript type definitions
└── utils/                  # Drawing utilities, color math, flood fill
```

## Architecture

**Single-page client app.** The entire UI lives in `src/app/page.tsx` as a `"use client"` component. There are no server components doing meaningful work, no API routes, and no Server Actions. The root layout is a Server Component but only wraps children in `AuthProvider`.

**State management:** Three Zustand stores:
- `authStore` — Firebase user, loading, error, initialized flags
- `canvasStore` — Tool state, canvas size, layers, history, zoom/pan, drawing state
- `projectStore` — Project list, current project, sync status, pending layer loads

**Canvas rendering:** Uses stacked HTML5 `<canvas>` elements — one per layer, plus a preview canvas for shape tools, plus an event capture canvas on top. All drawing happens via Canvas 2D API calls directly manipulating pixel data.

**Firebase integration:** Client SDK only. No Admin SDK, no route handlers validating tokens. Security relies entirely on Firestore/Storage security rules.

## Features — What Exists

### Drawing Tools
| Tool | Status | How It Works |
|------|--------|-------------|
| Brush | Working | Freehand pixel painting with configurable size, opacity, color. Pressure-sensitive (Pointer Events API). Round/square brush shapes. |
| Eraser | Working | Same as brush but uses `destination-out` composite mode. |
| Line | Working | Click-drag to draw a straight line. Shift constrains to 45° angles. |
| Rectangle | Working | Click-drag to draw a rectangle. Shift constrains to square. Alt draws from center. Fill and/or stroke. |
| Ellipse | Working | Same as rectangle but draws ellipses. Shift constrains to circle. |
| Fill (Bucket) | Working | Scanline flood fill algorithm with tolerance. Uses `Uint8Array` bitmap for performance. |
| Eyedropper | Working | Click to sample a pixel color and set it as the brush color. |
| Text | Declared in types/UI | The tool button exists and can be selected, but **no text rendering is implemented**. Clicking with the text tool does nothing. |
| Selection | Declared in types/UI | The tool button exists but **no selection logic is implemented**. |

### Canvas Features
| Feature | Status |
|---------|--------|
| Zoom (scroll wheel, buttons, keyboard) | Working |
| Pan (middle mouse drag) | Working |
| Custom brush cursor overlay | Working |
| Checkerboard transparency background | Working |
| Configurable canvas size (up to 4096x4096) | Working |

### Layers
| Feature | Status |
|---------|--------|
| Multiple layers | Working |
| Per-layer visibility toggle | Working |
| Per-layer opacity slider | Working |
| Per-layer lock toggle | Working |
| Layer reordering (up/down buttons) | Working |
| Duplicate layer | Working |
| Delete layer (minimum 1) | Working |
| Merge down | Working |
| Flatten all | Partial — creates new layer but doesn't composite content |
| Blend modes | Declared in types (`multiply`, `screen`, `overlay`, `darken`, `lighten`) but **only `source-over` is used in rendering** |

### History (Undo/Redo)
- Stores canvas snapshots as base64 PNG data URLs
- Max 50 history entries
- Undo restores the "before" snapshot to the canvas
- Memory-intensive for large canvases (each snapshot is a full PNG)

### Authentication
| Method | Status |
|--------|--------|
| Google OAuth (popup) | Working |
| Email + password sign up | Working |
| Email + password sign in | Working |
| Passwordless email link | Working (sends link, completes sign-in on return) |
| Sign out | Working |
| Auth state persistence | Working (Firebase handles it) |

Auth is optional — the app works without Firebase credentials using local-only mode.

### Cloud Projects
| Feature | Status |
|---------|--------|
| Create project (with name + canvas size presets) | Working |
| List user's projects (sorted by last modified) | Working |
| Open/load a project | Working |
| Save project (layers + thumbnail to Storage, metadata to Firestore) | Working |
| Auto-save (30s interval + 2s debounce on changes) | Working |
| Delete project (Firestore + Storage cleanup) | Working |
| Rename project (inline in project card) | Working |
| Project thumbnails | Working |
| Sync status indicator (synced/syncing/error/offline) | Working |

### Export
| Format | Status |
|--------|--------|
| PNG download | Working (composites all visible layers) |
| Open local image file | Working (creates new project sized to image) |
| Local save (localStorage fallback when not authenticated) | Working |
| SVG export | Not implemented |
| JPEG/WebP export | Not implemented |

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| B, E, L, R, O, G, I, T, M | Select tools |
| [ / ] | Decrease/increase brush size |
| Shift+[ / Shift+] | Decrease/increase opacity |
| Ctrl+Z / Ctrl+Shift+Z | Undo / Redo |
| Ctrl+S | Save |
| Ctrl+E | Export |
| Ctrl+Shift+N | New layer |
| Ctrl++/- / Ctrl+0 | Zoom in/out/reset |

## Data Model

### Firestore Collections

**`projects`** — One document per project:
```typescript
{
  userId: string,           // Owner's Firebase UID
  name: string,             // Project name
  createdAt: Timestamp,     // Server timestamp
  modifiedAt: Timestamp,    // Server timestamp
  canvasSize: { width: number, height: number },
  thumbnailUrl: string | null,
  layers: LayerMetadata[],  // Array of layer configs
  activeLayerId: string,
  version: string           // "1.0"
}
```

Each layer in the `layers` array:
```typescript
{
  id: string,
  name: string,
  visible: boolean,
  opacity: number,
  locked: boolean,
  blendMode: string,
  storageRef: string        // Path in Firebase Storage
}
```

### Firebase Storage Structure

```
users/{userId}/projects/{projectId}/
├── layers/
│   ├── {layerId1}.png
│   ├── {layerId2}.png
│   └── ...
└── thumbnail.png
```

Each layer is stored as a full PNG image. On save, every layer is re-uploaded. On load, layer images are downloaded and drawn to their respective canvas elements.

## Security Rules

**Firestore:** Auth required. Users can only read/write their own projects (userId == auth.uid). Creates validate required fields and canvas size limits. Updates cannot modify userId or createdAt.

**Storage:** Auth required. Users can only access their own path (`users/{userId}/...`). Uploads restricted to `image/png` under 10MB.

## Environment Variables

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

All `NEXT_PUBLIC_` — client-side only. No server-side secrets.

## Known Limitations & Rough Edges

1. **Purely raster** — Everything is pixel-based. No vector objects, no paths, no bezier curves. Shapes are burned into pixel data immediately.
2. **No object model** — Once something is drawn, it can't be selected, moved, or edited. The only recourse is undo.
3. **Text tool is a stub** — Button exists, tool can be selected, but nothing happens on canvas.
4. **Selection tool is a stub** — Same as text — declared but not implemented.
5. **Blend modes not rendered** — Types define multiply/screen/overlay etc. but `compositeToCanvas` only uses `source-over`.
6. **History is memory-heavy** — Each undo state is a full base64 PNG. 50 history entries on a 1920x1080 canvas could use ~1GB of memory.
7. **Save re-uploads everything** — Every save re-uploads all layer images. No diffing or incremental uploads.
8. **Flatten doesn't composite** — `flattenLayers()` creates a new empty layer but doesn't actually draw the composited content.
9. **No offline support** — Requires internet for Firebase operations. No service worker or local-first architecture.
10. **No collaboration** — Single-user editing only. No real-time sync.
11. **Single page, no routing** — Everything is in one `page.tsx`. No separate routes for projects, settings, etc.
12. **No SVG export** — Only PNG download. No vector output.
13. **No responsive/mobile design** — Fixed sidebar layout assumes desktop viewport.
14. **No dark mode** — Light gray theme only.
