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
import android.widget.ImageButton
import android.widget.TextView
import android.widget.Toast
import androidx.core.app.NotificationCompat

/**
 * FloatingOverlayService:
 * 다른 앱 위에 항상 떠 있는 플로팅 툴바 및 드래그 가능한 타깃 핀(①, ②, ③)을 관리합니다.
 */
class FloatingOverlayService : Service() {

    private lateinit var windowManager: WindowManager
    private lateinit var floatingView: View
    private lateinit var floatingParams: WindowManager.LayoutParams

    // 타깃 핀 관리 리스트
    private val targetPins = mutableListOf<View>()
    private var isPlaying = false

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager

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
            .setContentTitle("Overlay Macro 실행 중")
            .setContentText("다른 앱 위에서 플로팅 컨트롤러가 활성화되었습니다.")
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
            addTargetPin()
        }

        // 3. 재생 / 일시정지
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
                btnPlay.setBackgroundColor(0xFFD97706.toInt()) // Amber

                // 타깃 핀들의 현재 화면 좌표를 기반으로 액션 생성
                val actions = targetPins.map { pinView ->
                    val location = IntArray(2)
                    pinView.getLocationOnScreen(location)
                    // 핀 중심 좌표 계산
                    val centerX = location[0] + (pinView.width / 2f)
                    val centerY = location[1] + (pinView.height / 2f)
                    MacroAction.Tap(centerX, centerY, durationMs = 50L, delayAfterMs = 1500L)
                }

                service.startMacro(actions)
                Toast.makeText(this, "${actions.size}개 타깃 매크로 시작", Toast.LENGTH_SHORT).show()
            } else {
                btnPlay.setImageResource(android.R.drawable.ic_media_play)
                btnPlay.setBackgroundColor(0xFF16A34A.toInt()) // Green
                service.stopMacro()
                Toast.makeText(this, "매크로 일시정지", Toast.LENGTH_SHORT).show()
            }
        }

        // 4. 핀 전체 삭제
        btnClear.setOnClickListener {
            targetPins.forEach { pin ->
                try {
                    windowManager.removeView(pin)
                } catch (_: Exception) {}
            }
            targetPins.clear()
            isPlaying = false
            MacroAccessibilityService.instance?.stopMacro()
            btnPlay.setImageResource(android.R.drawable.ic_media_play)
            Toast.makeText(this, "모든 타깃 핀 삭제됨", Toast.LENGTH_SHORT).show()
        }

        // 5. 닫기
        btnClose.setOnClickListener {
            stopSelf()
        }
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
            x = 200 + (pinNumber * 40)
            y = 400 + (pinNumber * 40)
        }

        // 타깃 핀 터치 드래그 리스너
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
        Toast.makeText(this, "타깃 핀 #$pinNumber 추가됨 (드래그하여 원하는 위치에 놓으세요)", Toast.LENGTH_SHORT).show()
    }

    override fun onDestroy() {
        super.onDestroy()
        MacroAccessibilityService.instance?.stopMacro()

        targetPins.forEach { pin ->
            try {
                windowManager.removeView(pin)
            } catch (_: Exception) {}
        }
        targetPins.clear()

        if (::floatingView.isInitialized) {
            try {
                windowManager.removeView(floatingView)
            } catch (_: Exception) {}
        }
    }
}
