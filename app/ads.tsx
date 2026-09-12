import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { Button, Screen } from '@/components/ui';
import { ADS_MISSING, ADS_TEST, loadAdsNative, showInterstitialAd } from '@/lib/ads';
import { spacing } from '@/theme/colors';
import { type } from '@/theme/typography';

export default function AdsScreen() {
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const mod = await loadAdsNative();
        if (alive) {
          setReady(!!mod);
          setStatus(mod ? 'ready' : 'missing');
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
    if (!ready || busy) return;
    setBusy(true);
    try {
      await showInterstitialAd();
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
        {status === 'missing' ? ADS_MISSING : 'Google test ads are enabled for this build.'}
      </Text>

      <Button
        label={busy ? 'Loading ad…' : 'Show a full-screen test ad'}
        icon="phone-portrait-outline"
        onPress={showFullScreenAd}
        disabled={!ready || busy}
        loading={busy}
      />

      <Text style={styles.ids}>Test app id (Android): {ADS_TEST.androidAppId}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { padding: spacing.lg, gap: spacing.md },
  kicker: { ...type.section },
  title: { ...type.display, fontSize: 28 },
  lead: { ...type.subtitle, lineHeight: 20 },
  ids: { ...type.caption, marginTop: spacing.sm },
});
