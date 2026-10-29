package com.example.overlaymacro

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
 * Android 7.0(API 24)+ 공식 API인 dispatchGesture()를 사용하여
 * 루팅 없이 화면의 특정 좌표를 탭하거나 스와이프를 주입합니다.
 */
class MacroAccessibilityService : AccessibilityService() {

    private val handler = Handler(Looper.getMainLooper())
    private var isRunning = false
    private var actionList: List<MacroAction> = emptyList()
    private var currentActionIndex = 0

    companion object {
        var instance: MacroAccessibilityService? = null
            private set
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        Log.d("MacroService", "접근성 서비스 연결 성공")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // 앱 UI 변경 이벤트 감지 필요시 사용
    }

    override fun onInterrupt() {
        stopMacro()
        Log.w("MacroService", "접근성 서비스 인터럽트 발생")
    }

    override fun onDestroy() {
        super.onDestroy()
        stopMacro()
        instance = null
    }

    /**
     * (x, y) 좌표 1회 클릭 (Tap) 주입
     */
    @RequiresApi(Build.VERSION_CODES.N)
    fun clickAt(x: Float, y: Float, durationMs: Long = 50L, onComplete: (() -> Unit)? = null) {
        val path = Path().apply {
            moveTo(x, y)
        }
        val stroke = GestureDescription.StrokeDescription(path, 0, durationMs)
        val gesture = GestureDescription.Builder().addStroke(stroke).build()

        dispatchGesture(gesture, object : GestureResultCallback() {
            override fun onCompleted(gestureDescription: GestureDescription?) {
                super.onCompleted(gestureDescription)
                Log.d("MacroService", "클릭 완료: ($x, $y)")
                onComplete?.invoke()
            }

            override fun onCancelled(gestureDescription: GestureDescription?) {
                super.onCancelled(gestureDescription)
                Log.e("MacroService", "클릭 취소됨")
            }
        }, null)
    }

    /**
     * (startX, startY) -> (endX, endY) 스와이프 제스처 주입
     */
    @RequiresApi(Build.VERSION_CODES.N)
    fun swipe(
        startX: Float,
        startY: Float,
        endX: Float,
        endY: Float,
        durationMs: Long = 300L,
        onComplete: (() -> Unit)? = null
    ) {
        val path = Path().apply {
            moveTo(startX, startY)
            lineTo(endX, endY)
        }
        val stroke = GestureDescription.StrokeDescription(path, 0, durationMs)
        val gesture = GestureDescription.Builder().addStroke(stroke).build()

        dispatchGesture(gesture, object : GestureResultCallback() {
            override fun onCompleted(gestureDescription: GestureDescription?) {
                super.onCompleted(gestureDescription)
                Log.d("MacroService", "스와이프 완료: ($startX, $startY) -> ($endX, $endY)")
                onComplete?.invoke()
            }

            override fun onCancelled(gestureDescription: GestureDescription?) {
                super.onCancelled(gestureDescription)
                Log.e("MacroService", "스와이프 취소됨")
            }
        }, null)
    }

    /**
     * 액션 리스트 반복 실행 시작
     */
    fun startMacro(actions: List<MacroAction>) {
        if (actions.isEmpty()) return
        actionList = actions
        isRunning = true
        currentActionIndex = 0
        executeNextAction()
    }

    fun stopMacro() {
        isRunning = false
        handler.removeCallbacksAndMessages(null)
    }

    private fun executeNextAction() {
        if (!isRunning || actionList.isEmpty()) return

        if (currentActionIndex >= actionList.size) {
            currentActionIndex = 0 // 무한 반복
        }

        val action = actionList[currentActionIndex]
        currentActionIndex++

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            when (action) {
                is MacroAction.Tap -> {
                    clickAt(action.x, action.y, action.durationMs) {
                        handler.postDelayed({ executeNextAction() }, action.delayAfterMs)
                    }
                }
                is MacroAction.Swipe -> {
                    swipe(
                        action.startX,
                        action.startY,
                        action.endX,
                        action.endY,
                        action.durationMs
                    ) {
                        handler.postDelayed({ executeNextAction() }, action.delayAfterMs)
                    }
                }
                is MacroAction.Delay -> {
                    handler.postDelayed({ executeNextAction() }, action.durationMs)
                }
            }
        }
    }
}
