// Secure crypto.getRandomValues polyfill — MUST load before anything that encrypts
// (used by the Lock PDF feature via @cantoo/pdf-lib + crypto-js).
import 'react-native-get-random-values';
import 'expo-router/entry';
