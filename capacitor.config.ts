import type { CapacitorConfig } from '@capacitor/cli';

const isProduction = process.env.NODE_ENV === 'production';

const config: CapacitorConfig = {
  appId: 'com.apthome.ipjuon',
  appName: '입주ON',
  webDir: 'dist',
    server: {
    androidScheme: 'http',
    cleartext: true,
  },
  // server: {
  //   url: 'http://192.168.45.244:8080',
  //   cleartext: true,
  // },
};

export default config;