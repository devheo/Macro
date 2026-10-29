import React from 'react';
import { Smartphone, Code, Sparkles, BookOpen } from 'lucide-react';
import { MacroScript } from '../types/macro';
import { PRESET_SCRIPTS } from '../data/presets';

interface HeaderProps {
  currentScript: MacroScript;
  onSelectPreset: (preset: MacroScript) => void;
  onOpenCodeModal: () => void;
  onOpenAiGenerator: () => void;
  onOpenRealPhoneGuide: () => void;
  onScrollToSection: (sectionId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScript,
  onSelectPreset,
  onOpenCodeModal,
  onOpenAiGenerator,
  onOpenRealPhoneGuide,
  onScrollToSection,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-3 flex items-center justify-between gap-8 select-none">
      {/* Zone 1: Single text wordmark */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-indigo-900/40">
          <Smartphone className="w-4 h-4" />
        </div>
        <span className="text-base font-bold text-white tracking-tight whitespace-nowrap">
          Overlay Macro Studio
        </span>
      </div>

      {/* Zone 2: 4-5 single-line clean nav links / preset shortcuts */}
      <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-300">
        <div className="relative group">
          <button className="flex items-center gap-1.5 hover:text-white transition-colors py-1 whitespace-nowrap">
            <span>추천 매크로 프리셋</span>
            <span className="text-[10px] text-slate-500 font-mono">({PRESET_SCRIPTS.length})</span>
          </button>
          <div className="absolute left-0 top-full pt-1 hidden group-hover:block z-50">
            <div className="w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 space-y-1">
              {PRESET_SCRIPTS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => onSelectPreset(preset)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex flex-col ${
                    currentScript.id === preset.id
                      ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="font-semibold truncate">{preset.name}</span>
                  <span className="text-[10px] text-slate-500 line-clamp-1">{preset.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => onScrollToSection('simulator-area')}
          className="hover:text-white transition-colors whitespace-nowrap"
        >
          오버레이 시뮬레이터
        </button>

        <button
          onClick={() => onScrollToSection('editor-area')}
          className="hover:text-white transition-colors whitespace-nowrap"
        >
          시퀀스 편집기
        </button>

        <button
          onClick={onOpenAiGenerator}
          className="hover:text-purple-300 text-purple-400 transition-colors flex items-center gap-1 whitespace-nowrap"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI 자동 생성</span>
        </button>

        <button
          onClick={onOpenRealPhoneGuide}
          className="text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 whitespace-nowrap bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20"
          title="웹과 실제 스마트폰의 차이 및 실제 기기 구동 3가지 방법"
        >
          <span>📱 실제 안드로이드 폰 실행법</span>
        </button>

        <button
          onClick={onOpenCodeModal}
          className="hover:text-teal-300 text-slate-300 transition-colors flex items-center gap-1 whitespace-nowrap"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>안드로이드 소스코드</span>
        </button>
      </nav>

      {/* Zone 3: 1 Primary CTA Button */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenCodeModal}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-98 rounded-xl shadow-md shadow-indigo-950/60 transition-all flex items-center gap-2 whitespace-nowrap"
        >
          <Code className="w-3.5 h-3.5" />
          <span>안드로이드 프로젝트 (.ZIP 다운로드)</span>
        </button>
      </div>
    </header>
  );
};
