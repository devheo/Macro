/**
 * Utility to generate an Android Studio project ZIP or text bundle.
 */

export interface AndroidProjectFile {
  path: string;
  content: string;
}

export function getFullAndroidProjectFiles(macroName: string, actionsSummary: string): AndroidProjectFile[] {
  return [
    {
      path: 'app/src/main/AndroidManifest.xml',
      content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.overlaymacro">

    <!-- 1. 다른 앱 위에 항상 떠 있는 플로팅 위젯 권한 -->
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
    <!-- 2. 백그라운드에서 시스템에 의해 종료되지 않도록 하는 포그라운드 서비스 -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Overlay Macro"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@android:style/Theme.DeviceDefault.NoActionBar">

        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- 3. 루팅 없이 다른 앱 화면을 클릭/스와이프하는 접근성 서비스 -->
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

        <!-- 4. 플로팅 오버레이 툴바 서비스 -->
        <service
            android:name=".FloatingOverlayService"
            android:enabled="true"
            android:exported="false" />
    </application>
</manifest>`,
    },
    {
      path: 'app/src/main/res/xml/accessibility_service_config.xml',
      content: `<?xml version="1.0" encoding="utf-8"?>
<accessibility-service xmlns:android="http://schemas.android.com/apk/res/android"
    android:description="@string/accessibility_description"
    android:accessibilityEventTypes="typeAllMask"
    android:accessibilityFeedbackType="feedbackGeneric"
    android:notificationTimeout="100"
    android:canPerformGestures="true"
    android:canRetrieveWindowContent="true"
    android:accessibilityFlags="flagDefault|flagRequestFilterKeyEvents" />`,
    },
    {
      path: 'app/src/main/java/com/example/overlaymacro/MainActivity.kt',
      content: `package com.example.overlaymacro

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.Toast

class MainActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val btnStart = findViewById<Button>(R.id.btn_start_overlay)
        btnStart.setOnClickListener {
            checkPermissionsAndStart()
        }
    }

    private fun checkPermissionsAndStart() {
        // 1. "다른 앱 위에 표시" 권한 확인
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
            Toast.makeText(this, "'다른 앱 위에 표시' 권한을 허용해주세요.", Toast.LENGTH_LONG).show()
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:$packageName")
            )
            startActivity(intent)
            return
        }

        // 2. 접근성 서비스 활성화 확인
        if (MacroAccessibilityService.instance == null) {
            Toast.makeText(this, "접근성 설정에서 'Overlay Macro' 서비스를 켜주세요.", Toast.LENGTH_LONG).show()
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
            startActivity(intent)
            return
        }

        // 3. 플로팅 오버레이 시작
        val overlayIntent = Intent(this, FloatingOverlayService::class.java)
        startService(overlayIntent)
        Toast.makeText(this, "플로팅 오버레이 컨트롤러가 시작되었습니다!", Toast.LENGTH_SHORT).show()
        finish() // 메인 액티비티는 닫고 백그라운드로 이동
    }
}`,
    },
  ];
}
