import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { AD_UNITS, useAds } from '@/lib/ads';
import { colors } from '@/theme';

/** Anchored banner at the bottom of the app. Takes no space until an ad has loaded. */
export function AdBanner() {
  const canShowAds = useAds((s) => s.canShowAds);
  const [loaded, setLoaded] = useState(false);

  if (!canShowAds || !AD_UNITS.banner) return null;

  return (
    <View style={[styles.footer, loaded && styles.divider]}>
      <BannerAd
        unitId={AD_UNITS.banner}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdLoaded={() => setLoaded(true)}
        onAdFailedToLoad={() => setLoaded(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { alignItems: 'center', backgroundColor: colors.bg },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
});
