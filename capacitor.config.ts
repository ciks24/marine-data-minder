import { CapacitorConfig } from '@capacitor/cli';

const isDevelopment = process.env.NODE_ENV === 'development';

const config: CapacitorConfig = {
  appId: 'app.lovable.e0e7ed6d5d37-47c0-9e37-f42cc250652c',
  appName: 'marine-data-minder',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    url: isDevelopment ? 'http://10.0.2.2:8080' : 'https://marine-data-minder.netlify.app',
    cleartext: isDevelopment
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
      keystorePassword: undefined,
      keystoreAliasPassword: undefined,
      releaseType: undefined,
    }
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
