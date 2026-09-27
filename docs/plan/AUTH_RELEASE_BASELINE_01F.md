# AUTH release baseline (AUTH-01F / REL-AUTH-01)

**Status:** REL-AUTH-01 **DONE** (AUTH-01A–F closed).  
**Sync:** REL-SYNC-01 **READY / UNBLOCKED · NOT STARTED**.

## Identity layers (must stay separate)

| Layer | Role |
|-------|------|
| **LocalGuest** | Durable device identity (`sueca-local-guest-v1`); independent of login |
| **Suecão Account** | Server account (`accounts`); Suecão owns session |
| **ExternalIdentity** | Google proof (`provider` + `provider_subject` unique); email is **not** PK |
| **Gameplay player slot** | P1 display / table seat; unrelated to Account id |

Multiplayer guest JWT (`POST /auth/guest` + WS) remains **isolated** from Account auth.

## Platform flows

### Web
Google Identity Services `renderButton` → ID token (+ raw nonce) → `POST /auth/google/id-token` → Suecão access (memory) + refresh (temporary `localStorage`).

### Android
Capgo Credential Manager → Google ID token (+ raw nonce) → same backend → access (memory) + refresh (**Android Keystore** via Aparajita Secure Storage; **not** Preferences / localStorage).

## Session security

| Concern | Rule |
|---------|------|
| Access | Short-lived Suecão JWT (`typ=suecao_access`); memory-first; `token_version` (`tv`) checked |
| Web refresh | Temporary `sueca-auth-refresh-v1` in **localStorage** — **XSS caveat**; **not** final hardened storage |
| Android refresh | Keystore-backed secure storage; absent from localStorage / Preferences |
| Refresh DB | Opaque raw token; **SHA-256 hash only** in DB; rotate; replay rejected; revoke on logout + account delete |
| Google ID token | Validated; **never** persisted as app session |

**Known limitation:** Web refresh → httpOnly-cookie migration depends on production topology / deployment design. Do not claim Web refresh is fully hardened.

## Google validation (backend)

Validates: issuer · audience · expiry · subject · nonce (when provided) · `email_verified` when required.  
Audiences: `GOOGLE_WEB_CLIENT_ID` + `GOOGLE_ANDROID_CLIENT_ID` (separate).

## Account lifecycle

```
active → pending_delete
```

**Policy B (v1):** while `pending_delete`, same Google subject **cannot** log in; no duplicate Account/ExternalIdentity; **no** silent reactivation.  
Hard-delete / retention window = **future** legal/policy work — not implemented in AUTH-01.

## Local data safety

| Action | Local game DATA | linkedAccountId | localGuestId |
|--------|-----------------|-----------------|--------------|
| Login | never upload/merge | set | preserved |
| Logout | preserved | retained | preserved |
| Delete / keep-local | preserved | **cleared** | preserved |
| Delete / wipe local | keyed wipe (2nd confirm); never `localStorage.clear()` | cleared | reminted |

REL-SYNC-01 owns future sync/merge.

## Release config

- No LAN IP / localhost auth API in committed release env  
- `allowMixedContent` default **false**; LAN cleartext **debug/opt-in only**  
- No `usesCleartextTraffic` on release/main manifest  
- Backend secrets via env (never commit `.env`)

## Sub-phases

AUTH-01A–01F all **DONE**. Evidence in `ROADMAP_TO_RELEASE.md` Data/Auth section.

## AUTH-01F validation decision (accepted)

AUTH-01F **did not** repeat a full active-login → reload/restore → logout matrix with a second real Google identity.

**Rationale (intentional, not an unresolved defect):**

- **AUTH-01C** already proved real Web Google login + session.
- **AUTH-01D** already proved real Android native Google login + force-stop/reopen restore + logout + relogin.
- **AUTH-01E** already proved real OPPO logout + relogin + account delete (keep-local).
- **AUTH-01F** proved Policy B rejection for that same identity after `pending_delete`, plus upgrade/install safety, Guest path, native chooser availability, DATA preservation, release configuration, and full regression suites.

Creating another Google identity solely to re-run already-proven login/restore/logout was explicitly **not required** for landing REL-AUTH-01.

**AUTH-01F real-device / external-browser focus:**

- upgrade / `adb install -r` safety  
- Guest Conta path  
- native Google chooser availability  
- `pending_delete` (Policy B) rejection  
- local DATA preservation  
- release configuration (no LAN / cleartext defaults)  
- automated regression suites  

Do **not** reactivate the pending_delete Account or weaken Policy B.
