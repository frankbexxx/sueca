/**
 * Shared env/config for Suecão backend (MP + Account auth).
 * MP guest JWT uses JWT_SECRET; Account access JWT uses JWT_SIGNING_KEY.
 */
function splitOrigins(raw) {
  return String(raw || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function loadConfig(env = process.env) {
  const cors =
    splitOrigins(env.CORS_ORIGINS).length > 0
      ? splitOrigins(env.CORS_ORIGINS)
      : splitOrigins(
          env.ALLOWED_ORIGINS ||
            'http://localhost:3000,capacitor://localhost,https://localhost'
        );

  return {
    port: Number(env.PORT || 8787),
    /** Multiplayer guest JWT (unchanged). */
    mpJwtSecret: env.JWT_SECRET || 'dev-change-in-production',
    /** Suecão Account access JWT. */
    accountJwtSecret: env.JWT_SIGNING_KEY || env.JWT_SECRET || 'dev-account-signing-key-change-me',
    accessTokenTtl: env.ACCESS_TOKEN_TTL || '30m',
    refreshTokenTtlDays: Number(env.REFRESH_TOKEN_TTL_DAYS || 60),
    databaseUrl: env.DATABASE_URL || '',
    googleWebClientId: env.GOOGLE_WEB_CLIENT_ID || '',
    googleAndroidClientId: env.GOOGLE_ANDROID_CLIENT_ID || '',
    corsOrigins: cors,
    requireEmailVerified: env.AUTH_REQUIRE_EMAIL_VERIFIED !== 'false'
  };
}

export function googleAudiences(config) {
  return [config.googleWebClientId, config.googleAndroidClientId].filter(Boolean);
}
