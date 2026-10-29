import React, { useState, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Plus, 
  MoveUpRight, 
  Clock, 
  Eye, 
  EyeOff, 
  GripVertical, 
  ChevronRight, 
  ChevronLeft,
  Settings2,
  Trash2
} from 'lucide-react';
import { ExecutionStats, MacroScript } from '../types/macro';

interface FloatingOverlayWidgetProps {
  stats: ExecutionStats;
  currentScript: MacroScript;
  onTogglePlay: () => void;
  onStop: () => void;
  onAddTapPoint: () => void;
  onAddSwipePath: () => void;
  onAddDelay: () => void;
  onClearTargets: () => void;
  showPins: boolean;
  onTogglePins: () => void;
  onOpenSettings: () => void;
  phoneBoundsRef: React.RefObject<HTMLDivElement | null>;
}

export const FloatingOverlayWidget: React.FC<FloatingOverlayWidgetProps> = ({
  stats,
  currentScript,
  onTogglePlay,
  onStop,
  onAddTapPoint,
  onAddSwipePath,
  onAddDelay,
  onClearTargets,
  showPins,
  onTogglePins,
  onOpenSettings,
  phoneBoundsRef,
}) => {
  // Floating widget position within phone screen (percentages or pixels)
  const [pos, setPos] = useState({ x: 12, y: 18 });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    isDraggingRef.current = true;
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: pos.x,
      startY: pos.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !phoneBoundsRef.current) return;
    const bounds = phoneBoundsRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStartRef.current.mouseX) / bounds.width) * 100;
    const deltaY = ((e.clientY - dragStartRef.current.mouseY) / bounds.height) * 100;

    setPos({
      x: Math.max(2, Math.min(85, dragStartRef.current.startX + deltaX)),
      y: Math.max(6, Math.min(85, dragStartRef.current.startY + deltaY)),
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  return (
    <div
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
      }}
      className="absolute z-40 select-none touch-none transition-shadow"
    >
      {/* Collapsed state pill */}
      {isCollapsed ? (
        <div className="flex items-center bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-full shadow-2xl p-1 text-white gap-1.5">
          <img
            src="/src/assets/images/macro_app_icon_1793242325439.jpg"
            alt="Icon"
            className="w-5 h-5 rounded-full object-cover ml-0.5 pointer-events-none"
            referrerPolicy="no-referrer"
          />
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="cursor-move p-0.5 text-slate-400 hover:text-white"
            title="위치 드래그"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>

          <button
            onClick={onTogglePlay}
            className={`p-1.5 rounded-full ${
              stats.status === 'running'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-emerald-500 text-slate-950'
            } font-bold`}
            title={stats.status === 'running' ? '일시정지' : '실행'}
          >
            {stats.status === 'running' ? (
              <Pause className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={() => setIsCollapsed(false)}
            className="p-1 text-slate-400 hover:text-white"
            title="컨트롤러 펼치기"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* Full Floating Control Bar (Overlay Bar) */
        <div className="flex flex-col bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl p-1.5 text-white w-12 gap-1.5">
          {/* Top App Icon & Drag Handle */}
          <div className="flex flex-col items-center gap-1 pt-0.5">
            <img
              src="/src/assets/images/macro_app_icon_1793242325439.jpg"
              alt="Icon"
              className="w-6 h-6 rounded-lg object-cover shadow-xs border border-cyan-500/40 pointer-events-none"
              referrerPolicy="no-referrer"
            />
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="cursor-move flex items-center justify-center py-0.5 text-slate-400 hover:text-slate-200 active:text-indigo-400"
              title="드래그하여 이동 (Overlay Drag)"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Primary Play / Pause Toggle */}
          <button
            onClick={onTogglePlay}
            className={`w-9 h-9 mx-auto rounded-xl flex items-center justify-center transition-all ${
              stats.status === 'running'
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/30'
                : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/30'
            }`}
            title={stats.status === 'running' ? '매크로 일시정지 (Pause)' : '매크로 시작 (Start)'}
          >
            {stats.status === 'running' ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          {/* Stop Button */}
          {stats.status !== 'idle' && (
            <button
              onClick={onStop}
              className="w-9 h-9 mx-auto rounded-xl flex items-center justify-center bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-all"
              title="완전 정지 (Stop)"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          )}

          <div className="w-6 h-px bg-slate-800 mx-auto my-0.5" />

          {/* Add Tap Point Button */}
          <button
            onClick={onAddTapPoint}
            className="w-9 h-9 mx-auto rounded-xl flex items-center justify-center bg-slate-800 hover:bg-indigo-600/30 text-indigo-400 hover:text-indigo-300 transition-colors"
            title="클릭 타깃 추가 (+ Target ①)"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Add Swipe Path Button */}
          <button
            onClick={onAddSwipePath}
            className="w-9 h-9 mx-auto rounded-xl flex items-center justify-center bg-slate-800 hover:bg-teal-600/30 text-teal-400 hover:text-teal-300 transition-colors"
            title="스와이프 제스처 경로 추가 (Add Swipe)"
          >
            <MoveUpRight className="w-4 h-4" />
          </button>

          {/* Add Delay / Timer */}
          <button
            onClick={onAddDelay}
            className="w-9 h-9 mx-auto rounded-xl flex items-center justify-center bg-slate-800 hover:bg-amber-600/30 text-amber-400 hover:text-amber-300 transition-colors"
            title="대기 시간 추가 (Add Delay)"
          >
            <Clock className="w-4 h-4" />
          </button>

          {/* Toggle Target Pins Visibility */}
          <button
            onClick={onTogglePins}
            className={`w-9 h-9 mx-auto rounded-xl flex items-center justify-center transition-colors ${
              showPins
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title={showPins ? '타깃 핀 숨기기' : '타깃 핀 표시'}
          >
            {showPins ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          {/* Clear targets */}
          {currentScript.actions.length > 0 && (
            <button
              onClick={onClearTargets}
              className="w-9 h-9 mx-auto rounded-xl flex items-center justify-center bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
              title="모든 타깃 지우기"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="w-6 h-px bg-slate-800 mx-auto my-0.5" />

          {/* Settings / Script Selector */}
          <button
            onClick={onOpenSettings}
            className="w-9 h-9 mx-auto rounded-xl flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="매크로 설정 및 시퀀스 열기"
          >
            <Settings2 className="w-4 h-4" />
          </button>

          {/* Collapse bar */}
          <button
            onClick={() => setIsCollapsed(true)}
            className="w-9 h-6 mx-auto rounded flex items-center justify-center text-slate-500 hover:text-slate-300"
            title="접기"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
