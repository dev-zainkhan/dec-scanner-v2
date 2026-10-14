import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  SafeAreaInsetsContext,
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { AdBanner } from '@/components/AdBanner';
import { startAds } from '@/lib/ads';
import { clearExports } from '@/lib/files';
import { colors, font } from '@/theme';

/**
 * Keeps the ad banner pinned above the system navigation bar. Screens inside see
 * a bottom inset of 0 because this shell already pads for it.
 */
function AppShell({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, paddingBottom: insets.bottom, backgroundColor: colors.bg }}>
      <SafeAreaInsetsContext.Provider value={{ ...insets, bottom: 0 }}>
        {children}
      </SafeAreaInsetsContext.Provider>
      <AdBanner />
    </View>
  );
}

export default function RootLayout() {
  useEffect(() => {
    clearExports();
    startAds();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AppShell>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.bg },
              headerTitleStyle: { color: colors.text, fontFamily: font.serif, fontWeight: '700' },
              headerTintColor: colors.primary,
              headerShadowVisible: false,
              contentStyle: { backgroundColor: colors.bg },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="document/[id]" options={{ title: '' }} />
            <Stack.Screen name="merge" options={{ title: 'Merge PDFs' }} />
            <Stack.Screen name="split" options={{ title: 'Split PDF' }} />
            <Stack.Screen name="compress" options={{ title: 'Compress PDF' }} />
            <Stack.Screen name="lock" options={{ title: 'Lock PDF' }} />
          </Stack>
        </AppShell>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
