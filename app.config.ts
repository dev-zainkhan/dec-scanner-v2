import type { ExpoConfig } from 'expo/config';
import admob from './src/config/admob.json';

const config: ExpoConfig = {
  name: 'Scanova',
  slug: 'docscanner',
  scheme: 'scanova',
  // Bump `version` for every store release, and `android.versionCode` for every upload.
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  android: {
    package: 'com.zainkhan.scanova',
    versionCode: 1,
    adaptiveIcon: {
      backgroundColor: '#061A55',
      foregroundImage: './assets/android-icon-foreground.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    // Expo adds these by default; Scanova saves through the system folder picker instead.
    blockedPermissions: [
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.RECORD_AUDIO',
    ],
  },
  ios: {
    bundleIdentifier: 'com.zainkhan.scanova',
    supportsTablet: true,
  },
  plugins: [
    'expo-router',
    'expo-sharing',
    [
      'react-native-document-scanner-plugin',
      { cameraPermission: 'Allow Scanova to use the camera to scan documents.' },
    ],
    [
      'react-native-google-mobile-ads',
      {
        androidAppId: admob.androidAppId,
        iosAppId: 'ca-app-pub-3940256099942544~1458002511',
        delayAppMeasurementInit: true,
      },
    ],
    './plugins/withReleaseSigning',
  ],
  extra: {
    router: {},
    eas: { projectId: '978b03ed-18b7-49b3-8d33-9c173027b304' },
  },
};

export default config;
