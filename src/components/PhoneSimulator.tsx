import React, { useRef, useState, useEffect } from 'react';
import { 
  MacroScript, 
  ExecutionStats, 
  TouchRipple, 
  SwipeTrail, 
  MockAppId, 
  TapAction, 
  SwipeAction 
} from '../types/macro';
import { MockApps } from './MockApps';
import { FloatingOverlayWidget } from './FloatingOverlayWidget';
import { 
  Wifi, 
  BatteryMedium, 
  Gamepad2, 
  PlaySquare, 
  ShoppingBag, 
  Crosshair,
  Volume2,
  VolumeX,
  RotateCcw
} from 'lucide-react';

interface PhoneSimulatorProps {
  script: MacroScript;
  stats: ExecutionStats;
  ripples: TouchRipple[];
  activeSwipeTrail: SwipeTrail | null;
  onTogglePlay: () => void;
  onStop: () => void;
  onAddTapPoint: () => void;
  onAddSwipePath: () => void;
  onAddDelay: () => void;
  onClearTargets: () => void;
  onOpenSettings: () => void;
  onUpdateActionCoordinates: (actionId: string, coords: { x?: number; y?: number; startX?: number; startY?: number; endX?: number; endY?: number }) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onRecordTap?: (x: number, y: number) => void;
  isRecordMode: boolean;
  onToggleRecordMode: () => void;
}

export const PhoneSimulator: React.FC<PhoneSimulatorProps> = ({
  script,
  stats,
  ripples,
  activeSwipeTrail,
  onTogglePlay,
  onStop,
  onAddTapPoint,
  onAddSwipePath,
  onAddDelay,
  onClearTargets,
  onOpenSettings,
  onUpdateActionCoordinates,
  soundEnabled,
  onToggleSound,
  onRecordTap,
  isRecordMode,
  onToggleRecordMode,
}) => {
  const phoneBoundsRef = useRef<HTMLDivElement>(null);
  const [activeApp, setActiveApp] = useState<MockAppId>('game');
  const [showPins, setShowPins] = useState(true);
  const [currentTime, setCurrentTime] = useState('12:45');

  // Dragging target pin
  const [draggingTarget, setDraggingTarget] = useState<{
    actionId: string;
    pinType: 'tap' | 'swipe-start' | 'swipe-end';
  } | null>(null);

  // Time updater for phone status bar
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Handle pointer down on a draggable pin
  const handlePinPointerDown = (
    e: React.PointerEvent,
    actionId: string,
    pinType: 'tap' | 'swipe-start' | 'swipe-end'
  ) => {
    e.stopPropagation();
    setDraggingTarget({ actionId, pinType });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Handle pointer move when dragging target pin
  const handlePinPointerMove = (e: React.PointerEvent) => {
    if (!draggingTarget || !phoneBoundsRef.current) return;
    const rect = phoneBoundsRef.current.getBoundingClientRect();
    const x = Math.max(3, Math.min(97, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(8, Math.min(94, ((e.clientY - rect.top) / rect.height) * 100));

    if (draggingTarget.pinType === 'tap') {
      onUpdateActionCoordinates(draggingTarget.actionId, { x, y });
    } else if (draggingTarget.pinType === 'swipe-start') {
      onUpdateActionCoordinates(draggingTarget.actionId, { startX: x, startY: y });
    } else if (draggingTarget.pinType === 'swipe-end') {
      onUpdateActionCoordinates(draggingTarget.actionId, { endX: x, endY: y });
    }
  };

  const handlePinPointerUp = (e: React.PointerEvent) => {
    if (draggingTarget) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setDraggingTarget(null);
    }
  };

  // Handle screen click for Record Mode
  const handleScreenClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isRecordMode || !onRecordTap || !phoneBoundsRef.current) return;
    const rect = phoneBoundsRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onRecordTap(parseFloat(x.toFixed(1)), parseFloat(y.toFixed(1)));
  };

  // Last simulated touch / swipe for mock apps
  const lastTouch = ripples.length > 0 ? {
    x: ripples[ripples.length - 1].x,
    y: ripples[ripples.length - 1].y,
    time: Date.now(),
  } : null;

  const lastSwipe = activeSwipeTrail ? {
    startX: activeSwipeTrail.startX,
    startY: activeSwipeTrail.startY,
    endX: activeSwipeTrail.endX,
    endY: activeSwipeTrail.endY,
  } : null;

  return (
    <div className="flex flex-col items-center">
      {/* Phone App Switcher & Quick Tools Bar */}
      <div className="w-full max-w-[360px] flex items-center justify-between mb-3 px-1">
        {/* App Switcher Tabs */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveApp('game')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors ${
              activeApp === 'game'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="RPG 자동 사냥 시뮬레이션"
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>게임</span>
          </button>
          <button
            onClick={() => setActiveApp('reels')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors ${
              activeApp === 'reels'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="숏폼 스와이프 시뮬레이션"
          >
            <PlaySquare className="w-3.5 h-3.5" />
            <span>숏폼</span>
          </button>
          <button
            onClick={() => setActiveApp('sale')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors ${
              activeApp === 'sale'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="선착순 광클 시뮬레이션"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>핫딜</span>
          </button>
          <button
            onClick={() => setActiveApp('canvas')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors ${
              activeApp === 'canvas'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="좌표 분석기"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>분석</span>
          </button>
        </div>

        {/* Audio & Record Mode buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleRecordMode}
            className={`px-2 py-1 text-xs font-medium rounded-lg border transition-colors ${
              isRecordMode
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
            title={isRecordMode ? '터치 기록 모드 켜짐 (화면 클릭시 타깃 자동 생성)' : '터치 기록 모드'}
          >
            {isRecordMode ? '● 기록중' : '기록'}
          </button>
          <button
            onClick={onToggleSound}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            title={soundEnabled ? '효과음 끄기' : '효과음 켜기'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Realistic Smartphone Shell */}
      <div className="relative w-[340px] h-[680px] bg-slate-950 rounded-[44px] p-3 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.1)] border-[4px] border-slate-800 ring-1 ring-white/10 select-none">
        {/* Left Side Buttons (Volume / Power) */}
        <div className="absolute -left-[7px] top-24 w-[3px] h-10 bg-slate-700 rounded-l-sm" />
        <div className="absolute -left-[7px] top-38 w-[3px] h-12 bg-slate-700 rounded-l-sm" />
        {/* Right Side Power Button */}
        <div className="absolute -right-[7px] top-28 w-[3px] h-14 bg-slate-700 rounded-r-sm" />

        {/* Smartphone Screen Viewport */}
        <div
          ref={phoneBoundsRef}
          onClick={handleScreenClick}
          onPointerMove={handlePinPointerMove}
          onPointerUp={handlePinPointerUp}
          className="relative w-full h-full bg-slate-900 rounded-[34px] overflow-hidden flex flex-col justify-between"
          style={{ cursor: isRecordMode ? 'crosshair' : 'default' }}
        >
          {/* Top Notch & Camera Punch-hole + Status Bar */}
          <div className="relative z-30 h-7 px-5 bg-black/40 backdrop-blur-xs flex items-center justify-between text-[11px] text-white/90 select-none font-mono">
            <span className="tabular-nums font-semibold">{currentTime}</span>
            {/* Front Camera Dot */}
            <div className="w-3.5 h-3.5 rounded-full bg-black border border-slate-850 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-950/80" />
            </div>
            <div className="flex items-center gap-1.5 text-white/80">
              <span className="text-[9px] font-bold tracking-tight">5G</span>
              <Wifi className="w-3 h-3" />
              <BatteryMedium className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Active Screen App Content */}
          <div className="relative flex-1 w-full overflow-hidden">
            <MockApps
              activeApp={activeApp}
              lastTouch={lastTouch}
              lastSwipe={lastSwipe}
            />

            {/* Draggable Target Pins on top of the app */}
            {showPins &&
              script.actions.map((action, idx) => {
                if (action.type === 'tap') {
                  const tapAct = action as TapAction;
                  const isCurrent = stats.status === 'running' && stats.currentActionIndex === idx;
                  return (
                    <div
                      key={tapAct.id}
                      style={{
                        left: `${tapAct.x}%`,
                        top: `${tapAct.y}%`,
                      }}
                      onPointerDown={(e) => handlePinPointerDown(e, tapAct.id, 'tap')}
                      className={`absolute z-35 -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing group transition-transform ${
                        isCurrent ? 'scale-125' : 'hover:scale-110'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs shadow-lg transition-colors ${
                          isCurrent
                            ? 'bg-rose-500 border-white text-white shadow-rose-500/80 ring-4 ring-rose-400/50 animate-pulse'
                            : 'bg-indigo-600/90 border-white text-white shadow-indigo-900/60'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-1.5 py-0.5 rounded bg-slate-950/80 text-[9px] text-white whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                        X:{tapAct.x.toFixed(0)}% Y:{tapAct.y.toFixed(0)}%
                      </div>
                    </div>
                  );
                }

                if (action.type === 'swipe') {
                  const swipeAct = action as SwipeAction;
                  const isCurrent = stats.status === 'running' && stats.currentActionIndex === idx;

                  return (
                    <React.Fragment key={swipeAct.id}>
                      {/* Swipe Vector Line */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
                        <line
                          x1={`${swipeAct.startX}%`}
                          y1={`${swipeAct.startY}%`}
                          x2={`${swipeAct.endX}%`}
                          y2={`${swipeAct.endY}%`}
                          stroke={isCurrent ? '#f43f5e' : '#14b8a6'}
                          strokeWidth="2.5"
                          strokeDasharray="4 3"
                          strokeLinecap="round"
                        />
                      </svg>

                      {/* Start Pin */}
                      <div
                        style={{
                          left: `${swipeAct.startX}%`,
                          top: `${swipeAct.startY}%`,
                        }}
                        onPointerDown={(e) => handlePinPointerDown(e, swipeAct.id, 'swipe-start')}
                        className="absolute z-35 -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing"
                        title="스와이프 시작점 드래그"
                      >
                        <div className="w-6 h-6 rounded-full bg-teal-600 border-2 border-white text-[10px] text-white font-bold flex items-center justify-center shadow-md">
                          S{idx + 1}
                        </div>
                      </div>

                      {/* End Pin with Arrow */}
                      <div
                        style={{
                          left: `${swipeAct.endX}%`,
                          top: `${swipeAct.endY}%`,
                        }}
                        onPointerDown={(e) => handlePinPointerDown(e, swipeAct.id, 'swipe-end')}
                        className="absolute z-35 -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing"
                        title="스와이프 종료점 드래그"
                      >
                        <div className="w-6 h-6 rounded-full bg-rose-600 border-2 border-white text-[10px] text-white font-bold flex items-center justify-center shadow-md">
                          E{idx + 1}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                }

                return null;
              })}

            {/* Visual Touch Ripples during macro execution */}
            {ripples.map((rip) => (
              <div
                key={rip.id}
                style={{
                  left: `${rip.x}%`,
                  top: `${rip.y}%`,
                  width: `${rip.size}px`,
                  height: `${rip.size}px`,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40 rounded-full bg-rose-500/30 border-2 border-rose-400 animate-ping duration-500"
              />
            ))}

            {/* Visual Swipe Animation Trail */}
            {activeSwipeTrail && (
              <div
                style={{
                  left: `${
                    activeSwipeTrail.startX +
                    (activeSwipeTrail.endX - activeSwipeTrail.startX) * activeSwipeTrail.progress
                  }%`,
                  top: `${
                    activeSwipeTrail.startY +
                    (activeSwipeTrail.endY - activeSwipeTrail.startY) * activeSwipeTrail.progress
                  }%`,
                }}
                className="absolute z-40 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-5 h-5 rounded-full bg-teal-400 shadow-[0_0_12px_#2dd4bf] ring-4 ring-teal-300/40"
              />
            )}

            {/* The Draggable Floating Overlay Widget on top of the App */}
            <FloatingOverlayWidget
              stats={stats}
              currentScript={script}
              onTogglePlay={onTogglePlay}
              onStop={onStop}
              onAddTapPoint={onAddTapPoint}
              onAddSwipePath={onAddSwipePath}
              onAddDelay={onAddDelay}
              onClearTargets={onClearTargets}
              showPins={showPins}
              onTogglePins={() => setShowPins((prev) => !prev)}
              onOpenSettings={onOpenSettings}
              phoneBoundsRef={phoneBoundsRef}
            />
          </div>

          {/* Bottom Android Navigation Bar (Home, Back, Recents) */}
          <div className="relative z-30 h-8 bg-black/70 backdrop-blur-xs flex items-center justify-around px-8">
            <button
              onClick={() => setActiveApp('canvas')}
              className="text-white/40 hover:text-white transition-colors"
              title="최근 앱"
            >
              <div className="w-3 h-3 border-2 border-current rounded-xs" />
            </button>
            <button
              onClick={() => setActiveApp('game')}
              className="text-white/40 hover:text-white transition-colors"
              title="홈 화면"
            >
              <div className="w-3.5 h-3.5 rounded-full border-2 border-current" />
            </button>
            <button
              onClick={() => setActiveApp('reels')}
              className="text-white/40 hover:text-white transition-colors"
              title="뒤로 가기"
            >
              <div className="w-0 h-0 border-y-[5px] border-y-transparent border-r-[8px] border-r-current" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Status / Coordinates Legend */}
      <div className="mt-3 flex items-center gap-4 text-xs text-slate-400 font-mono">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-500" />
          <span>타깃 핀 직접 드래그 이동 가능</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-teal-500" />
          <span>스와이프 경로 조정</span>
        </span>
      </div>
    </div>
  );
};
