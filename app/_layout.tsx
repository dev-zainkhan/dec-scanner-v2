import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@/theme/colors';
import { font } from '@/theme/typography';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTitleStyle: {
              color: colors.text,
              fontFamily: font.serif,
              fontWeight: '700',
            },
            headerTintColor: colors.primary,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="document/[id]" options={{ title: '' }} />
          <Stack.Screen name="merge" options={{ title: 'Merge PDFs' }} />
          <Stack.Screen name="split" options={{ title: 'Split PDF' }} />
          <Stack.Screen name="compress" options={{ title: 'Compress' }} />
          <Stack.Screen name="lock" options={{ title: 'Lock PDF' }} />
          <Stack.Screen name="ads" options={{ title: 'Offers' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
