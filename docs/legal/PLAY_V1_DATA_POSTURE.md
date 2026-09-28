# Suecão — Play v1 Data Posture (REL-LEGAL-01D1)

**Status:** FROZEN — internal release evidence (NOT a Privacy Policy)
**Product:** Suecão
**Owner:** Francisco Bexiga
**Brand:** OXS — Oeiras Xtreme Software
**Baseline:** `a6f14fde3e015074eea1bd899a3f07650f394d6d` + REL-LEGAL-01D1 changes
**Contact:** `frankbex.dev@gmail.com`
**Governing law (product Terms):** Portugal + applicable EU law

This document freezes the **shipping Play v1** privacy/data posture.
Do not treat planned Auth/Sync/MP/ads/remote-music as current shipping behaviour.

---

## Frozen product decisions

| Area | Play v1 |
|------|---------|
| Account / Auth / Sync | **OFF** — guest / local-first only |
| Conta UI | Soft-hidden unless Auth fully configured at build (`VITE_AUTH_API_BASE_URL` + Google client IDs) |
| Multiplayer | **OFF** (`VITE_MULTIPLAYER_ENABLED=false`) |
| Firebase RTDB | Does not initialize while MP flag is false |
| Remote music (R2/CDN) | **OFF** — bundled/local music only |
| Ads / IAP | **OFF** (`VITE_ADS_ENABLED=false`; IAP stub unwired) |
| Analytics / crash SDKs | **NONE** |
| Children | Not specifically directed to children; no age gate in Play v1 |
| Account deletion | Not a shipping feature (Conta OFF). Soft-delete / sync purge debt before future Auth release |

---

## Release env matrix (effective Play Android build)

Build path: `vite build --mode android` → `.env.android` (+ CI must not inject Auth/music).

| Feature | Play v1 expected | Env/config | Runtime reachable? |
|---------|------------------|------------|--------------------|
| Auth / Account API | OFF | No `VITE_AUTH_API_BASE_URL` | No |
| Google Sign-In | OFF | Conta soft-hide; Capgo not invoked from UI | No (UI) |
| Sync HTTP | OFF | Requires Auth session + API base | No |
| Multiplayer | OFF | `VITE_MULTIPLAYER_ENABLED=false` | No |
| Firebase RTDB | OFF | Init gated on MP flag | No |
| Remote music | OFF | No `VITE_MUSIC_REMOTE_BASE_URL` | No |
| Ads | OFF | `VITE_ADS_ENABLED=false` | No |
| IAP | OFF | Billing stub | No |
| External AI | OFF on Android | `VITE_USE_LOCAL_AI_ONLY=true` | No |
| Analytics | NONE | No SDK wired | No |
| Crash reporting | NONE | No SDK wired | No |

### Accidental re-enable risks

- Injecting `VITE_AUTH_API_BASE_URL` into a Play build would show Conta and enable Auth/Sync paths — **forbidden for Play v1**.
- Setting `VITE_MULTIPLAYER_ENABLED=true` would initialize Firebase when Online is used — **forbidden**.
- Setting `VITE_MUSIC_REMOTE_BASE_URL` would fetch remote catalog/audio — **forbidden**.
- Setting `VITE_ADS_ENABLED=true` would enable ad slot logic (SDK still stub) — **forbidden**.

---

## What is stored on-device (local only)

Typical categories (localStorage / Capacitor Filesystem / IndexedDB):

- Local guest id, preferences, themes, card front/back, audio volumes, music mode
- Match history, stats, saved/pinned sessions
- Optional Card Intelligence diagnostic logs (IndexedDB; not remote telemetry)
- Music file cache when tracks were previously downloaded (Play v1: bundled sources only)

Clearing app data / uninstall removes on-device stores.  
Selective wipe (`clearLocalUserData`) exists for Conta “also delete local data” — Conta is not offered in Play v1.

### Wipe gaps (deferred to REL-LEGAL-01D3 if Conta ships)

Not cleared by `clearLocalUserData` today: card front/back, deal animation speed, ads counter, Card Intelligence IndexedDB. Language intentionally preserved.

---

## What is NOT collected off-device in Play v1

- No Suecão Account / email / Google identity stored on Suecão servers from the Play build
- No cloud sync of history/prefs
- No multiplayer room data
- No analytics / Crashlytics / Sentry events
- No remote music CDN requests
- No ads / ad ID use by app code (Play v1 also strips merged AD_ID / AdServices / install-referrer permissions via `scripts/apply-android-play-v1-permissions.mjs`)

---

## Network access still present

| Access | Why |
|--------|-----|
| `INTERNET` permission | Required for WebView / HTTPS stack; Play v1 does not call Auth/MP/remote music |
| Bundled assets | Local / packaged in APK |
| Optional future | Auth, sync, CDN, MP — deferred |

No camera, microphone, location, contacts, or broad storage permissions in main app manifest.

---

## Android backup

- Current Capacitor main manifest: `android:allowBackup="true"`.
- Recommendation (not changed in 01D1): evaluate `allowBackup="false"` or a backup exclude rule for WebView/localStorage before public release, so OS cloud backup does not unexpectedly copy local guest career data. Needs release-safe validation.

---

## Deferred before public Auth/Sync

1. Hard purge of Account + ExternalIdentity  
2. Hard purge of sync history / prefs / seed rows  
3. Accurate deletion retention policy in Privacy Policy  
4. Conta re-enable only after the above  

---

## Play Data Safety pre-map (internal worksheet)

**Not final Console answers.** Marked where store terminology needs confirmation.

| Play category (approx.) | Play v1 posture | Notes |
|-------------------------|-----------------|-------|
| Personal info | Not collected off-device | Guest-only; Conta OFF |
| App activity | Processed **on device**; not shared | History/stats local |
| App info and performance | No crash/analytics SDK | Local CI logs ≠ remote diagnostics |
| Device or other IDs | Local guest UUID on device only | AD_ID permission stripped for Play v1 |
| Data shared with third parties | None by Suecão app flows | Google Play / OS may still process install metadata — NEEDS STORE REVIEW |
| Collected (off-device) by developer | **No** for Play v1 shipping features | NEEDS STORE REVIEW vs purely local processing wording |
| Optional vs required | All cloud features absent | Core play works offline after install |
| Deletion | Uninstall / clear app data | No cloud account to delete |

`frankbex.dev@gmail.com` — public privacy / support contact (REL-LEGAL-01D2).

Privacy Policy / Terms: see `PRIVACY_POLICY.md` and `TERMS_OF_USE.md`. Console Data Safety remains open under REL-LEGAL-01D3.

---

## Related docs

- `docs/plan/ROADMAP_TO_RELEASE.md` — REL-LEGAL-01
- `docs/plan/AUTH_RELEASE_BASELINE_01F.md` — Auth parked
- `docs/plan/SYNC_V1_CONTRACT.md` — Sync parked
- `docs/legal/PRIVACY_POLICY.md` · `docs/legal/TERMS_OF_USE.md` — public legal text (01D2)
- Play Console Data Safety — **open** (REL-LEGAL-01D3)
