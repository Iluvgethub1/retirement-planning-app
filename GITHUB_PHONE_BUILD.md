# Build from a phone with GitHub Actions

1. Create a new empty GitHub repository.
2. Upload every file and folder from this project, including the hidden `.github` folder.
3. Open the repository's **Actions** tab.
4. Select **Build Android APK and AAB**.
5. Tap **Run workflow**, then tap the green **Run workflow** button.
6. Open the completed run and download the artifact named `retirement-planning-debug-apk`.
7. Unzip that artifact on your phone to get `app-debug.apk`.

The APK is for testing and direct installation. The AAB produced here is unsigned and is not yet ready for Google Play. A later signed-release workflow can be added after a private keystore is created.
