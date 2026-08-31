import { useEffect, useState, type ComponentType } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, PaperCard, Screen } from '@/components/ui';
import { ADS_MISSING, ADS_TEST } from '@/lib/ads';
import { colors, radius, spacing } from '@/theme/colors';
import { type } from '@/theme/typography';

type AdsNative = {
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
  AdEventType: { LOADED: string; ERROR: string };
  default: () => { initialize: () => Promise<unknown> };
};

export default function AdsScreen() {
  const [native, setNative] = useState<AdsNative | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const mod = (await import('react-native-google-mobile-ads')) as unknown as AdsNative;
        await mod.default().initialize();
        if (alive) {
          setNative(mod);
          setStatus('ready');
        }
      } catch {
        if (alive) setStatus('missing');
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const showFullScreenAd = async () => {
    if (!native || busy) return;
    setBusy(true);
    try {
      const ad = native.InterstitialAd.createForAdRequest(native.TestIds.INTERSTITIAL);
      await new Promise<void>((resolve, reject) => {
        const stopLoad = ad.addAdEventListener(native.AdEventType.LOADED, () => {
          stopLoad();
          stopErr();
          ad.show();
          resolve();
        });
        const stopErr = ad.addAdEventListener(native.AdEventType.ERROR, (err) => {
          stopLoad();
          stopErr();
          reject(err);
        });
        ad.load();
      });
    } catch (err) {
      Alert.alert('Ad failed', err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen style={styles.page}>
      <Text style={styles.kicker}>Sponsored</Text>
      <Text style={styles.title}>Offers</Text>
      <Text style={styles.lead}>
        These are Google test ads. They are safe to use while you finish the app.
        Later you can replace them with your real AdMob ids.
      </Text>

      <PaperCard style={styles.bannerWell}>
        {status === 'loading' ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.hint}>Starting ads…</Text>
          </View>
        ) : status === 'missing' || !native ? (
          <View style={styles.centerBox}>
            <View style={styles.iconWrap}>
              <Ionicons name="megaphone-outline" size={28} color={colors.primary} />
            </View>
            <Text style={styles.placeholderTitle}>Banner goes here</Text>
            <Text style={styles.hint}>{ADS_MISSING}</Text>
          </View>
        ) : (
          <View style={styles.banner}>
            <native.BannerAd
              unitId={native.TestIds.BANNER}
              size={native.BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            />
          </View>
        )}
      </PaperCard>

      <Button
        label={busy ? 'Loading ad…' : 'Show a full-screen test ad'}
        icon="phone-portrait-outline"
        onPress={showFullScreenAd}
        disabled={status !== 'ready' || busy}
        loading={busy}
      />

      <Text style={styles.ids}>
        Test app id (Android): {ADS_TEST.androidAppId}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { padding: spacing.lg, gap: spacing.md },
  kicker: { ...type.section },
  title: { ...type.display, fontSize: 28 },
  lead: { ...type.subtitle, lineHeight: 20 },
  bannerWell: { minHeight: 120, justifyContent: 'center', overflow: 'hidden' },
  banner: { alignItems: 'center', width: '100%' },
  centerBox: { alignItems: 'center', paddingVertical: spacing.md, gap: spacing.sm },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.tintTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  hint: { ...type.caption, textAlign: 'center', lineHeight: 18, paddingHorizontal: spacing.sm },
  ids: { ...type.caption, marginTop: spacing.sm },
});
