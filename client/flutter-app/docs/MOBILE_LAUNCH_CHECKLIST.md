# Kridaz — Mobile Launch Checklist

What I changed in the codebase, what's still needed from you, in launch order.

**Bundle / package id chosen: `com.kridaz.app`** — same on both platforms.

---

## ✅ Done (file changes I made)

### iOS — `ios/Runner/`
- **`Info.plist` rewritten**:
  - Display name + bundle name = **Kridaz** / `kridaz`
  - `ITSAppUsesNonExemptEncryption = false` (no more TestFlight compliance prompts)
  - New `CFBundleURLTypes` entries for `kridaz://` deep links and `rzp.com.kridaz.app` (Razorpay UPI return)
  - Permission descriptions made specific (Apple reviewers reject generic strings)
  - Removed `NSMicrophoneUsageDescription` (the app doesn't record audio — image_picker uses gallery video, not recording)
  - Removed `NSLocationAlwaysUsageDescription` (only when-in-use is needed)
  - `NSAppTransportSecurity` exception for the local dev IP (`10.133.212.209`) and `localhost` so debug builds talk to the dev server over plain HTTP
- **`PrivacyInfo.xcprivacy` created** at `ios/Runner/PrivacyInfo.xcprivacy` — declares the collected data types (email, phone, name, photos, location, payment info, device id) and the four privacy-sensitive APIs your dependencies use (UserDefaults, DiskSpace, FileTimestamp, SystemBootTime).
- **`Runner.xcodeproj/project.pbxproj`**:
  - All 6 `PRODUCT_BUNDLE_IDENTIFIER` references → `com.kridaz.app` / `com.kridaz.app.RunnerTests`
  - All 3 `IPHONEOS_DEPLOYMENT_TARGET` references → `15.0` (matches `Podfile`)

### Android — `android/`
- **`app/build.gradle`**: `namespace` + `applicationId` → `com.kridaz.app`
- **Root `AndroidManifest.xml`**: `package` → `com.kridaz.app`
- **`app/src/main/AndroidManifest.xml`**:
  - `package` → `com.kridaz.app`
  - Added intent-filter for `kridaz://` deep links on `MainActivity`
- **`MainActivity.kt`** moved from `com/example/flutter_phone_app/` → `com/kridaz/app/`, package declaration updated, empty stale dirs removed
- **`app/google-services.json`**: all 3 `package_name` entries → `com.kridaz.app`

### Shared Dart side
- **`pubspec.yaml`**: name = `kridaz`, added `sign_in_with_apple: ^6.1.0`
- **`lib/services/apple_auth_service.dart` created** — wraps `SignInWithApple.getAppleIDCredential` and POSTs the identity token to `/user/auth/apple-auth`. Currently a stub waiting on (a) the backend endpoint and (b) a small `AuthManager.consumeExternalLogin(token, user)` helper to finalise the session (marked TODO in the file).

---

## ⚠️ External steps you must do (I cannot — they require accounts I don't have)

### Firebase Console
1. Open [Firebase Console → kridaz project → Project settings](https://console.firebase.google.com/)
2. **Add a new iOS app**: bundle ID `com.kridaz.app`. Download fresh `GoogleService-Info.plist`. **Replace** `ios/Runner/GoogleService-Info.plist` with it.
3. **Add a new Android app**: package name `com.kridaz.app`. Download fresh `google-services.json`. **Replace** `android/app/google-services.json`. (The file I edited has the package_name keys updated, but the certificate fingerprint / app id are still tied to the old app.)
4. **Keep both old apps active** until everyone has migrated, or delete them if you're sure no one is still on the old build.

### Google Cloud Console — OAuth
5. [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
6. **Create iOS OAuth Client ID** with bundle id `com.kridaz.app`. Copy the new REVERSED_CLIENT_ID. In `ios/Runner/Info.plist`, replace the existing string `com.googleusercontent.apps.312328302719-9g84j5fk7j7q1nr47330jnnse61t7n0s` (under the `REVERSED_CLIENT_ID` URL type) with the new one.
7. **Create Android OAuth Client ID** — needs your app's **SHA-1 signing-key fingerprint**. Get it with `cd android && ./gradlew signingReport` (debug) and your release keystore's SHA-1 for production. Add both fingerprints to the new Android OAuth client.

### Apple Developer
8. [Apple Developer → Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list)
9. **Create App ID** `com.kridaz.app` with these capabilities enabled:
   - Sign in with Apple
   - Push Notifications (later, when you want push)
   - Associated Domains (later, if you add universal links)
10. **Create APNs Auth Key** (`.p8`) — needed before push notifications work on iOS. Upload it to Firebase Console → Project settings → Cloud Messaging → Apple app configuration.
11. **Set Team ID in Xcode**: open `ios/Runner.xcworkspace`, select Runner target → Signing & Capabilities → pick your team. This is the only way to sign for a real device.

### Razorpay
12. [Razorpay Dashboard → Settings → Webhooks/App](https://dashboard.razorpay.com/app/payment-pages)
13. Register the bundle id `com.kridaz.app` if Razorpay tracks it. (Their SDK doesn't strictly require dashboard registration for basic flows, but it's prudent.)

### Xcode — one-time GUI tasks
14. Open `ios/Runner.xcworkspace` in Xcode.
15. Select the **Runner** target → **Signing & Capabilities**:
    - Add capability "**Sign in with Apple**" (Xcode auto-creates `Runner.entitlements`)
    - Add capability "**Push Notifications**" (when ready)
16. In the Project Navigator, drag `PrivacyInfo.xcprivacy` (already on disk) into the Runner group and check **Add to targets: Runner**. This adds it to the build product.
17. Drag the new `GoogleService-Info.plist` (downloaded in step 2) into the Runner group, replacing the old one. Make sure "Add to targets: Runner" is checked.
18. Build & run on a real device to validate (Apple Developer team + new bundle id required).

### App icons + Launch screen
19. **App icons** (currently default Flutter icons). Create a 1024×1024 Kridaz logo PNG, then either:
    - Run [`flutter_launcher_icons`](https://pub.dev/packages/flutter_launcher_icons) (already a common Flutter pattern — add to `dev_dependencies`, point at the PNG, run `flutter pub run flutter_launcher_icons`), **or**
    - Drop pre-sized icons into `ios/Runner/Assets.xcassets/AppIcon.appiconset/` and `android/app/src/main/res/mipmap-*/`.
20. **Launch screen** — replace `ios/Runner/Base.lproj/LaunchScreen.storyboard` and `android/app/src/main/res/drawable/launch_background.xml` with Kridaz-branded versions (dark canvas + logo).

---

## ⏭️ When you want push notifications (deferred)
- Apple: APNs key uploaded to Firebase (step 10).
- Xcode: enable Push + Background Modes → Remote notifications (step 15).
- Android: already works via FCM if `google-services.json` is correct.
- Dart: add `firebase_messaging` if not already in pubspec, wire up token registration in `auth_manager.dart` after login.

---

## 🧪 Verification

After steps 1–18, run:

```powershell
cd C:\Users\Hp\Desktop\bms\bms
flutter clean
flutter pub get
# Android device:
flutter run -d <android-device-id>
# iOS device (requires macOS — Windows can't build iOS):
flutter run -d <ios-device-id>
```

Smoke test:
- App launches with **Kridaz** name + new icon
- Login / Google Sign-In works (proves new Firebase iOS app + new OAuth client are linked)
- Open a booking pass with a QR — scanning `kridaz://booking/<id>` from another app deep-links into Kridaz (proves URL scheme registered)
- Razorpay UPI flow returns to the app (proves Razorpay return scheme)
- Apple Sign-In button (once you wire it into the login screen — see next section) opens the native sheet

---

## 📝 To finish Apple Sign-In wiring (Dart side)

Currently `lib/services/apple_auth_service.dart` exists but no button calls it yet. To wire it in:

1. Add to `lib/services/auth_manager.dart`:
   ```dart
   Future<void> consumeExternalLogin({
     required String token,
     Map<String, dynamic>? user,
   }) async {
     await _setToken(token);
     _currentUser = user;
     _connectChatSocket();
     _saveUserLocally();
     _authController.add(true);
   }
   ```
2. Remove the TODO in `apple_auth_service.dart` and call `AuthManager().consumeExternalLogin(...)` before returning success.
3. In `bms_login_screen.dart`, below the Google button, add (iOS only):
   ```dart
   if (Platform.isIOS) ...[
     const SizedBox(height: 12),
     SignInWithAppleButton(
       onPressed: _loading ? null : _appleLogin,
       style: SignInWithAppleButtonStyle.white,
     ),
   ],
   ```
   plus a `_appleLogin()` handler calling `AppleAuthService.signIn()`.
4. **Backend dev** must add `POST /user/auth/apple-auth` returning the same shape as `/user/auth/google-auth` (`{token, user, isNewUser}`).

I left it as a stub deliberately — shipping a button that 404s on tap is worse than no button.

---

## Summary

**Done (~22 file changes)**: bundle/package rename, deployment target alignment, deep-link schemes, Razorpay scheme, ATS exception for dev, encryption flag, privacy manifest, permission strings, MainActivity moved, google-services updated, Apple Sign-In service stub, dependency added.

**External (~6 tasks)**: Firebase iOS+Android re-registration, Google OAuth client IDs, Apple Developer App ID + APNs key, Xcode capability toggles, Razorpay dashboard, app icons + launch screen.

After both columns are complete, you're ready to archive in Xcode → TestFlight, and `flutter build apk --release` for Android → Play Console internal testing.
