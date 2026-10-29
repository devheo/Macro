package com.example.overlaymacro

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
