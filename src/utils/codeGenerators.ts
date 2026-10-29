import { MacroScript } from '../types/macro';

export function generateAccessibilityServiceKotlin(script: MacroScript): string {
  return `package com.example.overlaymacro

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import androidx.annotation.RequiresApi

/**
 * MacroAccessibilityService:
 * Android 7.0 (API 24) 이상에서 루팅(Rooting) 없이 앱 화면 위에 제스처(탭, 스와이프)를
 * 프로그래밍 방식으로 주입(dispatchGesture)할 수 있는 핵심 서비스입니다.
 */
class MacroAccessibilityService : AccessibilityService() {

    private val handler = Handler(Looper.getMainLooper())
    private var isRunning = false
    private var currentLoop = 0

    companion object {
        var instance: MacroAccessibilityService? = null
            private set
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        Log.d("MacroService", "접근성 서비스 연결 완료")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // 앱 UI 변경 이벤트 감지 필요시 사용
    }

    override fun onInterrupt() {
        isRunning = false
        Log.w("MacroService", "접근성 서비스 중단됨")
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
        isRunning = false
    }

    /**
     * 특정 (x, y) 좌표를 지정된 밀리초 동안 클릭(Tap)합니다.
     */
    @RequiresApi(Build.VERSION_CODES.N)
    fun clickAt(x: Float, y: Float, durationMs: Long = 50L, callback: (() -> Unit)? = null) {
        val clickPath = Path().apply {
            moveTo(x, y)
        }

        val stroke = GestureDescription.StrokeDescription(clickPath, 0, durationMs)
        val gesture = GestureDescription.Builder().addStroke(stroke).build()

        dispatchGesture(gesture, object : GestureResultCallback() {
            override fun onCompleted(gestureDescription: GestureDescription?) {
                super.onCompleted(gestureDescription)
                Log.d("MacroService", "클릭 완료: ($x, $y)")
                callback?.invoke()
            }

            override fun onCancelled(gestureDescription: GestureDescription?) {
                super.onCancelled(gestureDescription)
                Log.e("MacroService", "클릭 취소됨")
            }
        }, null)
    }

    /**
     * (startX, startY)에서 (endX, endY)로 드래그/스와이프합니다.
     */
    @RequiresApi(Build.VERSION_CODES.N)
    fun swipe(
        startX: Float,
        startY: Float,
        endX: Float,
        endY: Float,
        durationMs: Long = 300L,
        callback: (() -> Unit)? = null
    ) {
        val swipePath = Path().apply {
            moveTo(startX, startY)
            lineTo(endX, endY)
        }

        val stroke = GestureDescription.StrokeDescription(swipePath, 0, durationMs)
        val gesture = GestureDescription.Builder().addStroke(stroke).build()

        dispatchGesture(gesture, object : GestureResultCallback() {
            override fun onCompleted(gestureDescription: GestureDescription?) {
                super.onCompleted(gestureDescription)
                Log.d("MacroService", "스와이프 완료: ($startX, $startY) -> ($endX, $endY)")
                callback?.invoke()
            }

            override fun onCancelled(gestureDescription: GestureDescription?) {
                super.onCancelled(gestureDescription)
                Log.e("MacroService", "스와이프 취소됨")
            }
        }, null)
    }

    /**
     * 현재 스크립트 실행 루프 시작
     */
    fun startMacroExecution() {
        isRunning = true
        currentLoop = 0
        runNextCycle()
    }

    fun stopMacroExecution() {
        isRunning = false
        handler.removeCallbacksAndMessages(null)
    }

    private fun runNextCycle() {
        if (!isRunning) return
        
        // 현재 매크로: ${script.name}
        // 총 ${script.actions.length}개 액션 순차 실행
        executeActionList(0)
    }

    private fun executeActionList(index: Int) {
        if (!isRunning) return

        val actionsCount = ${script.actions.length}
        if (index >= actionsCount) {
            currentLoop++
            Log.d("MacroService", "루프 완료: $currentLoop회")
            ${
              script.loopType === 'infinite'
                ? `handler.postDelayed({ runNextCycle() }, ${script.loopIntervalMs}L)`
                : `if (currentLoop < ${script.loopCount}) {
                handler.postDelayed({ runNextCycle() }, ${script.loopIntervalMs}L)
            } else {
                stopMacroExecution()
            }`
            }
            return
        }

        // 각 액션 분기 처리
        when (index) {
${script.actions
  .map((action, idx) => {
    if (action.type === 'tap') {
      return `            ${idx} -> {
                // ${action.name} (화면 ${action.x}%, ${action.y}%)
                val screenWidth = resources.displayMetrics.widthPixels
                val screenHeight = resources.displayMetrics.heightPixels
                val targetX = screenWidth * (${action.x}f / 100f)
                val targetY = screenHeight * (${action.y}f / 100f)
                
                clickAt(targetX, targetY, ${action.durationMs}L) {
                    handler.postDelayed({ executeActionList(${idx + 1}) }, ${action.delayAfterMs}L)
                }
            }`;
    } else if (action.type === 'swipe') {
      return `            ${idx} -> {
                // ${action.name} (스와이프)
                val screenWidth = resources.displayMetrics.widthPixels
                val screenHeight = resources.displayMetrics.heightPixels
                val startX = screenWidth * (${action.startX}f / 100f)
                val startY = screenHeight * (${action.startY}f / 100f)
                val endX = screenWidth * (${action.endX}f / 100f)
                val endY = screenHeight * (${action.endY}f / 100f)

                swipe(startX, startY, endX, endY, ${action.durationMs}L) {
                    handler.postDelayed({ executeActionList(${idx + 1}) }, ${action.delayAfterMs}L)
                }
            }`;
    } else {
      return `            ${idx} -> {
                // ${action.name} (대기)
                handler.postDelayed({ executeActionList(${idx + 1}) }, ${action.durationMs}L)
            }`;
    }
  })
  .join('\n')}
        }
    }
}
`;
}

export function generateFloatingOverlayServiceKotlin(): string {
  return `package com.example.overlaymacro

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
import android.widget.Toast

/**
 * FloatingOverlayService:
 * 다른 앱 위에 항상 떠 있는 플로팅 위젯(컨트롤러 툴바)을 구현하는 포그라운드 서비스입니다.
 * WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY 사용
 */
class FloatingOverlayService : Service() {

    private lateinit var windowManager: WindowManager
    private lateinit var floatingView: View
    private lateinit var layoutParams: WindowManager.LayoutParams

    private var initialX = 0
    private var initialY = 0
    private var initialTouchX = 0f
    private var initialTouchY = 0f
    private var isPlaying = false

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager

        // 오버레이 뷰 인플레이트
        floatingView = LayoutInflater.from(this).inflate(R.layout.layout_floating_widget, null)

        val overlayType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        layoutParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            overlayType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = 50
            y = 200
        }

        windowManager.addView(floatingView, layoutParams)
        setupListeners()
    }

    private fun setupListeners() {
        val btnDrag = floatingView.findViewById<View>(R.id.drag_handle)
        val btnPlay = floatingView.findViewById<ImageButton>(R.id.btn_play_pause)
        val btnAddTap = floatingView.findViewById<ImageButton>(R.id.btn_add_target)
        val btnClose = floatingView.findViewById<ImageButton>(R.id.btn_close)

        // 1. 드래그 이동 터치 이벤트 리스너
        btnDrag.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = layoutParams.x
                    initialY = layoutParams.y
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    layoutParams.x = initialX + (event.rawX - initialTouchX).toInt()
                    layoutParams.y = initialY + (event.rawY - initialTouchY).toInt()
                    windowManager.updateViewLayout(floatingView, layoutParams)
                    true
                }
                else -> false
            }
        }

        // 2. 재생 / 정지 버튼
        btnPlay.setOnClickListener {
            val macroService = MacroAccessibilityService.instance
            if (macroService == null) {
                Toast.makeText(this, "접근성 권한을 먼저 허용해주세요!", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            isPlaying = !isPlaying
            if (isPlaying) {
                btnPlay.setImageResource(R.drawable.ic_pause)
                macroService.startMacroExecution()
                Toast.makeText(this, "매크로 실행 시작", Toast.LENGTH_SHORT).show()
            } else {
                btnPlay.setImageResource(R.drawable.ic_play)
                macroService.stopMacroExecution()
                Toast.makeText(this, "매크로 정지", Toast.LENGTH_SHORT).show()
            }
        }

        // 3. 타깃 추가 버튼
        btnAddTap.setOnClickListener {
            Toast.makeText(this, "화면에 타깃 핀을 추가합니다.", Toast.LENGTH_SHORT).show()
            // 타깃 핀 오버레이 뷰를 생성하여 추가
        }

        // 4. 닫기 버튼
        btnClose.setOnClickListener {
            stopSelf()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        if (::floatingView.isInitialized) {
            windowManager.removeView(floatingView)
        }
    }
}
`;
}

export function generateAndroidManifest(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.overlaymacro">

    <!-- 다른 앱 위에 그리기 권한 (플로팅 윈도우 위젯) -->
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
    <!-- 포그라운드 서비스 권한 -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Overlay Macro Studio"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.OverlayMacro">

        <!-- 메인 액티비티 (권한 요청 및 설정 화면) -->
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- 1. 제스처(클릭, 스와이프) 주입 접근성 서비스 -->
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

        <!-- 2. 플로팅 오버레이 컨트롤러 서비스 -->
        <service
            android:name=".FloatingOverlayService"
            android:enabled="true"
            android:exported="false" />

    </application>
</manifest>
`;
}

export function generateAccessibilityConfigXml(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<accessibility-service xmlns:android="http://schemas.android.com/apk/res/android"
    android:description="@string/accessibility_service_description"
    android:accessibilityEventTypes="typeAllMask"
    android:accessibilityFeedbackType="feedbackGeneric"
    android:notificationTimeout="100"
    android:canPerformGestures="true"
    android:canRetrieveWindowContent="true"
    android:accessibilityFlags="flagDefault|flagRequestFilterKeyEvents" />
`;
}

export function generateAdbShellScript(script: MacroScript): string {
  const lines: string[] = [
    '#!/bin/bash',
    '# Android ADB 매크로 자동 실행 스크립트',
    `# 매크로명: ${script.name}`,
    `# 속도 배율: ${script.speedMultiplier}x`,
    '# PC와 안드로이드 폰을 USB로 연결하고 "USB 디버깅"을 활성화한 후 실행하세요.',
    '',
    'echo "=== ADB 안드로이드 기기 확인 중 ==="',
    'adb devices',
    '',
    '# 스마트폰 화면 해상도 조회 (기본 1080x2400 기준)',
    'SCREEN_WIDTH=1080',
    'SCREEN_HEIGHT=2400',
    '',
    'echo "=== 매크로 실행 시작: [${script.name}] ==="',
    'echo "중단하려면 터미널에서 Ctrl+C 를 누르세요."',
    '',
  ];

  if (script.loopType === 'infinite') {
    lines.push('LOOP=1');
    lines.push('while true; do');
    lines.push('    echo ">> [Loop $LOOP] 사이클 시작..."');
  } else {
    lines.push(`for ((LOOP=1; LOOP<=${script.loopCount}; LOOP++)); do`);
    lines.push('    echo ">> [Loop $LOOP/${script.loopCount}] 사이클 시작..."');
  }

  script.actions.forEach((action, idx) => {
    lines.push(`    # 액션 ${idx + 1}: ${action.name}`);
    if (action.type === 'tap') {
      const tapX = Math.round((action.x / 100) * 1080);
      const tapY = Math.round((action.y / 100) * 2400);
      lines.push(`    adb shell input tap ${tapX} ${tapY}`);
      const delaySec = (action.delayAfterMs / 1000).toFixed(2);
      lines.push(`    sleep ${delaySec}`);
    } else if (action.type === 'swipe') {
      const startX = Math.round((action.startX / 100) * 1080);
      const startY = Math.round((action.startY / 100) * 2400);
      const endX = Math.round((action.endX / 100) * 1080);
      const endY = Math.round((action.endY / 100) * 2400);
      lines.push(
        `    adb shell input swipe ${startX} ${startY} ${endX} ${endY} ${action.durationMs}`
      );
      const delaySec = (action.delayAfterMs / 1000).toFixed(2);
      lines.push(`    sleep ${delaySec}`);
    } else if (action.type === 'delay') {
      const delaySec = (action.durationMs / 1000).toFixed(2);
      lines.push(`    sleep ${delaySec}`);
    }
  });

  if (script.loopIntervalMs > 0) {
    const loopIntervalSec = (script.loopIntervalMs / 1000).toFixed(2);
    lines.push(`    sleep ${loopIntervalSec}`);
  }

  if (script.loopType === 'infinite') {
    lines.push('    ((LOOP++))');
    lines.push('done');
  } else {
    lines.push('done');
    lines.push('echo "=== 매크로 실행 완료 ==="');
  }

  return lines.join('\n');
}
