import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MacroScript, 
  MacroAction, 
  TapAction, 
  SwipeAction, 
  DelayAction, 
  ExecutionStats, 
  TouchRipple, 
  SwipeTrail 
} from './types/macro';
import { PRESET_SCRIPTS } from './data/presets';
import { playTapSound, playSwipeSound, playSuccessSound } from './utils/audio';
import { Header } from './components/Header';
import { PhoneSimulator } from './components/PhoneSimulator';
import { MacroSequenceEditor } from './components/MacroSequenceEditor';
import { AndroidCodeModal } from './components/AndroidCodeModal';
import { AiMacroGeneratorModal } from './components/AiMacroGeneratorModal';
import { RealPhoneRunGuideModal } from './components/RealPhoneRunGuideModal';
import { 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  Terminal, 
  Smartphone, 
  Play, 
  Code, 
  Zap, 
  SlidersHorizontal,
  HelpCircle,
  AlertCircle
} from 'lucide-react';

export default function App() {
  const [currentScript, setCurrentScript] = useState<MacroScript>(PRESET_SCRIPTS[0]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isRecordMode, setIsRecordMode] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isAiGeneratorOpen, setIsAiGeneratorOpen] = useState(false);
  const [isRealPhoneGuideOpen, setIsRealPhoneGuideOpen] = useState(false);

  // Execution engine state
  const [stats, setStats] = useState<ExecutionStats>({
    status: 'idle',
    currentLoop: 0,
    totalLoops: 0,
    currentActionIndex: 0,
    totalClicks: 0,
    totalSwipes: 0,
    elapsedSeconds: 0,
    startTime: null,
  });

  const [ripples, setRipples] = useState<TouchRipple[]>([]);
  const [activeSwipeTrail, setActiveSwipeTrail] = useState<SwipeTrail | null>(null);

  // Execution loop timer references
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRunningRef = useRef(false);

  // Synchronize ref with stats
  useEffect(() => {
    isRunningRef.current = stats.status === 'running';
  }, [stats.status]);

  // Elapsed time counter
  useEffect(() => {
    if (stats.status === 'running') {
      elapsedIntervalRef.current = setInterval(() => {
        setStats((prev) => ({
          ...prev,
          elapsedSeconds: prev.elapsedSeconds + 1,
        }));
      }, 1000);
    } else {
      if (elapsedIntervalRef.current) {
        clearInterval(elapsedIntervalRef.current);
      }
    }
    return () => {
      if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current);
    };
  }, [stats.status]);

  // Stop execution helper
  const stopExecution = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    isRunningRef.current = false;
    setStats((prev) => ({
      ...prev,
      status: 'idle',
      currentActionIndex: 0,
    }));
    setActiveSwipeTrail(null);
  }, []);

  // Execute a single step in the macro sequence
  const executeStep = useCallback(
    (actionIndex: number, loopIndex: number) => {
      if (!isRunningRef.current) return;

      const actions = currentScript.actions;
      if (actions.length === 0) {
        stopExecution();
        return;
      }

      // Check if loop finished
      if (actionIndex >= actions.length) {
        const nextLoop = loopIndex + 1;
        setStats((prev) => ({ ...prev, currentLoop: nextLoop }));

        if (currentScript.loopType === 'count' && nextLoop >= currentScript.loopCount) {
          playSuccessSound(soundEnabled);
          stopExecution();
          return;
        }

        // Loop delay
        const loopDelay = Math.max(50, currentScript.loopIntervalMs / currentScript.speedMultiplier);
        timerRef.current = setTimeout(() => {
          if (isRunningRef.current) {
            executeStep(0, nextLoop);
          }
        }, loopDelay);
        return;
      }

      const action = actions[actionIndex];
      setStats((prev) => ({ ...prev, currentActionIndex: actionIndex }));

      // Process Action Type
      if (action.type === 'tap') {
        const tapAct = action as TapAction;

        // Apply anti-ban jitter if enabled
        let targetX = tapAct.x;
        let targetY = tapAct.y;
        if (currentScript.antiBanEnabled && tapAct.randomOffsetPx) {
          const jitterX = (Math.random() - 0.5) * (tapAct.randomOffsetPx / 3);
          const jitterY = (Math.random() - 0.5) * (tapAct.randomOffsetPx / 3);
          targetX = Math.max(5, Math.min(95, targetX + jitterX));
          targetY = Math.max(5, Math.min(95, targetY + jitterY));
        }

        // Trigger Ripple
        const rippleId = `rip-${Date.now()}-${Math.random()}`;
        setRipples((prev) => [
          ...prev.slice(-8),
          { id: rippleId, x: targetX, y: targetY, size: 40, type: 'tap' },
        ]);
        playTapSound(soundEnabled);

        setStats((prev) => ({ ...prev, totalClicks: prev.totalClicks + 1 }));

        setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== rippleId));
        }, 500);

        // Schedule next action
        const delay = Math.max(
          50,
          (tapAct.durationMs + tapAct.delayAfterMs) / currentScript.speedMultiplier
        );
        timerRef.current = setTimeout(() => {
          executeStep(actionIndex + 1, loopIndex);
        }, delay);
      } else if (action.type === 'swipe') {
        const swipeAct = action as SwipeAction;
        playSwipeSound(soundEnabled);
        setStats((prev) => ({ ...prev, totalSwipes: prev.totalSwipes + 1 }));

        // Animate swipe trail
        const trailDuration = Math.max(150, swipeAct.durationMs / currentScript.speedMultiplier);
        const startTime = Date.now();
        const trailId = `trail-${Date.now()}`;

        const animateSwipe = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(1, elapsed / trailDuration);

          setActiveSwipeTrail({
            id: trailId,
            startX: swipeAct.startX,
            startY: swipeAct.startY,
            endX: swipeAct.endX,
            endY: swipeAct.endY,
            durationMs: trailDuration,
            progress,
          });

          if (progress < 1 && isRunningRef.current) {
            requestAnimationFrame(animateSwipe);
          } else {
            setActiveSwipeTrail(null);
          }
        };
        requestAnimationFrame(animateSwipe);

        const totalDelay = (swipeAct.durationMs + swipeAct.delayAfterMs) / currentScript.speedMultiplier;
        timerRef.current = setTimeout(() => {
          executeStep(actionIndex + 1, loopIndex);
        }, totalDelay);
      } else if (action.type === 'delay') {
        const delayAct = action as DelayAction;
        let delayDuration = delayAct.durationMs;

        if (currentScript.antiBanEnabled && delayAct.randomPercent) {
          const factor = 1 + (Math.random() - 0.5) * (delayAct.randomPercent / 50);
          delayDuration = Math.round(delayDuration * factor);
        }

        const calculatedDelay = Math.max(50, delayDuration / currentScript.speedMultiplier);
        timerRef.current = setTimeout(() => {
          executeStep(actionIndex + 1, loopIndex);
        }, calculatedDelay);
      }
    },
    [currentScript, soundEnabled, stopExecution]
  );

  // Toggle Play / Pause
  const togglePlay = () => {
    if (stats.status === 'running') {
      if (timerRef.current) clearTimeout(timerRef.current);
      isRunningRef.current = false;
      setStats((prev) => ({ ...prev, status: 'paused' }));
    } else {
      if (currentScript.actions.length === 0) {
        alert('실행할 액션이 없습니다. 먼저 타깃을 추가해주세요!');
        return;
      }
      isRunningRef.current = true;
      setStats((prev) => ({
        ...prev,
        status: 'running',
        startTime: prev.startTime || Date.now(),
      }));
      executeStep(stats.currentActionIndex, stats.currentLoop);
    }
  };

  // Test single action directly
  const testSingleAction = (action: MacroAction) => {
    if (action.type === 'tap') {
      const tapAct = action as TapAction;
      const rippleId = `test-rip-${Date.now()}`;
      setRipples((prev) => [
        ...prev,
        { id: rippleId, x: tapAct.x, y: tapAct.y, size: 40, type: 'tap' },
      ]);
      playTapSound(soundEnabled);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== rippleId));
      }, 500);
    } else if (action.type === 'swipe') {
      const swipeAct = action as SwipeAction;
      playSwipeSound(soundEnabled);
      const startTime = Date.now();
      const trailDuration = swipeAct.durationMs;
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(1, elapsed / trailDuration);
        setActiveSwipeTrail({
          id: 'test-trail',
          startX: swipeAct.startX,
          startY: swipeAct.startY,
          endX: swipeAct.endX,
          endY: swipeAct.endY,
          durationMs: trailDuration,
          progress,
        });
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setActiveSwipeTrail(null);
        }
      };
      requestAnimationFrame(animate);
    }
  };

  // Add Tap Point Pin
  const handleAddTapPoint = () => {
    const tapCount = currentScript.actions.filter((a) => a.type === 'tap').length + 1;
    const newTap: TapAction = {
      id: `act-tap-${Date.now()}`,
      name: `클릭 타깃 핀 #${tapCount}`,
      type: 'tap',
      enabled: true,
      x: 50,
      y: 50 + (tapCount % 3) * 10,
      durationMs: 50,
      delayAfterMs: 1000,
      randomOffsetPx: 5,
    };
    setCurrentScript((prev) => ({
      ...prev,
      actions: [...prev.actions, newTap],
      updatedAt: Date.now(),
    }));
  };

  // Add Swipe Path
  const handleAddSwipePath = () => {
    const swipeCount = currentScript.actions.filter((a) => a.type === 'swipe').length + 1;
    const newSwipe: SwipeAction = {
      id: `act-swipe-${Date.now()}`,
      name: `스와이프 경로 #${swipeCount}`,
      type: 'swipe',
      enabled: true,
      startX: 50,
      startY: 75,
      endX: 50,
      endY: 30,
      durationMs: 300,
      delayAfterMs: 1000,
      curve: 'ease-in-out',
    };
    setCurrentScript((prev) => ({
      ...prev,
      actions: [...prev.actions, newSwipe],
      updatedAt: Date.now(),
    }));
  };

  // Add Delay
  const handleAddDelay = () => {
    const newDelay: DelayAction = {
      id: `act-delay-${Date.now()}`,
      name: '지정 시간 대기 (3초)',
      type: 'delay',
      enabled: true,
      durationMs: 3000,
      randomPercent: 10,
    };
    setCurrentScript((prev) => ({
      ...prev,
      actions: [...prev.actions, newDelay],
      updatedAt: Date.now(),
    }));
  };

  // Clear all targets
  const handleClearTargets = () => {
    if (confirm('현재 스크립트의 모든 액션을 초기화하시겠습니까?')) {
      stopExecution();
      setCurrentScript((prev) => ({ ...prev, actions: [] }));
    }
  };

  // Coordinate updater from dragging pins on phone
  const handleUpdateCoordinates = (
    actionId: string,
    coords: {
      x?: number;
      y?: number;
      startX?: number;
      startY?: number;
      endX?: number;
      endY?: number;
    }
  ) => {
    setCurrentScript((prev) => ({
      ...prev,
      actions: prev.actions.map((act) => {
        if (act.id !== actionId) return act;
        return { ...act, ...coords } as MacroAction;
      }),
      updatedAt: Date.now(),
    }));
  };

  // Record tap on screen
  const handleRecordTap = (x: number, y: number) => {
    const tapCount = currentScript.actions.filter((a) => a.type === 'tap').length + 1;
    const newTap: TapAction = {
      id: `record-tap-${Date.now()}`,
      name: `기록된 클릭 #${tapCount}`,
      type: 'tap',
      enabled: true,
      x,
      y,
      durationMs: 50,
      delayAfterMs: 1000,
      randomOffsetPx: 4,
    };
    setCurrentScript((prev) => ({
      ...prev,
      actions: [...prev.actions, newTap],
      updatedAt: Date.now(),
    }));
    playTapSound(soundEnabled);
  };

  // JSON Export / Import
  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(currentScript, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `macro_${currentScript.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string) as MacroScript;
        if (imported.actions && Array.isArray(imported.actions)) {
          stopExecution();
          setCurrentScript(imported);
        } else {
          alert('올바른 매크로 JSON 형식이 아닙니다.');
        }
      } catch {
        alert('JSON 파일 구문 오류가 발생했습니다.');
      }
    };
    reader.readAsText(file);
  };

  const scrollToSection = (id: string) => {
    const elem = document.getElementById(id);
    if (elem) elem.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Bar Navigation */}
      <Header
        currentScript={currentScript}
        onSelectPreset={(p) => {
          stopExecution();
          setCurrentScript(p);
        }}
        onOpenCodeModal={() => setIsCodeModalOpen(true)}
        onOpenAiGenerator={() => setIsAiGeneratorOpen(true)}
        onOpenRealPhoneGuide={() => setIsRealPhoneGuideOpen(true)}
        onScrollToSection={scrollToSection}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-6 py-6 flex flex-col gap-6">
        {/* Real Android Execution Notice Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs">
          <div className="flex items-center gap-2.5 text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              <strong>웹 시뮬레이터 안내:</strong> 브라우저(웹)는 안드로이드 보안상 다른 앱을 직접 클릭할 수 없습니다. 여기서 시각적으로 설정한 매크로를 <strong>실제 스마트폰에서 바로 실행하는 3가지 방법</strong>(무료 앱 연동 / ADB 스크립트 / APK 빌드)을 제공합니다.
            </span>
          </div>
          <button
            onClick={() => setIsRealPhoneGuideOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold whitespace-nowrap shadow-xs transition-colors shrink-0"
          >
            실제 폰 실행법 보기
          </button>
        </div>

        {/* Hero Section & Quick Preset Bar */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 shadow-xl">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>Android Floating Macro Engine & Simulator</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight text-balance">
              안드로이드 플로팅 오버레이 매크로 스튜디오
            </h1>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed text-balance">
              게임이나 쇼핑 앱 등 <strong>다른 앱 위에 항상 떠 있는 플로팅 위젯</strong>을 띄우고, 정해진 초마다 클릭하거나 정해진 시간마다 패턴 스와이프를 반복 실행할 수 있습니다.
            </p>
          </div>

          {/* Quick Preset Selector Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {PRESET_SCRIPTS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  stopExecution();
                  setCurrentScript(preset);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  currentScript.id === preset.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 hover:text-white'
                }`}
              >
                {preset.name.split(' (')[0]}
              </button>
            ))}
          </div>
        </section>

        {/* 2-Column Split: Left Simulator vs Right Sequence Editor */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Interactive Phone Simulator (5 cols) */}
          <div
            id="simulator-area"
            className="lg:col-span-5 flex flex-col items-center bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl"
          >
            <div className="w-full flex items-center justify-between mb-4 pb-2 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2 font-semibold text-white">
                <Smartphone className="w-4 h-4 text-indigo-400" />
                <span>안드로이드 가상 폰 & 오버레이 시뮬레이터</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">340x680px</span>
            </div>

            <PhoneSimulator
              script={currentScript}
              stats={stats}
              ripples={ripples}
              activeSwipeTrail={activeSwipeTrail}
              onTogglePlay={togglePlay}
              onStop={stopExecution}
              onAddTapPoint={handleAddTapPoint}
              onAddSwipePath={handleAddSwipePath}
              onAddDelay={handleAddDelay}
              onClearTargets={handleClearTargets}
              onOpenSettings={() => scrollToSection('editor-area')}
              onUpdateActionCoordinates={handleUpdateCoordinates}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled((prev) => !prev)}
              onRecordTap={handleRecordTap}
              isRecordMode={isRecordMode}
              onToggleRecordMode={() => setIsRecordMode((prev) => !prev)}
            />
          </div>

          {/* Right Column: Macro Sequence Editor (7 cols) */}
          <div id="editor-area" className="lg:col-span-7 h-[770px]">
            <MacroSequenceEditor
              script={currentScript}
              stats={stats}
              onUpdateScript={setCurrentScript}
              onTogglePlay={togglePlay}
              onStop={stopExecution}
              onAddTap={handleAddTapPoint}
              onAddSwipe={handleAddSwipePath}
              onAddDelay={handleAddDelay}
              onTestSingleAction={testSingleAction}
              onExportJson={handleExportJson}
              onImportJson={handleImportJson}
              onOpenAiGenerator={() => setIsAiGeneratorOpen(true)}
            />
          </div>
        </div>

        {/* Technical Architecture & Step Guide Section */}
        <section className="mt-4 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-400" />
                <span>실제 안드로이드 폰에서 동작하는 플로팅 매크로의 원리</span>
              </h2>
              <p className="text-xs text-slate-400">
                스마트폰에서 '다른 앱 위에 얹어서 터치'하려면 아래의 3대 핵심 Android 시스템 컴포넌트를 사용합니다.
              </p>
            </div>

            <button
              onClick={() => setIsCodeModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md transition-colors flex items-center gap-1.5"
            >
              <span>안드로이드 프로젝트 열기 (.ZIP 다운로드)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-3">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">
                  1. 플로팅 오버레이 뷰 (WindowManager)
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  <code className="text-indigo-300">SYSTEM_ALERT_WINDOW</code> 권한을 획득하여, 홈 화면이나 다른 게임이 켜져 있어도 항상 최상단 레이어에 떠 있는 플로팅 툴바 및 타깃 핀을 띄웁니다.
                </p>
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-3">
                API: TYPE_APPLICATION_OVERLAY
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-3">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">
                  2. 루팅 없는 터치 주입 (AccessibilityService)
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Android 7.0(API 24)+의 <code className="text-emerald-300">dispatchGesture()</code>를 사용합니다. 보안 샌드박스를 우회하지 않고도 공식 시스템 API를 통해 원하는 (X, Y) 좌표를 탭하거나 곡선 드래그 제스처를 주입합니다.
                </p>
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-3">
                API: GestureDescription.Builder
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-teal-600/20 text-teal-400 flex items-center justify-center mb-3">
                  <Terminal className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">
                  3. 즉시 실행용 ADB 셸 명령어
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  앱을 직접 빌드하지 않고도 PC와 USB 디버깅으로 연결한 뒤 <code className="text-teal-300">adb shell input tap X Y</code> 및 <code className="text-teal-300">input swipe</code>를 통해 똑같은 매크로를 즉시 실행할 수 있습니다.
                </p>
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-3">
                명령어: adb shell input tap / swipe
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-slate-950 border-t border-slate-800/80 py-6 px-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span>Android Overlay Macro Studio</span>
          <span aria-hidden="true">·</span>
          <span>정해진 초마다 클릭 & 패턴 제스처 자동화</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <button
            onClick={() => setIsCodeModalOpen(true)}
            className="hover:text-white transition-colors"
          >
            Kotlin 소스코드
          </button>
          <span aria-hidden="true">·</span>
          <button
            onClick={() => setIsAiGeneratorOpen(true)}
            className="hover:text-white transition-colors"
          >
            AI 매크로 생성기
          </button>
        </div>
      </footer>

      {/* Android Code & ADB Script Modal */}
      <AndroidCodeModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        script={currentScript}
      />

      {/* Real Phone Run Guide Modal */}
      <RealPhoneRunGuideModal
        isOpen={isRealPhoneGuideOpen}
        onClose={() => setIsRealPhoneGuideOpen(false)}
        script={currentScript}
        onOpenCodeModal={() => {
          setIsRealPhoneGuideOpen(false);
          setIsCodeModalOpen(true);
        }}
      />

      {/* Natural Language AI Macro Generator Modal */}
      <AiMacroGeneratorModal
        isOpen={isAiGeneratorOpen}
        onClose={() => setIsAiGeneratorOpen(false)}
        onApplyScript={(newScript) => {
          stopExecution();
          setCurrentScript(newScript);
        }}
      />
    </div>
  );
}
