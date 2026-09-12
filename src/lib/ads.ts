import type { ComponentType } from 'react';

/** Google's official TEST ids. Replace later with your real AdMob ids. */
export const ADS_TEST = {
  androidAppId: 'ca-app-pub-3940256099942544~3347511713',
  iosAppId: 'ca-app-pub-3940256099942544~1458002511',
  banner: 'ca-app-pub-3940256099942544/6300978111',
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
};

export const ADS_MISSING =
  'Ads need a debug APK, not Expo Go. Build the APK using RUN.md Part B.';

export type AdsNative = {
  BannerAd: ComponentType<{
    unitId: string;
    size: string;
  }>;
  BannerAdSize: { ANCHORED_ADAPTIVE_BANNER: string };
  TestIds: { BANNER: string; INTERSTITIAL: string };
  InterstitialAd: {
    createForAdRequest: (unitId: string) => {
      load: () => void;
      show: () => void;
      addAdEventListener: (event: string, cb: (error?: unknown) => void) => () => void;
    };
  };
  AdEventType: { LOADED: string; CLOSED: string; ERROR: string };
  default: () => { initialize: () => Promise<unknown> };
};

let nativePromise: Promise<AdsNative | null> | undefined;

export function loadAdsNative(): Promise<AdsNative | null> {
  if (!nativePromise) {
    nativePromise = import('react-native-google-mobile-ads')
      .then(async (mod) => {
        const native = mod as unknown as AdsNative;
        await native.default().initialize();
        return native;
      })
      .catch(() => null);
  }
  return nativePromise;
}

export async function showInterstitialAd(): Promise<void> {
  const native = await loadAdsNative();
  if (!native) return;

  await new Promise<void>((resolve) => {
    const ad = native.InterstitialAd.createForAdRequest(native.TestIds.INTERSTITIAL);
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      stopLoad();
      stopClose();
      stopError();
      resolve();
    };
    const stopLoad = ad.addAdEventListener(native.AdEventType.LOADED, () => ad.show());
    const stopClose = ad.addAdEventListener(native.AdEventType.CLOSED, finish);
    const stopError = ad.addAdEventListener(native.AdEventType.ERROR, finish);
    ad.load();
  });
}
