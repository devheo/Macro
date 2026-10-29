package com.example.overlaymacro

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.widget.Toast
import androidx.annotation.RequiresApi

/**
 * MacroAccessibilityService:
 * Android 7.0(API 24)+ 공식 API인 dispatchGesture()를 사용하여
 * 루팅 없이 화면의 특정 좌표를 탭하거나 스와이프를 주입합니다.
 *
 * [핵심 안정성 개선]:
 * 1. Path에 moveTo + lineTo 미세 선분을 추가하여 모든 기종(삼성 One UI, 샤오미, 픽셀)에서 터치 누락 방지
 * 2. dispatchGesture 실패/취소(onCancelled) 시에도 루프가 영구 정지(Freeze)되지 않도록 안전 복구 처리
 * 3. 클릭 시 로그 및 안전 타이머 보장
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
        Toast.makeText(this, "Overlay Macro 접근성 서비스 연결됨", Toast.LENGTH_SHORT).show()
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // UI 변경 이벤트 감지
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
     * Android 일부 기기에서 moveTo(x, y) 단독 사용 시 길이 0으로 무시되는 현상을
     * lineTo(x + 1f, y + 1f) 미세 세그먼트로 완벽 해결
     */
    @RequiresApi(Build.VERSION_CODES.N)
    fun clickAt(x: Float, y: Float, durationMs: Long = 50L, onComplete: (() -> Unit)? = null) {
        val path = Path().apply {
            moveTo(x, y)
            lineTo(x + 1f, y + 1f) // 필수: 제스처 엔진에 터치 모션 이벤트(DOWN/UP) 강제 발생
        }

        val strokeDuration = durationMs.coerceAtLeast(30L)
        val stroke = GestureDescription.StrokeDescription(path, 0, strokeDuration)
        val gesture = GestureDescription.Builder().addStroke(stroke).build()

        val dispatched = dispatchGesture(gesture, object : GestureResultCallback() {
            override fun onCompleted(gestureDescription: GestureDescription?) {
                super.onCompleted(gestureDescription)
                Log.d("MacroService", "클릭 성공: ($x, $y)")
                onComplete?.invoke()
            }

            override fun onCancelled(gestureDescription: GestureDescription?) {
                super.onCancelled(gestureDescription)
                Log.w("MacroService", "클릭 취소됨: ($x, $y) - 루프 동결 방지를 위해 다음 단계로 진행")
                // 중요: OS에 의해 취소되더라도 다음 주기로 진행하여 매크로가 멈추지 않게 보장
                onComplete?.invoke()
            }
        }, null)

        if (!dispatched) {
            Log.e("MacroService", "dispatchGesture 호출 실패 (다른 제스처 실행 중이거나 권한 문제)")
            // 즉시 반환 실패 시 500ms 후 다음 단계 진행
            handler.postDelayed({ onComplete?.invoke() }, 500L)
        }
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
        val stroke = GestureDescription.StrokeDescription(path, 0, durationMs.coerceAtLeast(100L))
        val gesture = GestureDescription.Builder().addStroke(stroke).build()

        val dispatched = dispatchGesture(gesture, object : GestureResultCallback() {
            override fun onCompleted(gestureDescription: GestureDescription?) {
                super.onCompleted(gestureDescription)
                Log.d("MacroService", "스와이프 성공: ($startX, $startY) -> ($endX, $endY)")
                onComplete?.invoke()
            }

            override fun onCancelled(gestureDescription: GestureDescription?) {
                super.onCancelled(gestureDescription)
                Log.w("MacroService", "스와이프 취소됨")
                onComplete?.invoke()
            }
        }, null)

        if (!dispatched) {
            handler.postDelayed({ onComplete?.invoke() }, 500L)
        }
    }

    /**
     * 액션 리스트 반복 실행 시작
     */
    fun startMacro(actions: List<MacroAction>) {
        if (actions.isEmpty()) {
            Toast.makeText(this, "실행할 타깃 액션이 없습니다.", Toast.LENGTH_SHORT).show()
            return
        }
        actionList = actions
        isRunning = true
        currentActionIndex = 0
        Log.d("MacroService", "매크로 루프 시작: 총 ${actions.size}개 액션")
        executeNextAction()
    }

    fun stopMacro() {
        isRunning = false
        handler.removeCallbacksAndMessages(null)
        Log.d("MacroService", "매크로 루프 정지됨")
    }

    private fun executeNextAction() {
        if (!isRunning || actionList.isEmpty()) return

        if (currentActionIndex >= actionList.size) {
            currentActionIndex = 0 // 무한 반복
        }

        val action = actionList[currentActionIndex]
        val currentStep = currentActionIndex + 1
        currentActionIndex++

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            when (action) {
                is MacroAction.Tap -> {
                    Log.d("MacroService", "[$currentStep/${actionList.size}] 타깃 클릭 실행: (${action.x}, ${action.y}), 지속: ${action.durationMs}ms, 대기: ${action.delayAfterMs}ms")
                    clickAt(action.x, action.y, action.durationMs) {
                        if (isRunning) {
                            handler.postDelayed({ executeNextAction() }, action.delayAfterMs)
                        }
                    }
                }
                is MacroAction.Swipe -> {
                    Log.d("MacroService", "[$currentStep/${actionList.size}] 스와이프 실행")
                    swipe(
                        action.startX,
                        action.startY,
                        action.endX,
                        action.endY,
                        action.durationMs
                    ) {
                        if (isRunning) {
                            handler.postDelayed({ executeNextAction() }, action.delayAfterMs)
                        }
                    }
                }
                is MacroAction.Delay -> {
                    handler.postDelayed({ executeNextAction() }, action.durationMs)
                }
            }
        }
    }
}
