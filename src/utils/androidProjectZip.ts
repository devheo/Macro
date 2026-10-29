import JSZip from 'jszip';
import { MacroScript } from '../types/macro';
import { generateAccessibilityServiceKotlin } from './codeGenerators';

export async function downloadAndroidProjectZip(script: MacroScript) {
  const zip = new JSZip();

  // Root files
  zip.file(
    'settings.gradle',
    `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "OverlayMacro"
include(":app")
`
  );

  zip.file(
    'build.gradle',
    `buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath "com.android.tools.build:gradle:8.3.0"
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.22"
    }
}

task clean(type: Delete) {
    delete rootProject.buildDir
}
`
  );

  zip.file(
    'gradle.properties',
    `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
kotlin.code.style=official
`
  );

  const wrapperFolder = zip.folder('gradle')?.folder('wrapper');
  wrapperFolder?.file(
    'gradle-wrapper.properties',
    `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.4-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`
  );

  // App module
  const appFolder = zip.folder('app');
  appFolder?.file(
    'build.gradle',
    `plugins {
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android'
}

android {
    namespace 'com.example.overlaymacro'
    compileSdk 34

    defaultConfig {
        applicationId "com.example.overlaymacro"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
    kotlinOptions {
        jvmTarget = '1.8'
    }
    buildFeatures {
        viewBinding true
    }
}

dependencies {
    implementation 'androidx.core:core-ktx:1.12.0'
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.11.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
}
`
  );

  // AndroidManifest.xml
  const mainFolder = appFolder?.folder('src')?.folder('main');
  mainFolder?.file(
    'AndroidManifest.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.overlaymacro">

    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.OverlayMacro">

        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <service
            android:name=".MacroAccessibilityService"
            android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE"
            android:exported="true">
            <intent-filter>
                <action android:name="android.accessibilityservice.AccessibilityService" />
            </intent-filter>
            <meta-data
                android:name="android.accessibilityservice"
                android:resource="@xml/accessibility_service_config" />
        </service>

        <service
            android:name=".FloatingOverlayService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="specialUse" />

    </application>
</manifest>`
  );

  // Resources
  const resFolder = mainFolder?.folder('res');
  resFolder?.folder('values')?.file(
    'strings.xml',
    `<resources>
    <string name="app_name">Overlay Macro</string>
    <string name="accessibility_service_desc">자동 클릭 및 제스처 패턴을 실행하기 위해 접근성 제스처 주입 권한이 필요합니다.</string>
</resources>`
  );

  resFolder?.folder('values')?.file(
    'colors.xml',
    `<resources>
    <color name="purple_500">#4F46E5</color>
    <color name="purple_700">#3730A3</color>
    <color name="teal_200">#14B8A6</color>
    <color name="teal_700">#0F766E</color>
    <color name="black">#FF000000</color>
    <color name="white">#FFFFFFFF</color>
    <color name="bg_dark">#0F172A</color>
</resources>`
  );

  resFolder?.folder('values')?.file(
    'themes.xml',
    `<resources xmlns:tools="http://schemas.android.com/tools">
    <style name="Theme.OverlayMacro" parent="Theme.MaterialComponents.DayNight.DarkActionBar">
        <item name="colorPrimary">@color/purple_500</item>
        <item name="colorPrimaryVariant">@color/purple_700</item>
        <item name="colorOnPrimary">@color/white</item>
        <item name="colorSecondary">@color/teal_200</item>
        <item name="colorSecondaryVariant">@color/teal_700</item>
        <item name="colorOnSecondary">@color/black</item>
    </style>
</resources>`
  );

  resFolder?.folder('xml')?.file(
    'accessibility_service_config.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<accessibility-service xmlns:android="http://schemas.android.com/apk/res/android"
    android:description="@string/accessibility_service_desc"
    android:accessibilityEventTypes="typeAllMask"
    android:accessibilityFeedbackType="feedbackGeneric"
    android:notificationTimeout="100"
    android:canPerformGestures="true"
    android:canRetrieveWindowContent="true"
    android:accessibilityFlags="flagDefault|flagRequestFilterKeyEvents" />`
  );

  // App Icon: Adaptive Icon (API 26+)
  const mipmapFolder = resFolder?.folder('mipmap-anydpi-v26');
  mipmapFolder?.file(
    'ic_launcher.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>`
  );

  mipmapFolder?.file(
    'ic_launcher_round.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>`
  );

  // App Icon Drawables: Background & Foreground
  const drawableFolder = resFolder?.folder('drawable');
  drawableFolder?.file(
    'ic_launcher_background.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#0B0F19"
        android:pathData="M0,0h108v108h-108z" />
    <path
        android:fillColor="#151C2C"
        android:pathData="M54,14 A40,40 0 1,1 53.99,14 Z" />
</vector>`
  );

  drawableFolder?.file(
    'ic_launcher_foreground.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:strokeColor="#A855F7"
        android:strokeWidth="2.5"
        android:strokeAlpha="0.85"
        android:pathData="M54,26 A28,28 0 1,1 53.99,26 Z" />
    <path
        android:strokeColor="#06B6D4"
        android:strokeWidth="2.5"
        android:pathData="M54,34 A20,20 0 1,1 53.99,34 Z" />
    <path
        android:strokeColor="#C084FC"
        android:strokeWidth="3.5"
        android:pathData="M54,46 A8,8 0 1,1 53.99,46 Z" />
    <path
        android:fillColor="#22D3EE"
        android:pathData="M54,52 A2,2 0 1,1 53.99,52 Z" />
    <path
        android:strokeColor="#22D3EE"
        android:strokeWidth="2.5"
        android:strokeLineCap="round"
        android:pathData="M24,54 L44,54" />
    <path
        android:strokeColor="#22D3EE"
        android:strokeWidth="2.5"
        android:strokeLineCap="round"
        android:pathData="M64,54 L84,54" />
    <path
        android:strokeColor="#06B6D4"
        android:strokeWidth="2.5"
        android:strokeLineCap="round"
        android:pathData="M54,24 L54,44" />
    <path
        android:strokeColor="#06B6D4"
        android:strokeWidth="2.5"
        android:strokeLineCap="round"
        android:pathData="M54,64 L54,84" />
</vector>`
  );

  // Layouts
  const layoutFolder = resFolder?.folder('layout');
  layoutFolder?.file(
    'activity_main.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<ScrollView xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#0B0F19"
    android:fillViewport="true">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical"
        android:padding="20dp">

        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:orientation="horizontal"
            android:gravity="center_vertical"
            android:layout_marginTop="8dp">

            <ImageView
                android:layout_width="48dp"
                android:layout_height="48dp"
                android:src="@mipmap/ic_launcher"
                android:contentDescription="App Icon" />

            <LinearLayout
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:orientation="vertical"
                android:layout_marginStart="14dp">

                <TextView
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:text="Overlay Macro"
                    android:textColor="#FFFFFF"
                    android:textSize="20sp"
                    android:textStyle="bold" />

                <TextView
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:text="안드로이드 오버레이 매크로 설정"
                    android:textColor="#94A3B8"
                    android:textSize="12sp" />
            </LinearLayout>
        </LinearLayout>

        <View
            android:layout_width="match_parent"
            android:layout_height="1dp"
            android:background="#1E293B"
            android:layout_marginVertical="16dp" />

        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:orientation="vertical"
            android:background="#151C2C"
            android:padding="16dp"
            android:layout_marginBottom="16dp">

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="⚙️ 매크로 동작 설정 (Macro Settings)"
                android:textColor="#F8FAFC"
                android:textSize="15sp"
                android:textStyle="bold" />

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="클릭 주기 및 반복 방식을 스마트폰 안에서 직접 설정합니다."
                android:textColor="#94A3B8"
                android:textSize="11sp"
                android:layout_marginTop="2dp"
                android:layout_marginBottom="14dp" />

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="정해진 클릭 주기 (Click Interval)"
                android:textColor="#E2E8F0"
                android:textSize="13sp"
                android:textStyle="bold" />

            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:orientation="horizontal"
                android:gravity="center_vertical"
                android:layout_marginTop="6dp">

                <EditText
                    android:id="@+id/et_interval_ms"
                    android:layout_width="0dp"
                    android:layout_height="44dp"
                    android:layout_weight="1"
                    android:background="#0B0F19"
                    android:textColor="#38BDF8"
                    android:hint="3000"
                    android:inputType="number"
                    android:paddingHorizontal="12dp"
                    android:textSize="15sp"
                    android:textStyle="bold" />

                <TextView
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:text="밀리초 (ms)"
                    android:textColor="#94A3B8"
                    android:textSize="13sp"
                    android:layout_marginStart="10dp" />
            </LinearLayout>

            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:orientation="horizontal"
                android:layout_marginTop="8dp">

                <Button
                    android:id="@+id/btn_chip_100ms"
                    android:layout_width="0dp"
                    android:layout_height="36dp"
                    android:layout_weight="1"
                    android:text="0.1초"
                    android:textSize="11sp"
                    android:backgroundTint="#334155" />

                <Button
                    android:id="@+id/btn_chip_1s"
                    android:layout_width="0dp"
                    android:layout_height="36dp"
                    android:layout_weight="1"
                    android:layout_marginStart="4dp"
                    android:text="1초"
                    android:textSize="11sp"
                    android:backgroundTint="#334155" />

                <Button
                    android:id="@+id/btn_chip_3s"
                    android:layout_width="0dp"
                    android:layout_height="36dp"
                    android:layout_weight="1"
                    android:layout_marginStart="4dp"
                    android:text="3초"
                    android:textSize="11sp"
                    android:backgroundTint="#4F46E5" />

                <Button
                    android:id="@+id/btn_chip_5s"
                    android:layout_width="0dp"
                    android:layout_height="36dp"
                    android:layout_weight="1"
                    android:layout_marginStart="4dp"
                    android:text="5초"
                    android:textSize="11sp"
                    android:backgroundTint="#334155" />
            </LinearLayout>

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="터치 누름 유지 시간 (Duration)"
                android:textColor="#E2E8F0"
                android:textSize="13sp"
                android:textStyle="bold"
                android:layout_marginTop="16dp" />

            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:orientation="horizontal"
                android:gravity="center_vertical"
                android:layout_marginTop="6dp">

                <EditText
                    android:id="@+id/et_duration_ms"
                    android:layout_width="0dp"
                    android:layout_height="44dp"
                    android:layout_weight="1"
                    android:background="#0B0F19"
                    android:textColor="#38BDF8"
                    android:hint="50"
                    android:inputType="number"
                    android:paddingHorizontal="12dp"
                    android:textSize="14sp" />

                <TextView
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:text="ms (일반: 50ms, 길게: 800ms)"
                    android:textColor="#94A3B8"
                    android:textSize="11sp"
                    android:layout_marginStart="10dp" />
            </LinearLayout>

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="반복 방식 (Loop Mode)"
                android:textColor="#E2E8F0"
                android:textSize="13sp"
                android:textStyle="bold"
                android:layout_marginTop="16dp" />

            <RadioGroup
                android:id="@+id/rg_loop_mode"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:orientation="vertical"
                android:layout_marginTop="6dp">

                <RadioButton
                    android:id="@+id/rb_infinite"
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:text="무한 반복 (정지 버튼을 누를 때까지)"
                    android:textColor="#CBD5E1"
                    android:textSize="13sp"
                    android:checked="true" />

                <LinearLayout
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:orientation="horizontal"
                    android:gravity="center_vertical">

                    <RadioButton
                        android:id="@+id/rb_count"
                        android:layout_width="wrap_content"
                        android:layout_height="wrap_content"
                        android:text="횟수 지정: "
                        android:textColor="#CBD5E1"
                        android:textSize="13sp" />

                    <EditText
                        android:id="@+id/et_loop_count"
                        android:layout_width="80dp"
                        android:layout_height="38dp"
                        android:background="#0B0F19"
                        android:textColor="#38BDF8"
                        android:text="100"
                        android:inputType="number"
                        android:gravity="center"
                        android:textSize="13sp" />

                    <TextView
                        android:layout_width="wrap_content"
                        android:layout_height="wrap_content"
                        android:text="회 실행 후 자동 정지"
                        android:textColor="#94A3B8"
                        android:textSize="12sp"
                        android:layout_marginStart="8dp" />
                </LinearLayout>
            </RadioGroup>

            <CheckBox
                android:id="@+id/cb_antiban"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="오토 탐지 방지 (좌표 ±8px / 시간 랜덤 편차)"
                android:textColor="#CBD5E1"
                android:textSize="13sp"
                android:checked="true"
                android:layout_marginTop="12dp" />
        </LinearLayout>

        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:orientation="vertical"
            android:background="#151C2C"
            android:padding="16dp"
            android:layout_marginBottom="20dp">

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="🔒 안드로이드 필수 권한 (2가지)"
                android:textColor="#F8FAFC"
                android:textSize="15sp"
                android:textStyle="bold" />

            <Button
                android:id="@+id/btn_grant_overlay"
                android:layout_width="match_parent"
                android:layout_height="44dp"
                android:text="1. 다른 앱 위에 표시 권한 허용"
                android:layout_marginTop="10dp"
                android:backgroundTint="#4F46E5" />

            <Button
                android:id="@+id/btn_grant_accessibility"
                android:layout_width="match_parent"
                android:layout_height="44dp"
                android:text="2. 접근성 서비스 제스처 주입 허용"
                android:layout_marginTop="8dp"
                android:backgroundTint="#0D9488" />
        </LinearLayout>

        <Button
            android:id="@+id/btn_start_overlay"
            android:layout_width="match_parent"
            android:layout_height="56dp"
            android:text="설정 저장 및 플로팅 오버레이 시작"
            android:textSize="16sp"
            android:textStyle="bold"
            android:backgroundTint="#16A34A"
            android:layout_marginBottom="24dp" />

    </LinearLayout>
</ScrollView>`
  );

  layoutFolder?.file(
    'layout_floating_widget.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/floating_root"
    android:layout_width="wrap_content"
    android:layout_height="wrap_content"
    android:orientation="vertical"
    android:background="#E60B0F19"
    android:padding="6dp"
    android:gravity="center_horizontal">

    <ImageView
        android:id="@+id/btn_drag"
        android:layout_width="32dp"
        android:layout_height="24dp"
        android:src="@android:drawable/ic_menu_sort_by_size"
        android:tint="#94A3B8"
        android:contentDescription="Drag" />

    <ImageButton
        android:id="@+id/btn_play_pause"
        android:layout_width="44dp"
        android:layout_height="44dp"
        android:layout_marginTop="4dp"
        android:src="@android:drawable/ic_media_play"
        android:backgroundTint="#16A34A"
        android:contentDescription="Play/Pause" />

    <ImageButton
        android:id="@+id/btn_add_target"
        android:layout_width="44dp"
        android:layout_height="44dp"
        android:layout_marginTop="4dp"
        android:src="@android:drawable/ic_input_add"
        android:backgroundTint="#4F46E5"
        android:contentDescription="Add Target" />

    <ImageButton
        android:id="@+id/btn_settings"
        android:layout_width="44dp"
        android:layout_height="44dp"
        android:layout_marginTop="4dp"
        android:src="@android:drawable/ic_menu_manage"
        android:backgroundTint="#0F766E"
        android:contentDescription="Settings" />

    <ImageButton
        android:id="@+id/btn_clear_targets"
        android:layout_width="44dp"
        android:layout_height="44dp"
        android:layout_marginTop="4dp"
        android:src="@android:drawable/ic_menu_delete"
        android:backgroundTint="#334155"
        android:contentDescription="Clear" />

    <ImageButton
        android:id="@+id/btn_close"
        android:layout_width="44dp"
        android:layout_height="44dp"
        android:layout_marginTop="4dp"
        android:src="@android:drawable/ic_menu_close_clear_cancel"
        android:backgroundTint="#E11D48"
        android:contentDescription="Close" />

</LinearLayout>`
  );

  layoutFolder?.file(
    'layout_floating_settings_dialog.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/dialog_root"
    android:layout_width="280dp"
    android:layout_height="wrap_content"
    android:orientation="vertical"
    android:background="#FA0B0F19"
    android:padding="16dp"
    android:elevation="12dp">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:gravity="center_vertical">

        <TextView
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:text="⚡ 매크로 간편 설정"
            android:textColor="#FFFFFF"
            android:textSize="15sp"
            android:textStyle="bold" />

        <ImageButton
            android:id="@+id/btn_dialog_close"
            android:layout_width="32dp"
            android:layout_height="32dp"
            android:src="@android:drawable/ic_menu_close_clear_cancel"
            android:background="?android:attr/selectableItemBackgroundBorderless"
            android:tint="#94A3B8" />
    </LinearLayout>

    <View
        android:layout_width="match_parent"
        android:layout_height="1dp"
        android:background="#334155"
        android:layout_marginVertical="10dp" />

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="클릭 주기 (ms)"
        android:textColor="#CBD5E1"
        android:textSize="12sp"
        android:textStyle="bold" />

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:gravity="center_vertical"
        android:layout_marginTop="4dp">

        <EditText
            android:id="@+id/dialog_et_interval"
            android:layout_width="0dp"
            android:layout_height="38dp"
            android:layout_weight="1"
            android:background="#151C2C"
            android:textColor="#38BDF8"
            android:inputType="number"
            android:paddingHorizontal="10dp"
            android:textSize="14sp" />

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="ms"
            android:textColor="#94A3B8"
            android:textSize="12sp"
            android:layout_marginStart="8dp" />
    </LinearLayout>

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:layout_marginTop="6dp">

        <Button
            android:id="@+id/dialog_btn_100ms"
            android:layout_width="0dp"
            android:layout_height="32dp"
            android:layout_weight="1"
            android:text="0.1초"
            android:textSize="10sp"
            android:backgroundTint="#1E293B" />

        <Button
            android:id="@+id/dialog_btn_1s"
            android:layout_width="0dp"
            android:layout_height="32dp"
            android:layout_weight="1"
            android:layout_marginStart="4dp"
            android:text="1초"
            android:textSize="10sp"
            android:backgroundTint="#1E293B" />

        <Button
            android:id="@+id/dialog_btn_3s"
            android:layout_width="0dp"
            android:layout_height="32dp"
            android:layout_weight="1"
            android:layout_marginStart="4dp"
            android:text="3초"
            android:textSize="10sp"
            android:backgroundTint="#4F46E5" />

        <Button
            android:id="@+id/dialog_btn_5s"
            android:layout_width="0dp"
            android:layout_height="32dp"
            android:layout_weight="1"
            android:layout_marginStart="4dp"
            android:text="5초"
            android:textSize="10sp"
            android:backgroundTint="#1E293B" />
    </LinearLayout>

    <CheckBox
        android:id="@+id/dialog_cb_antiban"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="오토 방지 랜덤 편차 (±8px)"
        android:textColor="#CBD5E1"
        android:textSize="12sp"
        android:checked="true"
        android:layout_marginTop="8dp" />

    <Button
        android:id="@+id/dialog_btn_apply"
        android:layout_width="match_parent"
        android:layout_height="40dp"
        android:text="설정 적용하기"
        android:textSize="13sp"
        android:textStyle="bold"
        android:backgroundTint="#16A34A"
        android:layout_marginTop="12dp" />

</LinearLayout>`
  );

  layoutFolder?.file(
    'layout_target_pin.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/pin_root"
    android:layout_width="48dp"
    android:layout_height="48dp">

    <TextView
        android:id="@+id/tv_pin_number"
        android:layout_width="44dp"
        android:layout_height="44dp"
        android:layout_gravity="center"
        android:background="@android:drawable/btn_default"
        android:backgroundTint="#4F46E5"
        android:gravity="center"
        android:text="1"
        android:textColor="#FFFFFF"
        android:textSize="16sp"
        android:textStyle="bold" />

</FrameLayout>`
  );

  // Kotlin Code files
  const javaFolder = mainFolder?.folder('java')?.folder('com')?.folder('example')?.folder('overlaymacro');

  javaFolder?.file(
    'MacroConfig.kt',
    `package com.example.overlaymacro

import android.content.Context
import android.content.SharedPreferences

data class MacroSettings(
    var clickIntervalMs: Long = 3000L,
    var pressDurationMs: Long = 50L,
    var swipeDurationMs: Long = 320L,
    var isInfiniteLoop: Boolean = true,
    var targetLoopCount: Int = 100,
    var isAntiBanEnabled: Boolean = true,
    var antiBanOffsetPx: Int = 8,
    var activePresetName: String = "정해진 초마다 클릭"
)

object MacroConfigManager {
    private const val PREF_NAME = "overlay_macro_prefs"
    private const val KEY_INTERVAL = "key_interval"
    private const val KEY_DURATION = "key_duration"
    private const val KEY_SWIPE_DURATION = "key_swipe_duration"
    private const val KEY_INFINITE = "key_infinite"
    private const val KEY_LOOP_COUNT = "key_loop_count"
    private const val KEY_ANTI_BAN = "key_anti_ban"
    private const val KEY_OFFSET_PX = "key_offset_px"
    private const val KEY_PRESET = "key_preset"

    fun saveSettings(context: Context, settings: MacroSettings) {
        val prefs: SharedPreferences = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        prefs.edit().apply {
            putLong(KEY_INTERVAL, settings.clickIntervalMs)
            putLong(KEY_DURATION, settings.pressDurationMs)
            putLong(KEY_SWIPE_DURATION, settings.swipeDurationMs)
            putBoolean(KEY_INFINITE, settings.isInfiniteLoop)
            putInt(KEY_LOOP_COUNT, settings.targetLoopCount)
            putBoolean(KEY_ANTI_BAN, settings.isAntiBanEnabled)
            putInt(KEY_OFFSET_PX, settings.antiBanOffsetPx)
            putString(KEY_PRESET, settings.activePresetName)
            apply()
        }
    }

    fun loadSettings(context: Context): MacroSettings {
        val prefs: SharedPreferences = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        return MacroSettings(
            clickIntervalMs = prefs.getLong(KEY_INTERVAL, 3000L),
            pressDurationMs = prefs.getLong(KEY_DURATION, 50L),
            swipeDurationMs = prefs.getLong(KEY_SWIPE_DURATION, 320L),
            isInfiniteLoop = prefs.getBoolean(KEY_INFINITE, true),
            targetLoopCount = prefs.getInt(KEY_LOOP_COUNT, 100),
            isAntiBanEnabled = prefs.getBoolean(KEY_ANTI_BAN, true),
            antiBanOffsetPx = prefs.getInt(KEY_OFFSET_PX, 8),
            activePresetName = prefs.getString(KEY_PRESET, "정해진 초마다 클릭") ?: "정해진 초마다 클릭"
        )
    }
}
`
  );

  javaFolder?.file(
    'MacroAction.kt',
    `package com.example.overlaymacro

sealed class MacroAction {
    data class Tap(
        val x: Float,
        val y: Float,
        val durationMs: Long = 50L,
        val delayAfterMs: Long = 1000L
    ) : MacroAction()

    data class Swipe(
        val startX: Float,
        val startY: Float,
        val endX: Float,
        val endY: Float,
        val durationMs: Long = 300L,
        val delayAfterMs: Long = 1000L
    ) : MacroAction()

    data class Delay(
        val durationMs: Long
    ) : MacroAction()
}
`
  );

  javaFolder?.file(
    'MacroAccessibilityService.kt',
    generateAccessibilityServiceKotlin(script)
  );

  javaFolder?.file(
    'FloatingOverlayService.kt',
    `package com.example.overlaymacro

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.CheckBox
import android.widget.EditText
import android.widget.ImageButton
import android.widget.TextView
import android.widget.Toast
import androidx.core.app.NotificationCompat
import kotlin.random.Random

class FloatingOverlayService : Service() {

    private lateinit var windowManager: WindowManager
    private lateinit var floatingView: View
    private lateinit var floatingParams: WindowManager.LayoutParams
    private var settingsDialogView: View? = null
    private var settingsDialogParams: WindowManager.LayoutParams? = null
    private val targetPins = mutableListOf<View>()
    private var isPlaying = false
    private lateinit var currentSettings: MacroSettings

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        currentSettings = MacroConfigManager.loadSettings(this)

        startForegroundNotification()
        setupFloatingToolbar()
    }

    private fun startForegroundNotification() {
        val channelId = "overlay_macro_channel"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Overlay Macro",
                NotificationManager.IMPORTANCE_LOW
            )
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }

        val notification: Notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("Overlay Macro 활성화됨")
            .setContentText("클릭 주기: \${currentSettings.clickIntervalMs}ms")
            .setSmallIcon(android.R.drawable.ic_media_play)
            .build()

        startForeground(1001, notification)
    }

    private fun setupFloatingToolbar() {
        floatingView = LayoutInflater.from(this).inflate(R.layout.layout_floating_widget, null)

        val overlayType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        floatingParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            overlayType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = 40
            y = 250
        }

        windowManager.addView(floatingView, floatingParams)
        setupListeners()
    }

    private fun setupListeners() {
        val btnDrag = floatingView.findViewById<View>(R.id.btn_drag)
        val btnPlay = floatingView.findViewById<ImageButton>(R.id.btn_play_pause)
        val btnAddTarget = floatingView.findViewById<ImageButton>(R.id.btn_add_target)
        val btnSettings = floatingView.findViewById<ImageButton>(R.id.btn_settings)
        val btnClear = floatingView.findViewById<ImageButton>(R.id.btn_clear_targets)
        val btnClose = floatingView.findViewById<ImageButton>(R.id.btn_close)

        var initX = 0
        var initY = 0
        var touchX = 0f
        var touchY = 0f

        btnDrag.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initX = floatingParams.x
                    initY = floatingParams.y
                    touchX = event.rawX
                    touchY = event.rawY
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    floatingParams.x = initX + (event.rawX - touchX).toInt()
                    floatingParams.y = initY + (event.rawY - touchY).toInt()
                    windowManager.updateViewLayout(floatingView, floatingParams)
                    true
                }
                else -> false
            }
        }

        btnAddTarget.setOnClickListener {
            addTargetPin()
        }

        btnSettings.setOnClickListener {
            toggleFloatingSettingsDialog()
        }

        btnPlay.setOnClickListener {
            val service = MacroAccessibilityService.instance
            if (service == null) {
                Toast.makeText(this, "접근성 설정에서 서비스를 켜주세요!", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            if (targetPins.isEmpty()) {
                Toast.makeText(this, "먼저 [+] 버튼을 눌러 타깃 핀을 추가하세요!", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            isPlaying = !isPlaying
            if (isPlaying) {
                btnPlay.setImageResource(android.R.drawable.ic_media_pause)
                btnPlay.setBackgroundColor(0xFFD97706.toInt())

                val actions = targetPins.map { pinView ->
                    val location = IntArray(2)
                    pinView.getLocationOnScreen(location)
                    var centerX = location[0] + (pinView.width / 2f)
                    var centerY = location[1] + (pinView.height / 2f)

                    if (currentSettings.isAntiBanEnabled) {
                        val offset = currentSettings.antiBanOffsetPx
                        centerX += Random.nextInt(-offset, offset + 1)
                        centerY += Random.nextInt(-offset, offset + 1)
                    }

                    MacroAction.Tap(
                        x = centerX,
                        y = centerY,
                        durationMs = currentSettings.pressDurationMs,
                        delayAfterMs = currentSettings.clickIntervalMs
                    )
                }

                service.startMacro(actions)
                Toast.makeText(this, "매크로 시작 (\${currentSettings.clickIntervalMs}ms 주기)", Toast.LENGTH_SHORT).show()
            } else {
                btnPlay.setImageResource(android.R.drawable.ic_media_play)
                btnPlay.setBackgroundColor(0xFF16A34A.toInt())
                service.stopMacro()
                Toast.makeText(this, "매크로 일시정지", Toast.LENGTH_SHORT).show()
            }
        }

        btnClear.setOnClickListener {
            targetPins.forEach { pin ->
                try { windowManager.removeView(pin) } catch (_: Exception) {}
            }
            targetPins.clear()
            isPlaying = false
            MacroAccessibilityService.instance?.stopMacro()
            btnPlay.setImageResource(android.R.drawable.ic_media_play)
            Toast.makeText(this, "타깃 핀 초기화", Toast.LENGTH_SHORT).show()
        }

        btnClose.setOnClickListener {
            stopSelf()
        }
    }

    private fun toggleFloatingSettingsDialog() {
        if (settingsDialogView != null) {
            closeSettingsDialog()
            return
        }

        val overlayType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        val dialogView = LayoutInflater.from(this).inflate(R.layout.layout_floating_settings_dialog, null)
        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            overlayType,
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                    WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.CENTER
        }

        val etInterval = dialogView.findViewById<EditText>(R.id.dialog_et_interval)
        val cbAntiBan = dialogView.findViewById<CheckBox>(R.id.dialog_cb_antiban)

        etInterval.setText(currentSettings.clickIntervalMs.toString())
        cbAntiBan.isChecked = currentSettings.isAntiBanEnabled

        dialogView.findViewById<Button>(R.id.dialog_btn_100ms).setOnClickListener { etInterval.setText("100") }
        dialogView.findViewById<Button>(R.id.dialog_btn_1s).setOnClickListener { etInterval.setText("1000") }
        dialogView.findViewById<Button>(R.id.dialog_btn_3s).setOnClickListener { etInterval.setText("3000") }
        dialogView.findViewById<Button>(R.id.dialog_btn_5s).setOnClickListener { etInterval.setText("5000") }

        dialogView.findViewById<View>(R.id.btn_dialog_close).setOnClickListener {
            closeSettingsDialog()
        }

        dialogView.findViewById<Button>(R.id.dialog_btn_apply).setOnClickListener {
            val newInterval = etInterval.text.toString().toLongOrNull() ?: currentSettings.clickIntervalMs
            currentSettings.clickIntervalMs = newInterval
            currentSettings.isAntiBanEnabled = cbAntiBan.isChecked

            MacroConfigManager.saveSettings(this, currentSettings)
            Toast.makeText(this, "설정 변경됨: \${newInterval}ms 주기", Toast.LENGTH_SHORT).show()
            closeSettingsDialog()
        }

        windowManager.addView(dialogView, params)
        settingsDialogView = dialogView
        settingsDialogParams = params
    }

    private fun closeSettingsDialog() {
        settingsDialogView?.let {
            try { windowManager.removeView(it) } catch (_: Exception) {}
        }
        settingsDialogView = null
        settingsDialogParams = null
    }

    private fun addTargetPin() {
        val num = targetPins.size + 1
        val pinView = LayoutInflater.from(this).inflate(R.layout.layout_target_pin, null)
        val tvNumber = pinView.findViewById<TextView>(R.id.tv_pin_number)
        tvNumber.text = num.toString()

        val overlayType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        val pinParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            overlayType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = 250 + (num * 30)
            y = 450 + (num * 30)
        }

        var pinInitX = 0
        var pinInitY = 0
        var pinTouchX = 0f
        var pinTouchY = 0f

        pinView.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    pinInitX = pinParams.x
                    pinInitY = pinParams.y
                    pinTouchX = event.rawX
                    pinTouchY = event.rawY
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    pinParams.x = pinInitX + (event.rawX - pinTouchX).toInt()
                    pinParams.y = pinInitY + (event.rawY - pinTouchY).toInt()
                    windowManager.updateViewLayout(pinView, pinParams)
                    true
                }
                else -> false
            }
        }

        windowManager.addView(pinView, pinParams)
        targetPins.add(pinView)
        Toast.makeText(this, "타깃 핀 #\$num 생성됨", Toast.LENGTH_SHORT).show()
    }

    override fun onDestroy() {
        super.onDestroy()
        MacroAccessibilityService.instance?.stopMacro()
        closeSettingsDialog()
        targetPins.forEach { try { windowManager.removeView(it) } catch (_: Exception) {} }
        targetPins.clear()
        if (::floatingView.isInitialized) {
            try { windowManager.removeView(floatingView) } catch (_: Exception) {}
        }
    }
}
`
  );

  javaFolder?.file(
    'MainActivity.kt',
    `package com.example.overlaymacro

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.CheckBox
import android.widget.EditText
import android.widget.RadioButton
import android.widget.RadioGroup
import android.widget.Toast

class MainActivity : Activity() {

    private lateinit var etInterval: EditText
    private lateinit var etDuration: EditText
    private lateinit var rgLoopMode: RadioGroup
    private lateinit var rbInfinite: RadioButton
    private lateinit var rbCount: RadioButton
    private lateinit var etLoopCount: EditText
    private lateinit var cbAntiBan: CheckBox

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        initViews()
        loadSavedConfig()
        setupListeners()
    }

    private fun initViews() {
        etInterval = findViewById(R.id.et_interval_ms)
        etDuration = findViewById(R.id.et_duration_ms)
        rgLoopMode = findViewById(R.id.rg_loop_mode)
        rbInfinite = findViewById(R.id.rb_infinite)
        rbCount = findViewById(R.id.rb_count)
        etLoopCount = findViewById(R.id.et_loop_count)
        cbAntiBan = findViewById(R.id.cb_antiban)
    }

    private fun loadSavedConfig() {
        val config = MacroConfigManager.loadSettings(this)
        etInterval.setText(config.clickIntervalMs.toString())
        etDuration.setText(config.pressDurationMs.toString())
        cbAntiBan.isChecked = config.isAntiBanEnabled
        etLoopCount.setText(config.targetLoopCount.toString())

        if (config.isInfiniteLoop) {
            rbInfinite.isChecked = true
        } else {
            rbCount.isChecked = true
        }
    }

    private fun setupListeners() {
        findViewById<Button>(R.id.btn_chip_100ms).setOnClickListener { etInterval.setText("100") }
        findViewById<Button>(R.id.btn_chip_1s).setOnClickListener { etInterval.setText("1000") }
        findViewById<Button>(R.id.btn_chip_3s).setOnClickListener { etInterval.setText("3000") }
        findViewById<Button>(R.id.btn_chip_5s).setOnClickListener { etInterval.setText("5000") }

        findViewById<Button>(R.id.btn_grant_overlay).setOnClickListener {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (!Settings.canDrawOverlays(this)) {
                    val intent = Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:$packageName")
                    )
                    startActivity(intent)
                } else {
                    Toast.makeText(this, "이미 '다른 앱 위에 표시' 권한이 허용되어 있습니다.", Toast.LENGTH_SHORT).show()
                }
            }
        }

        findViewById<Button>(R.id.btn_grant_accessibility).setOnClickListener {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
            startActivity(intent)
            Toast.makeText(this, "목록에서 'Overlay Macro' 서비스를 찾아 켜주세요.", Toast.LENGTH_LONG).show()
        }

        findViewById<Button>(R.id.btn_start_overlay).setOnClickListener {
            saveCurrentConfig()
            startOverlayService()
        }
    }

    private fun saveCurrentConfig() {
        val intervalMs = etInterval.text.toString().toLongOrNull() ?: 3000L
        val durationMs = etDuration.text.toString().toLongOrNull() ?: 50L
        val isInfinite = rbInfinite.isChecked
        val loopCount = etLoopCount.text.toString().toIntOrNull() ?: 100
        val antiBan = cbAntiBan.isChecked

        val newSettings = MacroSettings(
            clickIntervalMs = intervalMs,
            pressDurationMs = durationMs,
            isInfiniteLoop = isInfinite,
            targetLoopCount = loopCount,
            isAntiBanEnabled = antiBan
        )
        MacroConfigManager.saveSettings(this, newSettings)
    }

    private fun startOverlayService() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
            Toast.makeText(this, "'다른 앱 위에 표시' 권한을 먼저 허용해주세요.", Toast.LENGTH_LONG).show()
            return
        }

        if (MacroAccessibilityService.instance == null) {
            Toast.makeText(this, "'접근성 서비스'를 먼저 켜주셔야 매크로 터치가 가능합니다.", Toast.LENGTH_LONG).show()
            return
        }

        val intent = Intent(this, FloatingOverlayService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }

        Toast.makeText(this, "설정 적용 완료! 화면 위에 플로팅 위젯이 떴습니다.", Toast.LENGTH_LONG).show()
        finish()
    }
}
`
  );

  // README
  zip.file(
    'README.md',
    `# Overlay Macro - Android Studio 프로젝트

안드로이드 스마트폰에서 다른 앱(게임, 숏폼 등) 위에 항상 떠 있는 플로팅 위젯(Floating Overlay)을 띄우고, 정해진 초마다 클릭 및 스와이프를 실행하는 네이티브 프로젝트입니다.

## 안드로이드 스튜디오 실행 방법:
1. Android Studio 열기 -> Open -> 이 압축을 푼 폴더 선택
2. 스마트폰 USB 디버깅 켜고 PC 연결
3. 상단 Run (▶) 실행하여 스마트폰에 앱 설치
`
  );

  // Generate ZIP blob and trigger download
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Android_Overlay_Macro_Project.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
