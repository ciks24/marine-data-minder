import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.e0e7ed6d5d37-47c0-9e37-f42cc250652c',
  appName: 'marine-data-minder',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
    url: 'http://10.0.2.2:8080',
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
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
