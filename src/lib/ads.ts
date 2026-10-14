import { create } from 'zustand';
import mobileAds, {
  AdEventType,
  AdsConsent,
  AdsConsentPrivacyOptionsRequirementStatus,
  InterstitialAd,
  TestIds,
} from 'react-native-google-mobile-ads';
import admob from '@/config/admob.json';

/** Debug builds always use Google's test ads so real ads are never clicked during development. */
export const AD_UNITS = {
  banner: __DEV__ ? TestIds.ADAPTIVE_BANNER : admob.bannerUnitId,
  interstitial: __DEV__ ? TestIds.INTERSTITIAL : admob.interstitialUnitId,
};

/** Never show interstitials closer together than this. */
const INTERSTITIAL_MIN_GAP_MS = 90_000;
/** Wait before retrying a failed interstitial load (e.g. while offline). */
const INTERSTITIAL_RETRY_MS = 60_000;

interface AdsState {
  /** Consent allows ads and the SDK is initialized. */
  canShowAds: boolean;
  /** EEA/UK users must be able to change their consent from inside the app. */
  privacyOptionsRequired: boolean;
}

export const useAds = create<AdsState>(() => ({
  canShowAds: false,
  privacyOptionsRequired: false,
}));

let started = false;
let interstitial: InterstitialAd | null = null;
let lastInterstitialAt = 0;

/**
 * Collects consent (Google UMP, shown only where the law requires it) and then
 * initializes the Mobile Ads SDK. Safe to call more than once; never throws.
 */
export async function startAds(): Promise<void> {
  if (started) return;
  started = true;
  try {
    // Fails while offline; the consent stored from the last session still applies.
    await AdsConsent.gatherConsent().catch(() => undefined);
    const consent = await AdsConsent.getConsentInfo();
    useAds.setState({
      privacyOptionsRequired:
        consent.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED,
    });
    if (!consent.canRequestAds) return;
    await mobileAds().initialize();
    useAds.setState({ canShowAds: true });
    preloadInterstitial();
  } catch {
    // Ads are optional. The app must keep working if they cannot start.
  }
}

/** Opens Google's consent form so the user can review or change their choices. */
export async function openAdPrivacyOptions(): Promise<void> {
  const consent = await AdsConsent.showPrivacyOptionsForm();
  if (consent.canRequestAds && !useAds.getState().canShowAds) {
    started = false;
    await startAds();
  }
}

function preloadInterstitial(): void {
  if (!AD_UNITS.interstitial || !useAds.getState().canShowAds) return;
  const ad = InterstitialAd.createForAdRequest(AD_UNITS.interstitial);
  ad.addAdEventListener(AdEventType.ERROR, () => {
    if (interstitial !== ad) return;
    interstitial = null;
    setTimeout(preloadInterstitial, INTERSTITIAL_RETRY_MS);
  });
  interstitial = ad;
  ad.load();
}

/**
 * Shows the preloaded interstitial if one is ready and enough time has passed.
 * Returns immediately otherwise, so saving or sharing never waits on the network.
 */
export async function showInterstitialIfReady(): Promise<void> {
  const ad = interstitial;
  if (!ad?.loaded || Date.now() - lastInterstitialAt < INTERSTITIAL_MIN_GAP_MS) return;

  interstitial = null;
  lastInterstitialAt = Date.now();
  await new Promise<void>((resolve) => {
    const unsubscribe = [
      ad.addAdEventListener(AdEventType.CLOSED, done),
      ad.addAdEventListener(AdEventType.ERROR, done),
    ];
    function done() {
      unsubscribe.forEach((off) => off());
      resolve();
    }
    ad.show().catch(done);
  });
  preloadInterstitial();
}
