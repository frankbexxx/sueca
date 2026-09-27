import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Mixed content (https://localhost WebView → http:// Account API) is opt-in for
 * local OPPO / LAN smoke only.
 *
 * Default: false (release-safe).
 * Enable: SUECAO_ANDROID_ALLOW_MIXED_CONTENT=true npm run cap:sync:android:lan
 *
 * Cleartext HTTP at the OS layer is separately limited to Android *debug*
 * builds via `scripts/apply-android-debug-cleartext.mjs` (src/debug manifest).
 */
export function resolveAndroidAllowMixedContent(
  env: NodeJS.ProcessEnv = process.env
): boolean {
  return env.SUECAO_ANDROID_ALLOW_MIXED_CONTENT === 'true';
}

const config: CapacitorConfig = {
  appId: 'com.suecao.cardgames',
  appName: 'SUECÂO',
  webDir: 'dist',
  android: {
    allowMixedContent: resolveAndroidAllowMixedContent()
  },
  server: {
    androidScheme: 'https'
  }
};

export default config;
