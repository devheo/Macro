import React from 'react';
import { 
  MacroScript, 
  MacroAction, 
  TapAction, 
  SwipeAction, 
  DelayAction, 
  ExecutionStats 
} from '../types/macro';
import { 
  Play, 
  Pause, 
  Square, 
  Plus, 
  MoveUpRight, 
  Clock, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  ShieldAlert, 
  Sliders, 
  RotateCcw, 
  Download, 
  Upload, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface MacroSequenceEditorProps {
  script: MacroScript;
  stats: ExecutionStats;
  onUpdateScript: (updater: (prev: MacroScript) => MacroScript) => void;
  onTogglePlay: () => void;
  onStop: () => void;
  onAddTap: () => void;
  onAddSwipe: () => void;
  onAddDelay: () => void;
  onTestSingleAction: (action: MacroAction) => void;
  onExportJson: () => void;
  onImportJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenAiGenerator: () => void;
  onOpenNewMacroWizard: () => void;
}

export const MacroSequenceEditor: React.FC<MacroSequenceEditorProps> = ({
  script,
  stats,
  onUpdateScript,
  onTogglePlay,
  onStop,
  onAddTap,
  onAddSwipe,
  onAddDelay,
  onTestSingleAction,
  onExportJson,
  onImportJson,
  onOpenAiGenerator,
  onOpenNewMacroWizard,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Update specific action
  const updateAction = (actionId: string, patch: Partial<MacroAction>) => {
    onUpdateScript((prev) => ({
      ...prev,
      actions: prev.actions.map((act) =>
        act.id === actionId ? ({ ...act, ...patch } as MacroAction) : act
      ),
      updatedAt: Date.now(),
    }));
  };

  // Remove action
  const removeAction = (actionId: string) => {
    onUpdateScript((prev) => ({
      ...prev,
      actions: prev.actions.filter((act) => act.id !== actionId),
      updatedAt: Date.now(),
    }));
  };

  // Move action order
  const moveAction = (index: number, direction: 'up' | 'down') => {
    onUpdateScript((prev) => {
      const actions = [...prev.actions];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= actions.length) return prev;
      const temp = actions[index];
      actions[index] = actions[targetIndex];
      actions[targetIndex] = temp;
      return { ...prev, actions, updatedAt: Date.now() };
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Top Header & Script Meta */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={script.name}
                onChange={(e) =>
                  onUpdateScript((prev) => ({ ...prev, name: e.target.value }))
                }
                className="text-base font-bold text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-hidden px-1 py-0.5 w-full truncate"
              />
            </div>
            <input
              type="text"
              value={script.description}
              onChange={(e) =>
                onUpdateScript((prev) => ({ ...prev, description: e.target.value }))
              }
              className="text-xs text-slate-400 bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-hidden px-1 py-0.5 w-full mt-0.5 truncate"
              placeholder="매크로 설명 입력"
            />
          </div>

          {/* Quick Actions (Create New Macro, AI Generator, JSON export/import) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onOpenNewMacroWizard}
              className="px-2.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
              title="새로운 매크로 생성 마법사 열기"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>새 매크로 생성</span>
            </button>
            <button
              onClick={onOpenAiGenerator}
              className="px-2.5 py-1.5 text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
              title="자연어로 매크로 자동 생성"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI 자동 생성</span>
            </button>
            <button
              onClick={onExportJson}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="JSON 파일로 스크립트 내보내기"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="JSON 파일 스크립트 불러오기"
            >
              <Upload className="w-4 h-4" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={onImportJson}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>

        {/* Live Execution Status Dashboard Strip */}
        <div className="grid grid-cols-4 gap-2 bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl text-xs font-mono">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">상태</span>
            <span
              className={`font-semibold tabular-nums mt-0.5 ${
                stats.status === 'running'
                  ? 'text-emerald-400 flex items-center gap-1'
                  : stats.status === 'paused'
                  ? 'text-amber-400'
                  : 'text-slate-400'
              }`}
            >
              {stats.status === 'running' ? '실행 중' : stats.status === 'paused' ? '일시정지' : '대기 중'}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">루프 횟수</span>
            <span className="font-semibold text-slate-200 tabular-nums mt-0.5">
              {stats.currentLoop} / {script.loopType === 'infinite' ? '무한' : `${script.loopCount}회`}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">클릭 / 스와이프</span>
            <span className="font-semibold text-indigo-300 tabular-nums mt-0.5">
              {stats.totalClicks}회 / {stats.totalSwipes}회
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">경과 시간</span>
            <span className="font-semibold text-slate-200 tabular-nums mt-0.5">
              {stats.elapsedSeconds}s
            </span>
          </div>
        </div>

        {/* Execution Settings Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
          {/* Loop Mode Selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">반복:</span>
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => onUpdateScript((prev) => ({ ...prev, loopType: 'infinite' }))}
                className={`px-2 py-1 rounded-md transition-colors ${
                  script.loopType === 'infinite'
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                무한 반복
              </button>
              <button
                onClick={() => onUpdateScript((prev) => ({ ...prev, loopType: 'count' }))}
                className={`px-2 py-1 rounded-md transition-colors ${
                  script.loopType === 'count'
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                횟수 지정
              </button>
            </div>

            {script.loopType === 'count' && (
              <div className="flex items-center gap-1 font-mono">
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={script.loopCount}
                  onChange={(e) =>
                    onUpdateScript((prev) => ({
                      ...prev,
                      loopCount: Math.max(1, parseInt(e.target.value) || 1),
                    }))
                  }
                  className="w-16 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs tabular-nums text-center"
                />
                <span className="text-slate-400">회</span>
              </div>
            )}
          </div>

          {/* Loop Interval (사이클 대기) */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">사이클 대기:</span>
            <input
              type="number"
              min="0"
              step="100"
              value={script.loopIntervalMs}
              onChange={(e) =>
                onUpdateScript((prev) => ({
                  ...prev,
                  loopIntervalMs: Math.max(0, parseInt(e.target.value) || 0),
                }))
              }
              className="w-20 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs font-mono tabular-nums text-center"
            />
            <span className="text-slate-400 font-mono text-[11px]">ms</span>
          </div>

          {/* Anti-Ban Randomization */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={script.antiBanEnabled}
                onChange={(e) =>
                  onUpdateScript((prev) => ({ ...prev, antiBanEnabled: e.target.checked }))
                }
                className="rounded border-slate-700 text-indigo-600 focus:ring-0 bg-slate-950"
              />
              <span className="text-slate-300 font-medium">좌표/시간 난수화 (오토방지)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Action Sequence List (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="font-semibold text-slate-300">
            실행 시퀀스 ({script.actions.length}개 액션)
          </span>
          <span className="text-[11px] font-mono">위에서 아래로 순차 실행</span>
        </div>

        {script.actions.length === 0 ? (
          <div className="py-12 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-center p-4">
            <div className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 mb-3">
              <Plus className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-slate-300">추가된 액션이 없습니다</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              하단의 버튼을 클릭하거나 폰 시뮬레이터 위의 오버레이 위젯에서 [+] 버튼을 눌러 터치 타깃을 배치하세요.
            </p>
          </div>
        ) : (
          script.actions.map((action, index) => {
            const isCurrentlyActive =
              stats.status === 'running' && stats.currentActionIndex === index;

            return (
              <div
                key={action.id}
                className={`p-3 rounded-xl border transition-all ${
                  isCurrentlyActive
                    ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-950/50'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Action Card Header */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px] flex items-center justify-center font-bold">
                      {index + 1}
                    </span>

                    {action.type === 'tap' && (
                      <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1">
                        클릭 (Tap)
                      </span>
                    )}
                    {action.type === 'swipe' && (
                      <span className="text-xs font-semibold text-teal-400 flex items-center gap-1">
                        제스처 스와이프 (Swipe)
                      </span>
                    )}
                    {action.type === 'delay' && (
                      <span className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                        대기 (Delay)
                      </span>
                    )}

                    <input
                      type="text"
                      value={action.name}
                      onChange={(e) => updateAction(action.id, { name: e.target.value })}
                      className="text-xs text-slate-300 bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-hidden px-1"
                    />
                  </div>

                  {/* Ordering & Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onTestSingleAction(action)}
                      className="px-2 py-0.5 text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
                      title="이 액션만 즉시 1회 테스트"
                    >
                      테스트
                    </button>
                    <button
                      onClick={() => moveAction(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveAction(index, 'down')}
                      disabled={index === script.actions.length - 1}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeAction(action.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Action Specific Parameters */}
                {action.type === 'tap' && (
                  <div className="grid grid-cols-4 gap-2 text-xs font-mono bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
                    <div>
                      <span className="text-[10px] text-slate-500 block">X 좌표 (%)</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={action.x}
                        onChange={(e) =>
                          updateAction(action.id, { x: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-white tabular-nums text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Y 좌표 (%)</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={action.y}
                        onChange={(e) =>
                          updateAction(action.id, { y: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-white tabular-nums text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">누름 지속 (ms)</span>
                      <input
                        type="number"
                        min="10"
                        step="10"
                        value={action.durationMs}
                        onChange={(e) =>
                          updateAction(action.id, { durationMs: parseInt(e.target.value) || 50 })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-white tabular-nums text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">클릭 후 대기 (ms)</span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={action.delayAfterMs}
                        onChange={(e) =>
                          updateAction(action.id, {
                            delayAfterMs: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-white tabular-nums text-xs"
                      />
                    </div>
                  </div>
                )}

                {action.type === 'swipe' && (
                  <div className="grid grid-cols-4 gap-2 text-xs font-mono bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
                    <div>
                      <span className="text-[10px] text-slate-500 block">시작 (X, Y)</span>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          value={action.startX}
                          onChange={(e) =>
                            updateAction(action.id, { startX: parseFloat(e.target.value) || 0 })
                          }
                          className="w-1/2 bg-slate-950 border border-slate-800 rounded px-1 py-0.5 text-white text-[11px] tabular-nums"
                        />
                        <input
                          type="number"
                          value={action.startY}
                          onChange={(e) =>
                            updateAction(action.id, { startY: parseFloat(e.target.value) || 0 })
                          }
                          className="w-1/2 bg-slate-950 border border-slate-800 rounded px-1 py-0.5 text-white text-[11px] tabular-nums"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">종료 (X, Y)</span>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          value={action.endX}
                          onChange={(e) =>
                            updateAction(action.id, { endX: parseFloat(e.target.value) || 0 })
                          }
                          className="w-1/2 bg-slate-950 border border-slate-800 rounded px-1 py-0.5 text-white text-[11px] tabular-nums"
                        />
                        <input
                          type="number"
                          value={action.endY}
                          onChange={(e) =>
                            updateAction(action.id, { endY: parseFloat(e.target.value) || 0 })
                          }
                          className="w-1/2 bg-slate-950 border border-slate-800 rounded px-1 py-0.5 text-white text-[11px] tabular-nums"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">스와이프 시간 (ms)</span>
                      <input
                        type="number"
                        min="50"
                        step="50"
                        value={action.durationMs}
                        onChange={(e) =>
                          updateAction(action.id, { durationMs: parseInt(e.target.value) || 300 })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-white tabular-nums text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">완료 후 대기 (ms)</span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={action.delayAfterMs}
                        onChange={(e) =>
                          updateAction(action.id, {
                            delayAfterMs: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-white tabular-nums text-xs"
                      />
                    </div>
                  </div>
                )}

                {action.type === 'delay' && (
                  <div className="flex items-center gap-3 text-xs font-mono bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
                    <span className="text-slate-400">지정 시간 동안 대기:</span>
                    <input
                      type="number"
                      min="50"
                      step="500"
                      value={action.durationMs}
                      onChange={(e) =>
                        updateAction(action.id, { durationMs: parseInt(e.target.value) || 1000 })
                      }
                      className="w-24 bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-white tabular-nums"
                    />
                    <span className="text-slate-400">ms ({(action.durationMs / 1000).toFixed(2)}초)</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Action Tool Bar */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onAddTap}
            className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>클릭 추가</span>
          </button>
          <button
            onClick={onAddSwipe}
            className="px-3 py-1.5 rounded-lg bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <MoveUpRight className="w-3.5 h-3.5" />
            <span>스와이프 추가</span>
          </button>
          <button
            onClick={onAddDelay}
            className="px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>대기 추가</span>
          </button>
        </div>

        {/* Master Play Button in Editor */}
        <div className="flex items-center gap-2">
          {stats.status !== 'idle' && (
            <button
              onClick={onStop}
              className="p-2 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
              title="정지"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          )}

          <button
            onClick={onTogglePlay}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              stats.status === 'running'
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/30'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/30'
            }`}
          >
            {stats.status === 'running' ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>매크로 일시정지</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>매크로 전체 실행</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
