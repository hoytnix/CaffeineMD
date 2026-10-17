# Active Context: CaffeineMD

## Current Focus
- **Google Drive Authentication & Token Persistence Pipeline**:
  - **Firebase Client (`src/lib/firebase/client.ts`)**:
    - Updated `setAccessToken` to accept `expiresInSeconds` defaulting to 3600 (1 hour OAuth validity).
    - Persisted `TokenMetadata` (`savedAt`, `expiresAt`) into `storageRegistry` under `kite_gdrive_token_meta` alongside `sessionStorage` and `localStorage`.
    - Implemented helper functions `getTokenMetadata()` and `isStoredTokenExpired(bufferMs)` for proactive expiry checks.
    - Protected active sessions from unconditional wiping in `initAuth` when auth state changes during cold starts or transient disconnections.
  - **DriveAuthService (`src/lib/sync/google/driveAuthService.ts`)**:
    - Replaced in-memory only expiry checking with `isTokenExpired()` querying persistent `TokenMetadata` via `storageRegistry`.
    - Added `refreshToken()` placeholder for future silent refresh capabilities.
    - Updated `authorizedFetch` to log warnings and throw non-destructive session errors without invoking `clearSession()`, preserving valid Dexie workspace states.
  - **Settings Hook (`src/components/settings/sections/useGoogleDriveSyncSettings.ts`)**:
    - Eliminated aggressive error handlers that nullified `setAccessToken(null)` upon sync errors or 401 responses.
    - Confined session destruction strictly to explicit user sign-out (`logoutGoogle`).
  - **Storage Registry (`src/lib/config/storageRegistry.ts`)**:
    - Made `fallback` parameter optional in `getJson` with default null fallback for flexible type consumption.

## Architecture & Recent Changes
1. **Non-Destructive Cloud Auth Pipeline**:
   - Google Drive sync errors or 401 responses surface as warnings without clearing stored OAuth access tokens or purging local Dexie databases.
2. **Persistent Token Expiry Tracking**:
   - `storageRegistry` persists `TokenMetadata` with absolute timestamps, allowing the app to proactively identify expiring credentials prior to executing network transfers.

## Next Steps
- Maintain strict <250 LOC per file across all modules (strict hard limit: 400 LOC).
- Verification: Run `pnpm run lint` on every prompt cycle.
