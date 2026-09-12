import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { loadAdsNative, ADS_TEST, type AdsNative } from '@/lib/ads';
import { colors } from '@/theme/colors';

export function AdBanner() {
  const [native, setNative] = useState<AdsNative | null>(null);

  useEffect(() => {
    let alive = true;
    loadAdsNative().then((loaded) => {
      if (alive) setNative(loaded);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!native) return null;

  return (
    <View style={styles.footer}>
      <native.BannerAd
        unitId={native.TestIds.BANNER || ADS_TEST.banner}
        size={native.BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    minHeight: 50,
    width: '100%',
  },
});