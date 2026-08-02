plugins {
    id("com.android.application")
}

android {
    namespace = "com.retirementplanning.tool"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.retirementplanning.tool"
        minSdk = 23
        targetSdk = 36
        versionCode = 1
        versionName = "1.0.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    implementation("androidx.activity:activity:1.10.1")
    implementation("androidx.lifecycle:lifecycle-runtime:2.9.1")
    implementation("androidx.savedstate:savedstate:1.3.0")
    implementation("androidx.webkit:webkit:1.14.0")
}
