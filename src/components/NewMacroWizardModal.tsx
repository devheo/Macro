import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  MousePointerClick, 
  MoveUpRight, 
  Sparkles, 
  Video, 
  FileCode, 
  Clock, 
  Check, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { MacroScript, MacroAction, TapAction, SwipeAction, DelayAction } from '../types/macro';

interface NewMacroWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateMacro: (script: MacroScript) => void;
  onStartRecordMode: () => void;
  onOpenAiGenerator: () => void;
}

export const NewMacroWizardModal: React.FC<NewMacroWizardModalProps> = ({
  isOpen,
  onClose,
  onCreateMacro,
  onStartRecordMode,
  onOpenAiGenerator,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<
    'periodic-click' | 'pattern-swipe' | 'multi-target' | 'blank'
  >('periodic-click');

  // Periodic Click Wizard Form State
  const [macroName, setMacroName] = useState('새 자동 클릭 매크로');
  const [clickIntervalSec, setClickIntervalSec] = useState('3.0');
  const [clickPosition, setClickPosition] = useState<'center' | 'bottom' | 'custom'>('center');
  const [loopType, setLoopType] = useState<'infinite' | 'count'>('infinite');
  const [loopCount, setLoopCount] = useState(50);
  const [antiBan, setAntiBan] = useState(true);

  // Pattern Swipe Wizard Form State
  const [swipeName, setSwipeName] = useState('새 패턴 제스처 매크로');
  const [swipeIntervalSec, setSwipeIntervalSec] = useState('5.0');
  const [swipeDirection, setSwipeDirection] = useState<'up' | 'down' | 'right' | 'left'>('up');

  if (!isOpen) return null;

  // Handle Quick Template Creation
  const handleCreate = () => {
    const now = Date.now();

    if (selectedTemplate === 'periodic-click') {
      const intervalMs = Math.max(50, Math.round(parseFloat(clickIntervalSec || '3.0') * 1000));
      let x = 50;
      let y = 50;

      if (clickPosition === 'bottom') {
        x = 50;
        y = 85;
      }

      const newTap: TapAction = {
        id: `tap-${now}`,
        name: `타깃 클릭 (매 ${clickIntervalSec}초)`,
        type: 'tap',
        enabled: true,
        x,
        y,
        durationMs: 50,
        delayAfterMs: intervalMs,
        randomOffsetPx: antiBan ? 5 : 0,
      };

      const newScript: MacroScript = {
        id: `macro-custom-${now}`,
        name: macroName.trim() || '새 주기적 클릭 매크로',
        description: `${clickIntervalSec}초마다 ${
          clickPosition === 'center' ? '화면 중앙' : '화면 하단'
        }을 자동 클릭하는 매크로`,
        category: 'custom',
        loopType,
        loopCount: Math.max(1, loopCount),
        loopDurationSeconds: 120,
        loopIntervalMs: 200,
        speedMultiplier: 1,
        antiBanEnabled: antiBan,
        createdAt: now,
        updatedAt: now,
        actions: [newTap],
      };

      onCreateMacro(newScript);
      onClose();
    } else if (selectedTemplate === 'pattern-swipe') {
      const intervalMs = Math.max(100, Math.round(parseFloat(swipeIntervalSec || '5.0') * 1000));

      let startX = 50,
        startY = 75,
        endX = 50,
        endY = 28;

      if (swipeDirection === 'down') {
        startX = 50;
        startY = 28;
        endX = 50;
        endY = 75;
      } else if (swipeDirection === 'right') {
        startX = 25;
        startY = 50;
        endX = 75;
        endY = 50;
      } else if (swipeDirection === 'left') {
        startX = 75;
        startY = 50;
        endX = 25;
        endY = 50;
      }

      const newDelay: DelayAction = {
        id: `delay-${now}`,
        name: `콘텐츠 대기 (${swipeIntervalSec}초)`,
        type: 'delay',
        enabled: true,
        durationMs: intervalMs,
        randomPercent: antiBan ? 10 : 0,
      };

      const newSwipe: SwipeAction = {
        id: `swipe-${now}`,
        name: `${swipeDirection.toUpperCase()} 방향 제스처 스와이프`,
        type: 'swipe',
        enabled: true,
        startX,
        startY,
        endX,
        endY,
        durationMs: 300,
        delayAfterMs: 500,
        curve: 'ease-in-out',
      };

      const newScript: MacroScript = {
        id: `macro-swipe-${now}`,
        name: swipeName.trim() || '새 패턴 스와이프 매크로',
        description: `${swipeIntervalSec}초마다 ${swipeDirection} 방향으로 스와이프하는 패턴 매크로`,
        category: 'social',
        loopType: 'infinite',
        loopCount: 50,
        loopDurationSeconds: 300,
        loopIntervalMs: 300,
        speedMultiplier: 1,
        antiBanEnabled: antiBan,
        createdAt: now,
        updatedAt: now,
        actions: [newDelay, newSwipe],
      };

      onCreateMacro(newScript);
      onClose();
    } else if (selectedTemplate === 'multi-target') {
      // 2 Target alternating taps
      const tap1: TapAction = {
        id: `tap1-${now}`,
        name: '타깃 ① 클릭',
        type: 'tap',
        enabled: true,
        x: 40,
        y: 60,
        durationMs: 50,
        delayAfterMs: 500,
      };
      const tap2: TapAction = {
        id: `tap2-${now}`,
        name: '타깃 ② 클릭',
        type: 'tap',
        enabled: true,
        x: 60,
        y: 60,
        durationMs: 50,
        delayAfterMs: 1500,
      };

      const newScript: MacroScript = {
        id: `macro-multi-${now}`,
        name: '다중 타깃 순차 클릭 매크로',
        description: '화면의 2개 이상 지점을 순서대로 클릭하는 다중 타깃 매크로',
        category: 'custom',
        loopType: 'infinite',
        loopCount: 50,
        loopDurationSeconds: 120,
        loopIntervalMs: 500,
        speedMultiplier: 1,
        antiBanEnabled: true,
        createdAt: now,
        updatedAt: now,
        actions: [tap1, tap2],
      };

      onCreateMacro(newScript);
      onClose();
    } else {
      // Blank
      const newScript: MacroScript = {
        id: `macro-blank-${now}`,
        name: '새 빈 매크로',
        description: '사용자가 직접 타깃을 추가할 수 있는 빈 매크로 스크립트',
        category: 'custom',
        loopType: 'infinite',
        loopCount: 30,
        loopDurationSeconds: 60,
        loopIntervalMs: 500,
        speedMultiplier: 1,
        antiBanEnabled: true,
        createdAt: now,
        updatedAt: now,
        actions: [],
      };

      onCreateMacro(newScript);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">새 매크로 생성하기 (Create New Macro)</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                원하는 동작(정해진 초마다 클릭, 패턴 스와이프 등)을 선택하면 바로 실행 가능한 매크로가 생성됩니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Template Selector Grid */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60">
          <span className="text-xs font-semibold text-slate-300 block mb-2">1단계: 생성할 매크로 유형 선택</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => setSelectedTemplate('periodic-click')}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all ${
                selectedTemplate === 'periodic-click'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-xs'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <MousePointerClick
                className={`w-5 h-5 ${
                  selectedTemplate === 'periodic-click' ? 'text-indigo-400' : 'text-slate-500'
                }`}
              />
              <div>
                <span className="text-xs font-bold block text-white">정해진 초마다 클릭</span>
                <span className="text-[10px] text-slate-400">주기적 1점/다점 터치</span>
              </div>
            </button>

            <button
              onClick={() => setSelectedTemplate('pattern-swipe')}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all ${
                selectedTemplate === 'pattern-swipe'
                  ? 'bg-teal-600/20 border-teal-500 text-white shadow-xs'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <MoveUpRight
                className={`w-5 h-5 ${
                  selectedTemplate === 'pattern-swipe' ? 'text-teal-400' : 'text-slate-500'
                }`}
              />
              <div>
                <span className="text-xs font-bold block text-white">시간별 패턴 제스처</span>
                <span className="text-[10px] text-slate-400">숏폼 자동 스크롤 등</span>
              </div>
            </button>

            <button
              onClick={() => setSelectedTemplate('multi-target')}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all ${
                selectedTemplate === 'multi-target'
                  ? 'bg-purple-600/20 border-purple-500 text-white shadow-xs'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Clock
                className={`w-5 h-5 ${
                  selectedTemplate === 'multi-target' ? 'text-purple-400' : 'text-slate-500'
                }`}
              />
              <div>
                <span className="text-xs font-bold block text-white">다중 타깃 순차</span>
                <span className="text-[10px] text-slate-400">①번 ➔ ②번 순차 클릭</span>
              </div>
            </button>

            <button
              onClick={() => setSelectedTemplate('blank')}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all ${
                selectedTemplate === 'blank'
                  ? 'bg-slate-800 border-slate-600 text-white shadow-xs'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <FileCode
                className={`w-5 h-5 ${
                  selectedTemplate === 'blank' ? 'text-slate-300' : 'text-slate-500'
                }`}
              />
              <div>
                <span className="text-xs font-bold block text-white">빈 매크로 생성</span>
                <span className="text-[10px] text-slate-400">직접 하나씩 추가</span>
              </div>
            </button>
          </div>
        </div>

        {/* Configuration Body based on Template */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Periodic Click Options */}
          {selectedTemplate === 'periodic-click' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">매크로 이름</label>
                <input
                  type="text"
                  value={macroName}
                  onChange={(e) => setMacroName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  클릭 실행 주기 (정해진 몇 초마다 클릭할까요?)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {['0.1', '0.5', '1.0', '2.0', '3.0', '5.0', '10.0'].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setClickIntervalSec(sec)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                        clickIntervalSec === sec
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {sec === '0.1' ? '0.1초 (광클)' : `${sec}초마다`}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">직접 입력:</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0.05"
                    value={clickIntervalSec}
                    onChange={(e) => setClickIntervalSec(e.target.value)}
                    className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono text-white text-center tabular-nums"
                  />
                  <span className="text-xs text-slate-400">초</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  클릭 위치 선택 (생성 후 폰 화면에서 언제든 드래그로 변경 가능)
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setClickPosition('center')}
                    className={`p-2.5 rounded-xl border text-left transition-colors ${
                      clickPosition === 'center'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="font-semibold block">화면 정중앙 (X:50%, Y:50%)</span>
                    <span className="text-[11px] text-slate-500">게임 몬스터 타깃 또는 화면 깨우기</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setClickPosition('bottom')}
                    className={`p-2.5 rounded-xl border text-left transition-colors ${
                      clickPosition === 'bottom'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="font-semibold block">화면 하단 버튼 (X:50%, Y:85%)</span>
                    <span className="text-[11px] text-slate-500">선착순 구매, 예매, 확인 버튼 연타</span>
                  </button>
                </div>
              </div>

              {/* Loop and Anti-ban */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1">반복 방식</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setLoopType('infinite')}
                      className={`px-3 py-1.5 rounded-lg ${
                        loopType === 'infinite'
                          ? 'bg-slate-800 text-white font-bold'
                          : 'text-slate-400 bg-slate-950'
                      }`}
                    >
                      무한 반복
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoopType('count')}
                      className={`px-3 py-1.5 rounded-lg ${
                        loopType === 'count'
                          ? 'bg-slate-800 text-white font-bold'
                          : 'text-slate-400 bg-slate-950'
                      }`}
                    >
                      횟수 지정 (50회)
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">오토 탐지 방지</span>
                  <label className="flex items-center gap-2 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={antiBan}
                      onChange={(e) => setAntiBan(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-950 text-indigo-600"
                    />
                    <span className="text-slate-300">좌표 및 시간 난수화 (Anti-Ban)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Pattern Swipe Options */}
          {selectedTemplate === 'pattern-swipe' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">매크로 이름</label>
                <input
                  type="text"
                  value={swipeName}
                  onChange={(e) => setSwipeName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  스와이프 주기 (정해진 몇 초마다 제스처를 실행할까요?)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {['3.0', '5.0', '8.0', '10.0', '15.0', '30.0'].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setSwipeIntervalSec(sec)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                        swipeIntervalSec === sec
                          ? 'bg-teal-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {sec}초마다
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  스와이프 이동 방향
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    { id: 'up', label: '위로 스와이프 (⬆)', desc: '숏폼/릴스 넘김' },
                    { id: 'down', label: '아래로 스와이프 (⬇)', desc: '피드 새로고침' },
                    { id: 'right', label: '오른쪽 이동 (➡)', desc: '페이지/방향 이동' },
                    { id: 'left', label: '왼쪽 이동 (⬅)', desc: '다음 화면 전환' },
                  ].map((dir) => (
                    <button
                      key={dir.id}
                      type="button"
                      onClick={() => setSwipeDirection(dir.id as any)}
                      className={`p-2.5 rounded-xl border text-left transition-colors ${
                        swipeDirection === dir.id
                          ? 'bg-teal-600/20 border-teal-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="font-semibold block">{dir.label}</span>
                      <span className="text-[10px] text-slate-500">{dir.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Multi-Target Description */}
          {selectedTemplate === 'multi-target' && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
              <p className="font-semibold text-white">화면에 타깃 핀 ①번과 ②번이 즉시 생성됩니다.</p>
              <p className="text-slate-400">
                생성 후 스마트폰 화면에서 핀을 손가락으로 원하는 버튼 위치로 끌어다 놓으면, 1번 클릭 후 2번을 순차적으로 반복 클릭합니다.
              </p>
            </div>
          )}

          {/* Blank Description */}
          {selectedTemplate === 'blank' && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
              <p className="font-semibold text-white">완전한 빈 캔버스 매크로를 생성합니다.</p>
              <p className="text-slate-400">
                생성 후 우측 편집기에서 [+ 클릭 추가], [+ 스와이프 추가], [+ 대기 추가] 버튼을 눌러 자유롭게 시퀀스를 조립하세요.
              </p>
            </div>
          )}

          {/* Quick Alternative Channels (Screen Record / AI Generator) */}
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="font-semibold text-white block">다른 생성 방식이 필요하신가요?</span>
              <span className="text-[11px] text-slate-400">
                화면 직접 터치 녹화 또는 자연어로 자동 생성할 수도 있습니다.
              </span>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStartRecordMode();
                }}
                className="px-2.5 py-1.5 rounded-lg bg-rose-600/20 border border-rose-500/40 text-rose-300 hover:bg-rose-600 hover:text-white transition-colors flex items-center gap-1 font-medium"
              >
                <span>● 화면 녹화</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAiGenerator();
                }}
                className="px-2.5 py-1.5 rounded-lg bg-purple-600/20 border border-purple-500/40 text-purple-300 hover:bg-purple-600 hover:text-white transition-colors flex items-center gap-1 font-medium"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI 말로 생성</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            생성 즉시 좌측 가상 폰에서 바로 실행 및 테스트됩니다.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800"
            >
              취소
            </button>
            <button
              onClick={handleCreate}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-950 transition-all"
            >
              <span>매크로 생성 완료</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
