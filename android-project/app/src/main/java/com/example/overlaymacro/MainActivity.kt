package com.example.overlaymacro

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
        // 빠른 주기 선택 칩 버튼
        findViewById<Button>(R.id.btn_chip_100ms).setOnClickListener { etInterval.setText("100") }
        findViewById<Button>(R.id.btn_chip_1s).setOnClickListener { etInterval.setText("1000") }
        findViewById<Button>(R.id.btn_chip_3s).setOnClickListener { etInterval.setText("3000") }
        findViewById<Button>(R.id.btn_chip_5s).setOnClickListener { etInterval.setText("5000") }

        // 1. 다른 앱 위에 표시 권한 요청
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

        // 2. 접근성 설정 열기
        findViewById<Button>(R.id.btn_grant_accessibility).setOnClickListener {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
            startActivity(intent)
            Toast.makeText(this, "설정 > 접근성에서 'Overlay Macro' 서비스를 켜주세요.", Toast.LENGTH_LONG).show()
        }

        // 3. 설정 저장 및 플로팅 오버레이 시작
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
        finish() // 메인 화면 종료 후 백그라운드 전환
    }
}
