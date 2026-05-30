import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kridaz.app',
  appName: 'Kridaz',
  webDir: 'dist',
  plugins: {
    extConfig: {},
    CapacitorUpdater: {
      appId: 'com.kridaz.app'
    }
  }
};

export default config;
