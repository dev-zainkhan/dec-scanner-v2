const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// .build-cache holds the Gradle cache, temp files and JDK (see scripts/env.ps1).
// Keep Metro from crawling those gigabytes of files.
config.resolver.blockList = [
  ...[].concat(config.resolver.blockList ?? []),
  /[\\/]\.build-cache[\\/].*/,
];

module.exports = config;
