package com.example.overlaymacro

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

        val btnGrantOverlay = findViewById<Button>(R.id.btn_grant_overlay)
        val btnGrantAccessibility = findViewById<Button>(R.id.btn_grant_accessibility)
        val btnStart = findViewById<Button>(R.id.btn_start_overlay)

        // 1. 다른 앱 위에 표시 권한 요청
        btnGrantOverlay.setOnClickListener {
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

        // 2. 접근성 설정 열기
        btnGrantAccessibility.setOnClickListener {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
            startActivity(intent)
            Toast.makeText(this, "목록에서 'Overlay Macro' 서비스를 찾아 켜주세요.", Toast.LENGTH_LONG).show()
        }

        // 3. 플로팅 오버레이 시작
        btnStart.setOnClickListener {
            startOverlayService()
        }
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

        Toast.makeText(this, "플로팅 오버레이가 실행되었습니다! 홈 화면이나 게임으로 이동하세요.", Toast.LENGTH_LONG).show()
        finish() // 메인 화면 종료 후 백그라운드 전환
    }
}
