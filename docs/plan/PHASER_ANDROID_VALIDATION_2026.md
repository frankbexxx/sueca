# Phaser Android / Capacitor validation · 2026

**Date:** 2026-09-07  
**Baseline commit (pre-F tweaks):** `3f28471` `feat(renderer): improve phaser sueca table ux`  
**Scope:** Sueca solo Phaser via Capacitor Android debug APK. DOM remains default. Phaser only with `?renderer=phaser` (activated in WebView via Chrome DevTools Protocol navigation).

## Environment

| Item | Value |
|------|-------|
| Device | **Emulator** `Suecao_API34` (Pixel 6 profile) — **DEVICE REAL NÃO VALIDADO** |
| Model | `sdk_gphone64_x86_64` |
| Android | **14** (API 34) |
| JDK | OpenJDK **21.0.2** (`C:\Users\frank\.jdks\openjdk-21.0.2-3`) |
| Gradle | **8.2.1** (wrapper) |
| AGP | **8.2.1** |
| compileSdk / targetSdk / minSdk | **34 / 34 / 22** |
| Capacitor | **6.2.x** (`appId` `com.suecao.cardgames`, `webDir` `build`) |
| `android/` | Generated locally; **gitignored** (`frontend/.gitignore` → `/android`) |
| WebView | Chrome/113 (Capacitor) |

## Build / install

| Step | Result |
|------|--------|
| `build:android` web (manual PowerShell equiv. of bash script) | PASS — Phaser chunk **~312 kB** gzip (`289.*.js`) |
| `npx cap add android` + `cap sync android` | PASS |
| `gradlew assembleDebug` | PASS |
| APK | `frontend/android/app/build/outputs/apk/debug/app-debug.apk` ≈ **26.9 MB** |
| `adb install` + launch | PASS |

## Phaser activation (Capacitor)

Query `?renderer=phaser` is **not** present on cold start (`https://localhost/`).  
Validation used WebView CDP: `Page.navigate('https://localhost/?renderer=phaser')`.  
No product default change. Scene debug hook also exposed when `renderer=phaser` (for QA on production builds).

## Functional results

| Check | Result |
|-------|--------|
| App launch | PASS |
| Phaser active (badge + canvas) | PASS |
| Full hand / Continue / Round End | PASS |
| 3 consecutive hands | PASS (Jogo 2→3→4 Completo with scores) |
| Tap / legal play via model | PASS |
| Drag (finger Input) | **PARTIAL** — code path present; exercised via play API, not separate gesture harness |
| Pause / Retomar | PASS — 1 canvas retained |
| Portrait resize (`wm size`) | PASS — natural Capacitor viewport → `aspect: portrait` after host-height fix; 1 canvas |
| Landscape resize | PASS — `aspect: landscape` |
| Rotation (`user_rotation`) | PASS — 1 canvas, no duplicate |
| Background / foreground | PASS — hand/trick state retained; Capacitor `appStateChange` logged |
| DOM without Phaser | PASS — no canvas / no Phaser badge; dealing UI OK |
| WebGL / crash blockers | None observed in sampled logcat |

## Issues found / fixes

1. **Mobile portrait host too short** (`56vh`) → Phaser `aspect` stayed `desktop` on tall WebViews.  
   **Fix:** raise mobile host to `min(70vh, 680px)` in `SuecaPhaserRenderer.css`.
2. **QA hook** only under `NODE_ENV=development` blocked Android production-build automation.  
   **Fix:** also expose `__suecaPhaserScene` when `?renderer=phaser`.

## Not validated

- Physical Android device
- Release/signing / Play Store
- Sustained FPS profiler / memory profiler charts
- Capote fixture
- Spades/Hearts/King Phaser

## Verdict

**F VALIDADO EM EMULATOR** (with documented gaps for real device and full finger-drag harness).

## Blockers before Phaser default

1. Real mid-range Android device pass (touch + GPU + lifecycle)
2. First-run Phaser activation UX (deep link / settings) without baking default
3. Theme/asset parity beyond tokens
4. Capacitor 6→8 / toolchain modernization when shipping store builds
5. Confirm portrait layout + HUD overlap across more OEMs
