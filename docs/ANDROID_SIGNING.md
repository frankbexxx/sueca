# Android signing (Play Store AAB)

## Prerequisites

- Android Studio or SDK command-line tools
- Java 17+
- Capacitor sync after each web build

## One-time keystore (do not commit)

```bash
keytool -genkey -v -keystore suecao-release.keystore -alias suecao -keyalg RSA -keysize 2048 -validity 10000
```

Store password in a password manager. Add to `android/keystore.properties` (gitignored):

```properties
storeFile=../suecao-release.keystore
storePassword=***
keyAlias=suecao
keyPassword=***
```

## Build release AAB

```bash
cd frontend
npm run build
npx cap sync android
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

## Play Console

- Enable Play App Signing (recommended).
- Upload AAB to **Internal testing** first.
- `targetSdk` 34+ in `android/variables.gradle` (Capacitor default).

## Versioning

Increment `versionCode` / `versionName` in `android/app/build.gradle` each release.
