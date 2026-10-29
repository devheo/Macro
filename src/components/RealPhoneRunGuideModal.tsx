import React, { useState } from 'react';
import { 
  X, 
  HelpCircle, 
  Smartphone, 
  Download, 
  Terminal, 
  Code2, 
  CheckCircle2, 
  AlertTriangle,
  PlaySquare,
  ArrowRight
} from 'lucide-react';
import { MacroScript } from '../types/macro';
import { generateAdbShellScript } from '../utils/codeGenerators';

interface RealPhoneRunGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  script: MacroScript;
  onOpenCodeModal: () => void;
}

export const RealPhoneRunGuideModal: React.FC<RealPhoneRunGuideModalProps> = ({
  isOpen,
  onClose,
  script,
  onOpenCodeModal,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'app' | 'adb' | 'apk'>('app');
  const [adbCopied, setAdbCopied] = useState(false);

  if (!isOpen) return null;

  const adbScript = generateAdbShellScript(script);

  const handleCopyAdb = () => {
    navigator.clipboard.writeText(adbScript);
    setAdbCopied(true);
    setTimeout(() => setAdbCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                "이게 웹인가요? 실제 안드로이드 폰에서 어떻게 작동하나요?"
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                웹 브라우저의 보안 한계와 실제 안드로이드 기기에서 구동하는 3가지 실전 방법
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Core Explanation Callout */}
        <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex items-start gap-3 text-xs leading-relaxed">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-slate-300">
            <strong className="text-amber-300 font-semibold">정확한 지적입니다! 지금 보고 계신 화면은 '웹(Web) 시뮬레이터'입니다.</strong>
            <p className="mt-1 text-slate-400">
              구글 안드로이드 OS의 철저한 보안 정책(샌드박스)상, <strong>인터넷 웹사이트(Chrome 브라우저)는 스마트폰 밖의 다른 앱(게임, 카톡, 은행 등)을 마음대로 클릭할 수 있는 권한이 원천 차단</strong>되어 있습니다 (만약 웹페이지가 폰 화면을 마음대로 누를 수 있다면 심각한 해킹/금융사기가 발생하기 때문입니다).
            </p>
            <p className="mt-1 text-indigo-300 font-medium">
              따라서 실제 스마트폰의 다른 앱 위에 띄워 구동하려면 아래의 <span className="underline">[3가지 실제 실행 방법]</span> 중 하나를 사용해야 합니다.
            </p>
          </div>
        </div>

        {/* Method Switcher Tabs */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-950 border-b border-slate-800 text-xs">
          <button
            onClick={() => setSelectedMethod('app')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              selectedMethod === 'app'
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>방법 1. 추천 무료 앱으로 즉시 실행 (가장 추천 / 코딩 불필요)</span>
          </button>
          <button
            onClick={() => setSelectedMethod('adb')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              selectedMethod === 'adb'
                ? 'bg-teal-600 text-white shadow-xs font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>방법 2. ADB 명령어로 직접 탭 (무설치)</span>
          </button>
          <button
            onClick={() => setSelectedMethod('apk')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              selectedMethod === 'apk'
                ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>방법 3. 내 전용 APK 앱 직접 제작</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 text-xs text-slate-300 leading-relaxed space-y-4">
          {/* Method 1: Google Play Store Auto-Clicker Apps */}
          {selectedMethod === 'app' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-emerald-200">
                <h4 className="font-bold text-sm text-white mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>스마트폰에 이미 출시된 검증된 오버레이 오토클릭 앱을 사용하세요!</span>
                </h4>
                <p className="text-xs text-emerald-300">
                  앱을 직접 코딩해 만들 필요 없이, 1분 만에 구글 플레이스토어에서 무료 앱을 받아 현재 설계한 시간과 패턴을 그대로 적용할 수 있습니다.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="font-bold text-white text-sm mb-1 flex items-center justify-between">
                    <span>1. Auto Clicker - 자동 탭 (True Developers Studio)</span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                      가장 인기 / 1억+ 다운로드
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs mb-2">
                    화면 위에 뜨는 플로팅 툴바와 타깃 핀(①, ②, ③)을 완벽히 지원하며, 정해진 초(밀리초)마다 클릭 및 스와이프를 지원합니다.
                  </p>
                  <ol className="list-decimal list-inside text-slate-300 space-y-1 text-[11px] bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                    <li>구글 플레이스토어에서 <strong>"오토클리커"</strong> 검색 후 설치</li>
                    <li>앱 실행 후 <strong>[다른 앱 위에 표시]</strong> 및 <strong>[접근성 권한]</strong> 허용</li>
                    <li><strong>[다중 타깃 모드]</strong>의 [활성화] 버튼 터치</li>
                    <li>원하는 게임이나 앱을 실행하면 화면 위에 플로팅 바가 뜸</li>
                    <li>[+] 버튼으로 타깃 핀을 추가하고, 지금 스튜디오에서 설정한 주기(예: 3초)를 입력 후 [재생 ▶] 터치!</li>
                  </ol>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="font-bold text-white text-sm mb-1 flex items-center justify-between">
                    <span>2. Macrorify 또는 Touch Macro (고급 패턴/조건부)</span>
                    <span className="text-[10px] text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800">
                      이미지 인식 & 제스처 지원
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs">
                    곡선 제스처 패턴, 이미지 인식 후 클릭 등 복잡한 조건부 매크로가 필요한 경우 가장 완성도 높은 앱입니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Method 2: ADB Shell script */}
          {selectedMethod === 'adb' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-teal-950/30 border border-teal-500/20 text-teal-200">
                <h4 className="font-bold text-sm text-white mb-1 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-teal-400" />
                  <span>ADB(Android Debug Bridge)로 폰 화면 직접 터치하기</span>
                </h4>
                <p className="text-xs text-teal-300">
                  앱을 새로 설치하지 않아도 됩니다. 스마트폰의 <strong>개발자 옵션(USB 디버깅)</strong>을 켜고 컴퓨터나 스마트폰 자체(LADB 앱)에서 터미널 명령을 보내면 실제 터치 이벤트가 발생합니다.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between font-mono text-[11px] text-slate-400">
                  <span>현재 매크로 시퀀스로 생성된 ADB 스크립트</span>
                  <button
                    onClick={handleCopyAdb}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs transition-colors"
                  >
                    {adbCopied ? '복사 완료!' : '스크립트 복사'}
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 rounded-lg text-indigo-200 font-mono text-[11px] overflow-x-auto max-h-48 border border-slate-800">
                  <code>{adbScript}</code>
                </pre>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300">
                <p className="font-semibold text-white">실행 방법:</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-400">
                  <li>스마트폰 <strong>[설정] &gt; [휴대전화 정보] &gt; [빌드번호 7번 터치]</strong>로 개발자 모드 활성화</li>
                  <li><strong>[개발자 옵션] &gt; [USB 디버깅]</strong> 켜기</li>
                  <li>PC와 스마트폰을 USB 케이블로 연결 (화면에서 '이 컴퓨터를 항상 허용' 승인)</li>
                  <li>위 스크립트를 터미널에서 실행하면 실제 폰 화면이 자동으로 탭/스와이프됩니다!</li>
                </ol>
              </div>
            </div>
          )}

          {/* Method 3: Native Kotlin APK */}
          {selectedMethod === 'apk' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-indigo-200">
                <h4 className="font-bold text-sm text-white mb-1 flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-indigo-400" />
                  <span>직접 안드로이드 앱(APK)으로 제작하여 배포하고 싶으신가요?</span>
                </h4>
                <p className="text-xs text-indigo-300">
                  본 스튜디오는 안드로이드 공식 프레임워크인 <strong>AccessibilityService</strong>와 <strong>WindowManager Overlay</strong> 소스코드를 100% 자동 생성해 드립니다.
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <p className="text-slate-300 text-xs">
                  Android Studio에서 신규 프로젝트를 만들고, 생성된 <code className="text-indigo-300">MacroAccessibilityService.kt</code>와 <code className="text-indigo-300">FloatingOverlayService.kt</code> 파일을 넣으면 나만의 독립 오토클리커 앱을 빌드할 수 있습니다.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    onOpenCodeModal();
                  }}
                  className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors"
                >
                  <span>네이티브 Kotlin 소스코드 보러 가기</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            웹 화면은 '좌표 설계 및 시뮬레이션'용이며, 실제 폰 구동은 위 3가지 경로로 동작합니다.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
