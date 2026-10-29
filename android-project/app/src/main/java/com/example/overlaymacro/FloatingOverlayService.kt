package com.example.overlaymacro

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

/**
 * FloatingOverlayService:
 * 다른 앱 위에 항상 떠 있는 플로팅 툴바 및 타깃 핀(①, ②, ③)을 관리합니다.
 *
 * [핵심 터치 관통(Click-Through) 해결]:
 * 재생(Play) 중에는 타깃 핀에 FLAG_NOT_TOUCHABLE 플래그를 적용하여,
 * 접근성 서비스가 쏘는 터치가 핀에 가로막히지 않고 밑에 있는 게임/앱 화면으로 100% 관통되도록 합니다.
 */
class FloatingOverlayService : Service() {

    private lateinit var windowManager: WindowManager
    private lateinit var floatingView: View
    private lateinit var floatingParams: WindowManager.LayoutParams

    // 플로팅 설정 다이얼로그
    private var settingsDialogView: View? = null
    private var settingsDialogParams: WindowManager.LayoutParams? = null

    // 타깃 핀 관리 리스트
    private val targetPins = mutableListOf<View>()
    private var isPlaying = false

    // 현재 매크로 설정 캐시
    private lateinit var currentSettings: MacroSettings

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        currentSettings = MacroConfigManager.loadSettings(this)

        startForegroundServiceNotification()
        setupFloatingToolbar()
    }

    private fun startForegroundServiceNotification() {
        val channelId = "overlay_macro_channel"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Overlay Macro Service",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }

        val notification: Notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("Overlay Macro 활성화됨")
            .setContentText("클릭 주기: ${currentSettings.clickIntervalMs}ms")
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
        setupToolbarListeners()
    }

    private fun setupToolbarListeners() {
        val btnDrag = floatingView.findViewById<View>(R.id.btn_drag)
        val btnPlay = floatingView.findViewById<ImageButton>(R.id.btn_play_pause)
        val btnAddTarget = floatingView.findViewById<ImageButton>(R.id.btn_add_target)
        val btnSettings = floatingView.findViewById<ImageButton>(R.id.btn_settings)
        val btnClear = floatingView.findViewById<ImageButton>(R.id.btn_clear_targets)
        val btnClose = floatingView.findViewById<ImageButton>(R.id.btn_close)

        // 1. 툴바 위치 드래그 이동
        var initialX = 0
        var initialY = 0
        var initialTouchX = 0f
        var initialTouchY = 0f

        btnDrag.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = floatingParams.x
                    initialY = floatingParams.y
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    floatingParams.x = initialX + (event.rawX - initialTouchX).toInt()
                    floatingParams.y = initialY + (event.rawY - initialTouchY).toInt()
                    windowManager.updateViewLayout(floatingView, floatingParams)
                    true
                }
                else -> false
            }
        }

        // 2. 타깃 핀 추가 (+)
        btnAddTarget.setOnClickListener {
            if (isPlaying) {
                Toast.makeText(this, "실행 중에는 핀을 추가할 수 없습니다. 일시정지 후 추가하세요.", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            addTargetPin()
        }

        // 3. 플로팅 간편 설정 팝업 열기 (⚙️)
        btnSettings.setOnClickListener {
            toggleFloatingSettingsDialog()
        }

        // 4. 재생 / 일시정지
        btnPlay.setOnClickListener {
            val service = MacroAccessibilityService.instance
            if (service == null) {
                Toast.makeText(this, "접근성 설정에서 [Overlay Macro]를 켜주세요! 설정으로 이동합니다.", Toast.LENGTH_LONG).show()
                val intent = Intent(android.provider.Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                startActivity(intent)
                return@setOnClickListener
            }

            if (targetPins.isEmpty()) {
                Toast.makeText(this, "먼저 [+] 버튼을 눌러 타깃 핀을 추가하세요!", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            isPlaying = !isPlaying
            if (isPlaying) {
                btnPlay.setImageResource(android.R.drawable.ic_media_pause)
                btnPlay.setBackgroundColor(0xFFD97706.toInt()) // Amber

                // [핵심 1]: 재생 시작 시 타깃 핀들을 '터치 관통(FLAG_NOT_TOUCHABLE)' 상태로 변경!
                // 이렇게 해야 접근성 서비스가 화면을 누를 때 핀이 터치를 가로채지 않고 밑에 있는 앱이 클릭됨!
                setPinsClickThrough(true)

                // 타깃 핀들의 현재 화면 실제 중심 좌표 추출
                val actions = targetPins.map { pinView ->
                    val params = pinView.tag as? WindowManager.LayoutParams
                    val location = IntArray(2)
                    pinView.getLocationOnScreen(location)

                    val rawX = if (location[0] > 0) location[0] + (pinView.width / 2f) else (params?.x ?: 200) + 70f
                    val rawY = if (location[1] > 0) location[1] + (pinView.height / 2f) else (params?.y ?: 400) + 70f

                    var centerX = rawX
                    var centerY = rawY

                    // 오토방지 난수화 적용
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
                Toast.makeText(
                    this,
                    "매크로 시작! [${actions.size}개 타깃, ${currentSettings.clickIntervalMs}ms 간격]",
                    Toast.LENGTH_SHORT
                ).show()
            } else {
                btnPlay.setImageResource(android.R.drawable.ic_media_play)
                btnPlay.setBackgroundColor(0xFF16A34A.toInt()) // Green

                // [핵심 2]: 정지 시 핀들을 다시 드래그할 수 있도록 터치 가능 상태로 복원
                setPinsClickThrough(false)

                service.stopMacro()
                Toast.makeText(this, "매크로 일시정지 (타깃 핀 드래그 가능)", Toast.LENGTH_SHORT).show()
            }
        }

        // 5. 핀 전체 삭제
        btnClear.setOnClickListener {
            if (isPlaying) {
                isPlaying = false
                btnPlay.setImageResource(android.R.drawable.ic_media_play)
                MacroAccessibilityService.instance?.stopMacro()
            }
            targetPins.forEach { pin ->
                try { windowManager.removeView(pin) } catch (_: Exception) {}
            }
            targetPins.clear()
            Toast.makeText(this, "모든 타깃 핀 삭제됨", Toast.LENGTH_SHORT).show()
        }

        // 6. 닫기
        btnClose.setOnClickListener {
            stopSelf()
        }
    }

    /**
     * 재생 중: 타깃 핀을 FLAG_NOT_TOUCHABLE로 설정하여
     * 접근성 터치 이벤트가 핀 뒤에 있는 게임/앱 화면으로 100% 관통되도록 함.
     * 정지 중: 사용자가 핀을 다시 손으로 드래그할 수 있도록 복원.
     */
    private fun setPinsClickThrough(clickThrough: Boolean) {
        targetPins.forEach { pinView ->
            val params = pinView.tag as? WindowManager.LayoutParams ?: return@forEach
            if (clickThrough) {
                params.flags = params.flags or WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE
                pinView.alpha = 0.75f // 실행 중임을 시각적으로 반투명 표시
            } else {
                params.flags = params.flags and WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE.inv()
                pinView.alpha = 1.0f
            }
            try {
                windowManager.updateViewLayout(pinView, params)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    /**
     * 화면 위에 플로팅 설정 다이얼로그 띄우기
     */
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
            Toast.makeText(this, "설정 적용됨: ${newInterval}ms 주기", Toast.LENGTH_SHORT).show()
            closeSettingsDialog()

            // 실행 중이었다면 새 주기로 재시작
            if (isPlaying) {
                isPlaying = false
                val btnPlay = floatingView.findViewById<ImageButton>(R.id.btn_play_pause)
                btnPlay.performClick()
            }
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

    /**
     * 화면에 드래그 가능한 새 타깃 핀(①, ②, ③) 추가
     */
    private fun addTargetPin() {
        val pinNumber = targetPins.size + 1
        val pinView = LayoutInflater.from(this).inflate(R.layout.layout_target_pin, null)
        val tvNumber = pinView.findViewById<TextView>(R.id.tv_pin_number)
        tvNumber.text = pinNumber.toString()

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
            x = 220 + (pinNumber * 30)
            y = 420 + (pinNumber * 30)
        }

        pinView.tag = pinParams // params를 핀 뷰에 저장하여 위치 추적

        var pinInitX = 0
        var pinInitY = 0
        var pinTouchX = 0f
        var pinTouchY = 0f

        pinView.setOnTouchListener { _, event ->
            if (isPlaying) return@setOnTouchListener false

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
        Toast.makeText(this, "타깃 핀 #$pinNumber 생성됨 (원하는 위치로 드래그하세요)", Toast.LENGTH_SHORT).show()
    }

    override fun onDestroy() {
        super.onDestroy()
        MacroAccessibilityService.instance?.stopMacro()
        closeSettingsDialog()

        targetPins.forEach { pin ->
            try { windowManager.removeView(pin) } catch (_: Exception) {}
        }
        targetPins.clear()

        if (::floatingView.isInitialized) {
            try { windowManager.removeView(floatingView) } catch (_: Exception) {}
        }
    }
}
