# Project: Next.js Mobile Performance Refactoring (Jida Buddhist Society)

## Architecture
- **Framework**: Next.js 15.2.0 (App Router), React 19, TypeScript, Tailwind CSS.
- **Graphic Stack**: Three.js, React Three Fiber (R3F), Drei, WebGPU (LiquidOrb), HTML5 2D Canvas (Karesansui), Framer Motion.
- **Core Pattern**: Server Component Shell + Selective Hydration Islands + Web Worker Offloading + GPU Hardware Shaders + Dynamic Throttling.
- **Dual Track**:
  - **Implementation Track**: Iterative milestone execution (M1 through M5) by specialist workers.
  - **E2E Testing Track**: Independent, requirement-driven opaque-box test suite (Tiers 1–4) covering R1–R5, publishing `TEST_READY.md`.

---

## Feature Inventory

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | E2E Test Suite & Test Runner | 4-tier test suite covering SSR shell, bundle size, scroll physics, 3D throttling, and visual preservation | M-TEST | Requirement-driven |
| 2 | Server Component Shell (`PageWrapper` & `page.tsx`) | De-client `PageWrapper.tsx`, convert `/dashboard/page.tsx` to async Server Component rendering wallpaper & header directly into initial HTML | M1 | R1, Survey |
| 3 | Selective Client Hydration (`DashboardClient.tsx`) | Encapsulate interactive state, 3D card, and tabs into lightweight client island | M1 | R1, Survey |
| 4 | AuthGuard SSR Decoupling | Allow Server Component to render shell without blocking `{children}` with loading spinner | M1 | R1, Survey |
| 5 | Session Extraction via Cookies | Read `jbs_session_token` cookie via `next/headers` on the server for initial state | M1 | R1, Survey |
| 6 | Scroll Reflow Fix in `Dashboard3DMenu` | Cache `getBoundingClientRect()`, add `{ passive: true }`, debounce/throttle via RAF | M2 | R2, Survey |
| 7 | Canvas 2D Reflow Fix in `KaresansuiBackground` | Remove redundant `getBoundingClientRect()`, batch touch coordinates via RAF, bypass during vertical momentum scroll | M2 | R2, Survey |
| 8 | Living Bodhi Tree CSS Keyframe Migration | Convert 12 particles and 10 leaf rotations from Framer Motion JS ticker to pure hardware CSS keyframes | M2 | R2, R5, Survey |
| 9 | Web Worker Image Compression | Offload avatar photo resizing & compression away from main UI thread via Web Worker / OffscreenCanvas | M2 | R2, Survey |
| 10 | LiquidOrbButton Dynamic Splitting | Code-split 89.5 KB WebGPU module with `dynamic({ ssr: false })` and provide lightweight mobile CSS/Canvas aura | M3 | R3, Survey |
| 11 | QRModal `jsPDF` On-Demand Loading | Dynamically import `jsPDF` only upon PDF download click instead of bundling in modal | M3 | R3, Survey |
| 12 | Inactive Tab Dynamic Imports | Dynamically chunk `Leaderboard` and `DharmaBadges` tabs so only active `TimelineView` is loaded initially | M3 | R3, Survey |
| 13 | Timeline DOM Virtualization & Memoization | Memoize timeline entries and limit initial render DOM nodes to prevent layout recalculation penalties | M3 | R3, Survey |
| 14 | GPU Vertex Shader for `InkWater` | Move 25,921 vertex wave calculation from CPU JS loop to GPU vertex shader in `LotusSeaCanvas.tsx` | M4 | R4, R2, Survey |
| 15 | Viewport & Tab Suspension (`useCanvasVisibility`) | Automatically suspend 3D canvas frameloop (`demand`/pause) when canvas is scrolled off-screen or tab is hidden | M4 | R4, Survey |
| 16 | Dynamic Mobile DPR Clamping | Clamp DPR to 1.0 on mobile, reduce particle counts (5,000 on mobile for IonSun), disable heavy Bloom on mobile | M4 | R4, Survey |
| 17 | `LoginZenScene` State Churn Fix | Eliminate `useState` call inside 60 FPS `useFrame` in `PavilionWithLanterns`, mutate light ref directly | M4 | R4, Survey |
| 18 | `useIsMobile` SSR Hydration Race Fix | Eliminate desktop graphic buffer allocation burst on initial mobile mount | M4 | R4, Survey |
| 19 | Member Card Visual Integrity Preservation | Preserve golden pulse shimmer layer (`blur-2xl`) and 6-layer diamond starburst lens flare with GPU layer isolation (`translateZ(0)`) | M5 | R5, Survey |
| 20 | Family Wallpaper Visual Integrity Preservation | Ensure `/dashboard-wallpaper.jpg` remains fully visible at `z-index: 0` with saturated filter and gradient overlay | M5 | R5, Survey |
| 21 | Full Build & TypeScript Verification | Ensure `npm run build` and `npx tsc --noEmit` exit with status 0 and 0 errors | M5 | R5, Acceptance Criteria |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M-TEST | E2E Testing Track | Independent 4-Tier test suite & verification harness; publishes `TEST_READY.md` | none | IN_PROGRESS |
| M1 | SSR Shell & Selective Hydration | `PageWrapper.tsx`, `/dashboard/page.tsx`, `DashboardClient.tsx`, `AuthGuard.tsx` | none | IN_PROGRESS |
| M2 | Scroll Physics & Main Thread Offloading | `Dashboard3DMenu.tsx`, `KaresansuiBackground.tsx`, `LivingBodhiTree.tsx`, avatar Web Worker | M1 | PLANNED |
| M3 | Code Splitting & DOM Payload Reduction | `LiquidOrbButton.tsx`, `QRModal.tsx`, dynamic tab loading, `TimelineView` memoization | M1 | PLANNED |
| M4 | Hardware-Aware 3D & WebGL Throttling | `LotusSeaCanvas.tsx` GPU shader, `useCanvasVisibility.ts`, DPR clamping, `LoginZenScene.tsx` | none | IN_PROGRESS |
| M5 | Final Verification & Adversarial Hardening | 100% E2E test suite pass, mobile CPU throttling emulation, visual preservation checks, build & typecheck | M-TEST, M1, M2, M3, M4 | PLANNED |

---

## Interface Contracts

### 1. SSR Server Shell ↔ `DashboardClient`
- File: `src/app/dashboard/DashboardClient.tsx`
- Props:
  ```ts
  export interface DashboardClientProps {
    initialMemberId?: string;
    initialTab?: "history" | "leaderboard" | "badges";
  }
  ```
- Contract:
  - `page.tsx` (Server Component) renders `<PageWrapper page="dashboard">`, `<PageHeader />`, and server skeleton card.
  - `page.tsx` embeds `<DashboardClient initialMemberId={...} />`.
  - `DashboardClient` mounts on client, connects to `MemberContext`, and manages interactive states, 3D tilt, modals, and tab switches without triggering full page layout re-renders.

### 2. Viewport Canvas Suspension Contract
- Hook: `src/hooks/useCanvasVisibility.ts`
- Signature:
  ```ts
  export function useCanvasVisibility(containerRef: React.RefObject<HTMLElement | null>): boolean;
  ```
- Contract:
  - Returns `true` when container intersects the viewport AND document is not hidden (`!document.hidden`).
  - Returns `false` when off-screen or tab is backgrounded.
  - Used by R3F Canvas components to set `frameloop={isActive ? "always" : "demand"}` or clamp frame updates.

### 3. Web Worker Image Compression Contract
- Worker: `src/workers/imageCompression.worker.ts`
- Message Protocol:
  ```ts
  // Input:
  { id: string; file: Blob; maxWidth: number; maxHeight: number; quality: number }
  // Output:
  { id: string; success: boolean; dataUrl?: string; error?: string }
  ```
- Contract:
  - Executes image decoding and canvas downscaling in background thread via `createImageBitmap` / `OffscreenCanvas`.
  - Main thread remains 100% responsive during camera photo upload.

### 4. GPU Water Shader Contract (`LotusSeaCanvas`)
- Uniform: `uTime` (float) updated once per frame.
- Geometry: `PlaneGeometry` with analytical normals computed in GPU vertex shader.

---

## Code Layout

```
src/
├── app/
│   ├── layout.tsx                     # Root layout (AuthGuard decoupled from blocking SSR)
│   ├── globals.css                    # Hardware composite layer isolation classes (.page-bg-dashboard)
│   └── dashboard/
│       ├── page.tsx                   # [M1] Async Server Component Shell (Instant HTML paint)
│       └── DashboardClient.tsx        # [M1] Client Hydration Island (Interactive state, 3D card)
├── components/
│   ├── PageWrapper.tsx                # [M1] Server Component rendering /dashboard-wallpaper.jpg & mandala
│   ├── AuthGuard.tsx                  # [M1] Non-blocking SSR auth listener
│   ├── Dashboard3DMenu.tsx            # [M2] Touch-optimized menu (cached rect, passive listener, RAF)
│   ├── KaresansuiBackground.tsx       # [M2] Throttled 2D canvas (RAF batching, scroll bypass, DPR clamp)
│   ├── LivingBodhiTree.tsx            # [M2] CSS hardware keyframes for particles & leaves
│   ├── LiquidOrbButton.tsx            # [M3] Dynamically imported with lightweight mobile fallback
│   ├── QRModal.tsx                    # [M3] On-demand dynamic import of jsPDF
│   ├── LotusSeaCanvas.tsx             # [M4] GPU-accelerated water vertex shader & mobile DPR clamp
│   ├── LoginZenScene.tsx              # [M4] Ref-based lighting mutation (0 React state in useFrame)
│   └── shaders/
│       └── InkWaterShader.ts          # [M4] GPU vertex & fragment shader definitions
├── hooks/
│   ├── useCanvasVisibility.ts         # [M4] Viewport intersection & visibility suspension hook
│   └── useIsMobile.ts                 # [M4] Synchronous media query evaluation hook
├── workers/
│   └── imageCompression.worker.ts     # [M2] Web Worker for off-thread mobile photo compression
tests/
└── e2e/
    ├── runner.ts                      # [M-TEST] Automated test runner
    ├── tier1-features.test.ts         # [M-TEST] Tier 1: Feature coverage
    ├── tier2-boundaries.test.ts       # [M-TEST] Tier 2: Boundary & corner cases
    ├── tier3-combinations.test.ts     # [M-TEST] Tier 3: Cross-feature interactions
    └── tier4-workloads.test.ts        # [M-TEST] Tier 4: Real-world mobile application scenarios
```
