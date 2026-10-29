package com.example.overlaymacro

import android.content.Context
import android.content.SharedPreferences

/**
 * MacroConfig:
 * 안드로이드 앱 내부에서 사용자가 설정한 클릭 주기, 스와이프 속도, 반복 조건,
 * 오토방지 난수화 설정을 저장하고 불러오는 설정 관리자 (SharedPreferences 기반)
 */
data class MacroSettings(
    var clickIntervalMs: Long = 3000L,        // 정해진 초마다 클릭 (기본 3초)
    var pressDurationMs: Long = 50L,          // 클릭 누름 유지 시간 (ms)
    var swipeDurationMs: Long = 320L,         // 스와이프 제스처 이동 시간 (ms)
    var isInfiniteLoop: Boolean = true,       // 무한 반복 여부
    var targetLoopCount: Int = 100,           // 횟수 지정 시 반복 횟수
    var isAntiBanEnabled: Boolean = true,     // 오토 탐지 방지 (좌표/시간 랜덤 난수화)
    var antiBanOffsetPx: Int = 8,             // 좌표 랜덤 편차 (±px)
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
