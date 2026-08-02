# Retirement Planning Tool — Android

This Android Studio project packages the supplied HTML/JavaScript retirement-planning tool as an offline Android WebView app.

## Open and run

1. Install a current Android Studio version with Android SDK 36 and JDK 17 support.
2. Open this folder in Android Studio.
3. Allow Gradle sync to finish.
4. Choose an emulator or Android device and press **Run**.

## Build an APK

In Android Studio, select **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
The debug APK will normally be written to `app/build/outputs/apk/debug/app-debug.apk`.

## Build a signed AAB for Google Play

1. Select **Build > Generate Signed Bundle / APK**.
2. Choose **Android App Bundle**.
3. Create or select a private upload keystore. Store it securely and never add it to source control.
4. Select the `release` variant and finish the wizard.

Before publishing, change these values in `app/build.gradle.kts` as needed:

- `applicationId` — permanent Play Store package name.
- `versionCode` — increase for every uploaded release.
- `versionName` — user-facing release version.

## Website files

The original website files are in `app/src/main/assets/`. Keep `index.html` at that exact location. When replacing the website, copy all related HTML, JavaScript, CSS, audio and image files into the same assets directory.

## Play Store preparation still required

- Replace the placeholder app icon with final artwork.
- Review and finalize the in-app privacy policy.
- Prepare screenshots, feature graphic, descriptions, support contact and Data safety answers.
- Test calculations and local storage on physical phones and tablets.
- Confirm whether the app provides financial guidance and add suitable disclaimers where required.
