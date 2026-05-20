import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.suecao.cardgames',
  appName: 'SUECÂO',
  webDir: 'build',
  android: {
    allowMixedContent: false
  },
  server: {
    androidScheme: 'https'
  }
};

export default config;
