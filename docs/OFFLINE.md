# Offline play (v1)

## Solo mode

All four variants run **entirely in the browser** (no server required for rules or local AI).

- Set `REACT_APP_USE_LOCAL_AI_ONLY=true` (default in `.env.example`).
- Card images ship in `frontend/public/assets/cards2/` (SVG placeholders until commercial pack).

## What needs network

| Feature | Offline |
|---------|---------|
| Sueca / Spades / Hearts / King vs bots | Yes |
| External AI (`/play`) | No (disabled) |
| Multiplayer | No (requires `REACT_APP_MULTIPLAYER_ENABLED` + backend) |
| Ads | No (loads SDK when enabled) |

## Capacitor

The Android APK bundles the CRA `build/` output; solo play works in airplane mode after install.

## Bundle audit

```bash
cd frontend && npm run build
du -sh build/static/js/*
```

Target: main JS gzip &lt; 500 KB for v1 (audit after adding Capacitor plugins).
