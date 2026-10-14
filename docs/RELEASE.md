# Releasing PDF & Image Scanner on Google Play

A step-by-step guide for the first release, followed by the routine for updates.
Steps 1–2 are done once and are reused by all your future apps.

## 1. Create your upload key (once, keep it forever)

Play Console identifies your uploads by this key. If you lose it, you must ask
Google support to reset it, which takes days.

```powershell
npm run create-upload-key
```

It asks for your name and a password (typed hidden) and creates, inside the project:

- `keys\upload-key.jks`: the key itself
- `signing.properties`: where the key is and its password

Both are git-ignored, so they are never pushed to GitHub. **Back up both files right
away** (Google Drive + a USB stick) and keep the password in a password manager.
`plugins/withReleaseSigning.js` uses them automatically for release builds.

## 2. Set up AdMob (once per account, then per app)

1. Sign up at <https://admob.google.com> with the Google account you'll use for
   all your apps, and complete payments/tax info.
2. **Apps > Add app** > Android > "Is the app listed on a supported app store?"
   **No** (for now) > name it **PDF & Image Scanner**. Copy the **App ID**
   (`ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY`).
3. In that app, **Ad units > Add ad unit**:
   - **Banner** (it will be shown as an anchored adaptive banner). Copy its ID.
   - **Interstitial**. Copy its ID.
4. Put the three IDs in [`src/config/admob.json`](../src/config/admob.json), the
   only file to change:

   ```json
   {
     "androidAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY",
     "bannerUnitId": "ca-app-pub-XXXXXXXXXXXXXXXX/1111111111",
     "interstitialUnitId": "ca-app-pub-XXXXXXXXXXXXXXXX/2222222222"
   }
   ```

   Debug builds keep using Google's test ads regardless; only release builds use
   these IDs. Run `npm run dev:rebuild` once afterwards (the App ID is native config).
5. **Privacy & messaging > European regulations (GDPR)**: create a message for
   PDF & Image Scanner and publish it. The app already shows it through Google's User
   Messaging Platform, and the "Ad privacy choices" row in Settings appears
   automatically for users who need it. Without a published message, ads in the
   EEA/UK are limited. Optionally also publish a **US state regulations** message.
6. **app-ads.txt** (recommended, protects your earnings): AdMob shows a line like
   `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`. It must be served
   at the **root** of the website you list in Play Console. With GitHub Pages,
   create a repository named `dev-zainkhan.github.io`, add a file `app-ads.txt`
   with that line, and use `https://dev-zainkhan.github.io` as the developer
   website in your store listing. One file covers all your apps.

Never tap real ads in your own app, and don't ask anyone to. AdMob suspends
accounts for invalid clicks. To test on your own phone, add it under
**Settings > Test devices** in AdMob.

## 3. Build the bundle

1. In [`app.config.ts`](../app.config.ts), set `version` (shown to users, e.g.
   `1.0.0`) and increase `android.versionCode` by 1 for **every** upload.
2. Build:

   ```powershell
   npm run build:aab
   ```

   Output: `android\app\build\outputs\bundle\release\app-release.aab`.
   The script refuses to build if the upload key isn't configured, and warns if
   `admob.json` still has test IDs.

Optional: `npm run build:apk` builds a release APK (signed with the same key) to
install on a phone with `adb install -r android\app\build\outputs\apk\release\app-release.apk`.

## 4. Play Console: create the app

1. Create a developer account at <https://play.google.com/console> (one-time fee).
   **New personal accounts must run a closed test with at least 12 testers for
   14 days before they can publish to production.** Plan for this.
2. **Create app**: name PDF & Image Scanner, App, Free, accept the declarations.
3. **Test and release > Testing > Internal testing**: create a release, upload the
   `.aab`, and accept **Play App Signing** (Google keeps the app-signing key; your
   upload key only proves uploads come from you).

### App content (Policy > App content)

| Section | Answer |
|---|---|
| Privacy policy | `https://dev-zainkhan.github.io/privacy-policy-scanova/` |
| Ads | **Yes, my app contains ads** |
| App access | All functionality is available without special access |
| Content rating | Fill the questionnaire: category **Utility/Productivity**, answer No to violence, sexual content, gambling, user interaction/sharing, etc. |
| Target audience | **18 and over** (or 13+). Don't include under-13 age groups: that triggers the Families policy, which needs extra ad settings |
| Advertising ID | **Yes**, used for **Advertising or marketing** and **Analytics** (the AdMob SDK adds the permission) |
| Government / financial / health / news | No / None |

### Data safety

Scans and PDFs never leave the device, so they are **not** "collected" in Play's
sense. The data to declare comes from the AdMob SDK
([Google's guidance](https://developers.google.com/admob/android/privacy/play-data-disclosure)):

- Does your app collect or share any of the required user data types? **Yes**
- Is all user data encrypted in transit? **Yes**
- Do you provide a way for users to request that their data is deleted? **No**
  (no accounts; in-app data is deleted on the device)

| Data type | Collected | Shared | Purposes |
|---|---|---|---|
| Location > **Approximate location** | Yes | Yes | Advertising or marketing, Analytics, Fraud prevention, security, and compliance |
| App activity > **App interactions** | Yes | Yes | Advertising or marketing, Analytics, Fraud prevention, security, and compliance |
| App info and performance > **Diagnostics** | Yes | Yes | Analytics, Fraud prevention, security, and compliance |
| Device or other IDs > **Device or other IDs** | Yes | Yes | Advertising or marketing, Analytics, Fraud prevention, security, and compliance |

For each: processed ephemerally? **No**. Required or optional? **Required**
(users can't turn off collection inside the app).

### Store listing (Grow users > Store presence > Main store listing)

- Short description (max 80 chars), full description (max 4000).
- App icon **512×512 PNG**, feature graphic **1024×500**, at least **2 phone
  screenshots** (take them on the emulator: `adb exec-out screencap -p > shot.png`).
- Category **Productivity**, contact email `workwithzain02@gmail.com`,
  website `https://dev-zainkhan.github.io` (if you set up app-ads.txt).
- Describe only features that exist. Don't use "best", "#1", or similar claims,
  and don't mention other apps' brands.

## 5. Go live

1. Internal testing → install from the Play link on your phone and check: scan,
   save, share, each PDF tool, and Settings > Privacy policy.
2. Closed testing with 12+ testers for 14 days (new personal accounts).
3. Apply for production, then **Send for review** under Publishing overview.
4. Once live, in AdMob open the app > **App settings > Add app store details**
   and link it to the Play listing.

## Every update

1. Make and test your changes (`npm run dev`).
2. Bump `android.versionCode` (and `version` if user-visible) in `app.config.ts`.
3. `npm run build:aab`, then upload in Play Console with release notes.
4. If you add a feature that collects or shares new data, update Data safety and
   the privacy policy **before** releasing it.

## What the code already does for Play/AdMob policy

- Ads: Google UMP consent before ads load (GDPR/UK) and an in-app privacy options
  entry; test ads in debug builds; interstitials only at natural breaks (before
  save/share), preloaded, at most one every 90 seconds, and skipped if not ready, so
  the app never waits on an ad or the network.
- No placeholder ("coming soon") features and no ad-only screens.
- Unneeded storage/overlay/audio permissions are removed from the manifest;
  saving uses the system folder picker (scoped storage).
- Privacy policy and support contact are reachable inside the app (Settings).
- Target SDK follows Expo SDK 56 (Android 16 / API 36), which meets Play's target API requirement.
