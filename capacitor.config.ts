import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pisowise.app',
  appName: 'PisoWise',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Remove in production; for local dev only:
    // url: 'http://YOUR_LOCAL_IP:5173',
    // cleartext: true,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#F7C13A',
    },
  },
  android: {
    buildOptions: {
      keystorePath: 'pisowise-key.jks',
      keystorePassword: 'your-keystore-password',
      keystoreAlias: 'pisowise',
      keystoreAliasPassword: 'your-alias-password',
      releaseType: 'APK',
    },
  },
};

export default config;
