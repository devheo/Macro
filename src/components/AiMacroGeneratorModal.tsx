import React, { useState } from 'react';
import { MacroScript, MacroAction, TapAction, SwipeAction, DelayAction } from '../types/macro';
import { Sparkles, X, Wand2, Lightbulb, Check } from 'lucide-react';

interface AiMacroGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyScript: (newScript: MacroScript) => void;
}

export const AiMacroGeneratorModal: React.FC<AiMacroGeneratorModalProps> = ({
  isOpen,
  onClose,
  onApplyScript,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewActions, setPreviewActions] = useState<MacroAction[] | null>(null);

  if (!isOpen) return null;

  const quickPrompts = [
    '3초마다 화면 정중앙을 1회씩 클릭하기',
    '5초마다 아래에서 위로 스와이프하여 영상 자동 넘기기',
    '0.1초마다 하단 구매 버튼을 초고속으로 광클하기 (50회)',
    '화면 우측 하단을 2번 연타하고 2초 대기하기',
    '10초마다 오른쪽으로 드래그하여 자리비움 방지하기',
  ];

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);

    // Smart natural language parser for Korean macro descriptions
    setTimeout(() => {
      const p = prompt.toLowerCase();
      const generated: MacroAction[] = [];

      // Detect interval / seconds
      const secMatch = p.match(/(\d+(\.\d+)?)\s*초/);
      const intervalSec = secMatch ? parseFloat(secMatch[1]) : 3;
      const intervalMs = Math.round(intervalSec * 1000);

      // Detect swipe or click
      if (p.includes('스와이프') || p.includes('넘기') || p.includes('드래그') || p.includes('스크롤')) {
        // Direction
        let startX = 50;
        let startY = 75;
        let endX = 50;
        let endY = 25;

        if (p.includes('오른쪽')) {
          startX = 25;
          startY = 50;
          endX = 75;
          endY = 50;
        } else if (p.includes('왼쪽')) {
          startX = 75;
          startY = 50;
          endX = 25;
          endY = 50;
        } else if (p.includes('아래로')) {
          startX = 50;
          startY = 25;
          endX = 50;
          endY = 75;
        }

        generated.push({
          id: `ai-delay-${Date.now()}`,
          name: `${intervalSec}초 대기`,
          type: 'delay',
          enabled: true,
          durationMs: intervalMs,
        } as DelayAction);

        generated.push({
          id: `ai-swipe-${Date.now()}`,
          name: '자동 제스처 스와이프',
          type: 'swipe',
          enabled: true,
          startX,
          startY,
          endX,
          endY,
          durationMs: 300,
          delayAfterMs: 500,
          curve: 'ease-in-out',
        } as SwipeAction);
      } else if (p.includes('광클') || p.includes('초고속') || p.includes('0.1초') || p.includes('0.2초')) {
        // Rapid tap
        const clickCountMatch = p.match(/(\d+)\s*회/);
        const count = clickCountMatch ? parseInt(clickCountMatch[1]) : 20;

        for (let i = 0; i < Math.min(count, 5); i++) {
          generated.push({
            id: `ai-rapid-${Date.now()}-${i}`,
            name: `초고속 연타 #${i + 1}`,
            type: 'tap',
            enabled: true,
            x: p.includes('하단') ? 50 : 50,
            y: p.includes('하단') ? 85 : 55,
            durationMs: 30,
            delayAfterMs: 100,
            randomOffsetPx: 2,
          } as TapAction);
        }
      } else {
        // Periodic tap
        let targetX = 50;
        let targetY = 50;

        if (p.includes('우측 하단') || p.includes('오른쪽 아래')) {
          targetX = 78;
          targetY = 78;
        } else if (p.includes('상단') || p.includes('위')) {
          targetX = 50;
          targetY = 25;
        } else if (p.includes('하단') || p.includes('아래')) {
          targetX = 50;
          targetY = 85;
        } else if (p.includes('좌측') || p.includes('왼쪽')) {
          targetX = 25;
          targetY = 50;
        }

        generated.push({
          id: `ai-tap-${Date.now()}`,
          name: `${intervalSec}초 주기 클릭`,
          type: 'tap',
          enabled: true,
          x: targetX,
          y: targetY,
          durationMs: 50,
          delayAfterMs: intervalMs,
          randomOffsetPx: 5,
        } as TapAction);
      }

      setPreviewActions(generated);
      setIsGenerating(false);
    }, 400);
  };

  const handleApply = () => {
    if (!previewActions) return;
    const newScript: MacroScript = {
      id: `custom-ai-${Date.now()}`,
      name: prompt.length > 25 ? prompt.slice(0, 25) + '...' : prompt,
      description: `AI가 자연어 요청("${prompt}")으로부터 생성한 매크로`,
      category: 'custom',
      loopType: 'infinite',
      loopCount: 30,
      loopDurationSeconds: 120,
      loopIntervalMs: 500,
      speedMultiplier: 1,
      antiBanEnabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      actions: previewActions,
    };
    onApplyScript(newScript);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">AI 자연어 매크로 생성기</h3>
              <p className="text-xs text-slate-400">
                원하는 동작을 일상 한국어로 적으면 실행 시퀀스를 자동 구성합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              원하는 매크로 동작 설명
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="예: 4초마다 화면 우측 하단을 1회 클릭하고, 20초마다 위로 스와이프해줘"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          {/* Quick Examples */}
          <div>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 mb-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> 추천 프롬프트 예시
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickPrompts.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(q)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-[11px] text-slate-300 border border-slate-700/60 hover:text-white transition-colors text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Preview Generated Actions */}
          {previewActions && (
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>생성된 액션 시퀀스 ({previewActions.length}개)</span>
              </div>
              <div className="space-y-1 font-mono text-xs text-slate-300">
                {previewActions.map((act, i) => (
                  <div key={act.id} className="flex items-center justify-between bg-slate-900 px-2 py-1 rounded">
                    <span>
                      {i + 1}. {act.name} ({act.type})
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {act.type === 'tap'
                        ? `X:${(act as TapAction).x}% Y:${(act as TapAction).y}%`
                        : act.type === 'swipe'
                        ? '스와이프 경로'
                        : `${(act as DelayAction).durationMs}ms`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800"
          >
            취소
          </button>
          {previewActions ? (
            <button
              onClick={handleApply}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950"
            >
              매크로에 적용하기
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-950"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>{isGenerating ? '생성 중...' : '시퀀스 자동 생성'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
