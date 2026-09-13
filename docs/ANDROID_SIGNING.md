# Android signing (Play Store AAB)

## Prerequisites

- Android Studio or SDK command-line tools
- Java 17+
- Capacitor sync after each web build (`npm run cap:sync:android`)

## One-time keystore (do not commit)

Create the keystore **outside git history**. Suggested location (gitignored via `frontend/android/` + `*.keystore`):

`frontend/android/suecao-release.keystore`

```bash
cd frontend/android
keytool -genkey -v -keystore suecao-release.keystore -alias suecao -keyalg RSA -keysize 2048 -validity 10000
```

`keytool` will prompt for store password, key password, and certificate identity. Store those in a password manager — **never commit them**.

Then create `frontend/android/keystore.properties` (gitignored):

```properties
storeFile=suecao-release.keystore
storePassword=***
keyAlias=suecao
keyPassword=***
```

`storeFile` is resolved relative to `frontend/android/` (Gradle `rootProject`).

## Gradle wiring

`frontend/android/` is gitignored (Capacitor local project). After `npx cap add android` / regenerating the platform, paste the following into `frontend/android/app/build.gradle`:

1. **Immediately after** `apply plugin: 'com.android.application'`, add the properties loader + task-graph guard.
2. **Inside** the `android { }` block, add `signingConfigs { release { ... } }` and set `signingConfig signingConfigs.release` on the `release` build type when credentials exist.

```gradle
// After: apply plugin: 'com.android.application'
def keystorePropertiesFile = rootProject.file('keystore.properties')
def keystoreProperties = new Properties()
def hasReleaseSigning = false
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
    def storePath = keystoreProperties['storeFile']
    def storeFileRef = storePath ? rootProject.file(storePath) : null
    hasReleaseSigning = storeFileRef != null &&
        storeFileRef.exists() &&
        keystoreProperties['storePassword'] &&
        keystoreProperties['keyAlias'] &&
        keystoreProperties['keyPassword']
}

gradle.taskGraph.whenReady { graph ->
    def needsReleaseSigning = graph.allTasks.any { task ->
        def n = task.name.toLowerCase()
        (n.contains('assemblerelease') || n.contains('bundlerelease') || n == 'signreleasebundle')
    }
    if (needsReleaseSigning && !hasReleaseSigning) {
        throw new GradleException(
            "Release signing credentials missing or incomplete.\n" +
            "Create frontend/android/keystore.properties and the keystore file.\n" +
            "See docs/ANDROID_SIGNING.md"
        )
    }
}
```

Inside `android { }`:

```gradle
    signingConfigs {
        release {
            if (hasReleaseSigning) {
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
                storeFile rootProject.file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
            }
        }
    }
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
            if (hasReleaseSigning) {
                signingConfig signingConfigs.release
            }
        }
    }
```

Debug builds stay unsigned/default. `assembleRelease` / `bundleRelease` **fail with a clear error** if credentials are missing.

## Build signed release

```bash
cd frontend
npm run cap:sync:android
cd android
./gradlew assembleRelease
./gradlew bundleRelease
```

Outputs:

- APK: `android/app/build/outputs/apk/release/app-release.apk`
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`

Verify APK:

```bash
apksigner verify --print-certs app/build/outputs/apk/release/app-release.apk
```

## Play Console

- Enable Play App Signing (recommended).
- Upload AAB to **Internal testing** first.
- `targetSdk` 34+ in `android/variables.gradle` (Capacitor default).

## Versioning

Increment `versionCode` / `versionName` in `android/app/build.gradle` each release.

## Git safety

Must stay ignored / untracked:

- `*.keystore` / `*.jks`
- `keystore.properties`
- any file containing store/key passwords
