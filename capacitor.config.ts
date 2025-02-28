
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.e0e7ed6d5d3747c09e37f42cc250652c',
  appName: 'marine-data-minder',
  webDir: 'dist',
  server: {
    url: 'https://e0e7ed6d-5d37-47c0-9e37-f42cc250652c.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  android: {
    buildOptions: {
      keystorePath: null,
      keystoreAlias: null,
      keystorePassword: null,
      keystoreAliasPassword: null,
      releaseType: null,
    }
  }
};

export default config;
