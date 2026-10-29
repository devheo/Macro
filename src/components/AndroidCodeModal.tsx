import React, { useState } from 'react';
import { MacroScript } from '../types/macro';
import {
  generateAccessibilityServiceKotlin,
  generateFloatingOverlayServiceKotlin,
  generateAndroidManifest,
  generateAccessibilityConfigXml,
  generateAdbShellScript,
} from '../utils/codeGenerators';
import { downloadAndroidProjectZip } from '../utils/androidProjectZip';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  Code2, 
  Terminal, 
  Layers, 
  ShieldCheck, 
  ExternalLink,
  FolderArchive,
  FolderTree
} from 'lucide-react';

interface AndroidCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  script: MacroScript;
}

export const AndroidCodeModal: React.FC<AndroidCodeModalProps> = ({
  isOpen,
  onClose,
  script,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'settings_ui' | 'accessibility' | 'overlay' | 'manifest' | 'config' | 'adb'
  >('overview');
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  if (!isOpen) return null;

  const handleDownloadFullZip = async () => {
    setIsZipping(true);
    try {
      await downloadAndroidProjectZip(script);
    } catch (e) {
      alert('ZIP 파일 생성 중 오류가 발생했습니다.');
    } finally {
      setIsZipping(false);
    }
  };

  const getCodeForTab = () => {
    switch (activeTab) {
      case 'settings_ui':
        return `<!-- app/src/main/res/layout/activity_main.xml (앱 내 매크로 설정 화면) -->
<!-- 스마트폰 앱 안에서 클릭 주기(ms), 누름 시간, 무한반복, 오토방지 난수화를 직접 설정 -->
<ScrollView xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#0B0F19">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical"
        android:padding="20dp">

        <!-- 매크로 동작 파라미터 설정 카드 -->
        <TextView
            android:text="⚙️ 매크로 동작 설정 (Macro Settings)"
            android:textColor="#F8FAFC"
            android:textSize="15sp"
            android:textStyle="bold" />

        <!-- 1. 정해진 클릭 주기 (ms) 및 0.1s/1s/3s/5s 퀵 칩 -->
        <EditText
            android:id="@+id/et_interval_ms"
            android:hint="예: 3000 (3초마다 클릭)"
            android:inputType="number" />

        <!-- 2. 터치 누름 지속시간 (ms) -->
        <EditText
            android:id="@+id/et_duration_ms"
            android:hint="50"
            android:inputType="number" />

        <!-- 3. 반복 방식: 무한 반복 vs N회 지정 -->
        <RadioGroup android:id="@+id/rg_loop_mode">
            <RadioButton android:id="@+id/rb_infinite" android:text="무한 반복" />
            <RadioButton android:id="@+id/rb_count" android:text="횟수 지정" />
        </RadioGroup>

        <!-- 4. 오토 탐지 방지 (좌표 ±8px 난수화) -->
        <CheckBox
            android:id="@+id/cb_antiban"
            android:text="오토 탐지 방지 (좌표/시간 랜덤 편차)"
            android:checked="true" />

        <!-- 5. 시작 버튼 -->
        <Button
            android:id="@+id/btn_start_overlay"
            android:text="설정 저장 및 플로팅 오버레이 시작"
            android:backgroundTint="#16A34A" />

    </LinearLayout>
</ScrollView>`;
      case 'accessibility':
        return generateAccessibilityServiceKotlin(script);
      case 'overlay':
        return generateFloatingOverlayServiceKotlin();
      case 'manifest':
        return generateAndroidManifest();
      case 'config':
        return generateAccessibilityConfigXml();
      case 'adb':
        return generateAdbShellScript(script);
      default:
        return '';
    }
  };

  const currentCode = getCodeForTab();

  const handleCopy = () => {
    if (!currentCode) return;
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename =
      activeTab === 'adb'
        ? `adb_macro_${script.id}.sh`
        : activeTab === 'manifest'
        ? 'AndroidManifest.xml'
        : activeTab === 'config'
        ? 'accessibility_service_config.xml'
        : activeTab === 'accessibility'
        ? 'MacroAccessibilityService.kt'
        : 'FloatingOverlayService.kt';

    const blob = new Blob([currentCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl h-[85vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Modal Top Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                안드로이드 스튜디오 프로젝트 (Android Studio Project)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                다른 앱 위에 항상 떠 있는 플로팅 위젯 + 루팅 없는 접근성 제스처 매크로 전체 프로젝트
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadFullZip}
              disabled={isZipping}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/60 transition-all shrink-0"
              title="Android Studio에서 바로 열 수 있는 전체 프로젝트 압축파일 다운로드"
            >
              <FolderArchive className="w-4 h-4" />
              <span>{isZipping ? '압축 중...' : '프로젝트 전체 다운로드 (.ZIP)'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-950/70 border-b border-slate-800 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            01. 구조 및 빌드 가이드
          </button>
          <button
            onClick={() => setActiveTab('settings_ui')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
              activeTab === 'settings_ui'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>activity_main.xml (앱 내 설정 UI)</span>
          </button>
          <button
            onClick={() => setActiveTab('accessibility')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'accessibility'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            MacroAccessibilityService.kt
          </button>
          <button
            onClick={() => setActiveTab('overlay')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'overlay'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            FloatingOverlayService.kt
          </button>
          <button
            onClick={() => setActiveTab('manifest')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'manifest'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            AndroidManifest.xml
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'config'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            accessibility_config.xml
          </button>
          <button
            onClick={() => setActiveTab('adb')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'adb'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-teal-400 hover:text-teal-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>ADB 즉시 실행 스크립트 (.sh)</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'overview' ? (
            <div className="space-y-6 max-w-3xl text-sm leading-relaxed text-slate-300">
              {/* Slick App Icon Showcase Card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center gap-4">
                <div className="relative group shrink-0">
                  <img
                    src="/src/assets/images/macro_app_icon_1793242325439.jpg"
                    alt="공식 앱 아이콘"
                    className="w-20 h-20 rounded-2xl object-cover shadow-xl shadow-cyan-950/50 border border-cyan-500/30 ring-2 ring-cyan-400/20"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-[9px] font-mono text-cyan-300">
                    HD
                  </div>
                </div>

                <div className="space-y-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="font-bold text-white text-sm">✨ 공식 앱 아이콘 (Mipmap & Adaptive Icon)</span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800 font-mono">
                      적용 완료
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    다크 티타늄 메탈릭 배경에 네온 사이언 & 일렉트릭 바이올렛 터치 타깃 조준점과 펄스 링이 새겨진 고해상도 앱 아이콘입니다.
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    경로: <code className="text-indigo-300">res/mipmap-anydpi-v26/ic_launcher.xml</code> 및 <code className="text-indigo-300">mipmap-xxxhdpi/ic_launcher.png</code>
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-indigo-200">
                <h3 className="font-bold text-white text-base mb-1">
                  안드로이드에서 '앱 위에 얹어서 터치하는 매크로'의 핵심 3대 기술
                </h3>
                <p className="text-xs text-indigo-300">
                  Android 보안 정책상 일반 앱은 다른 앱 화면을 마음대로 클릭할 수 없습니다. 따라서 오토클릭 앱(Auto Clicker, Macrorify 등)은 구글이 공식 지원하는 다음 2가지 시스템 API를 결합하여 개발합니다.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold mb-2">
                    <Layers className="w-4 h-4" />
                    <span>1. SYSTEM_ALERT_WINDOW (플로팅 오버레이)</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    스마트폰의 <code className="text-indigo-300">WindowManager</code> 서비스에 <code className="text-indigo-300">TYPE_APPLICATION_OVERLAY</code> 플래그로 뷰를 등록합니다. 이를 통해 게임이나 쇼핑 앱 등 다른 앱이 포그라운드에 떠 있어도 그 위에 항상 떠 있는 재생/정지 버튼과 타깃 핀을 띄울 수 있습니다.
                  </p>
                  <p className="text-[11px] text-slate-500 mt-2 font-mono">
                    설정 &gt; 애플리케이션 &gt; 다른 앱 위에 표시 권한 허용 필요
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold mb-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span>2. AccessibilityService (접근성 제스처 주입)</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Android 7.0(Nougat / API 24) 이상에 추가된 <code className="text-emerald-300">dispatchGesture()</code> API를 활용합니다. <strong>루팅(Rooting) 없이도</strong> 화면의 임의의 (X, Y) 좌표를 탭하거나, 경로(Path)를 따라 자연스러운 드래그/스와이프를 주입할 수 있습니다.
                  </p>
                  <p className="text-[11px] text-slate-500 mt-2 font-mono">
                    설정 &gt; 접근성 &gt; 설치된 앱에서 서비스 활성화 필요
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <h4 className="font-bold text-white text-sm">개발 및 실행 단계 (Step-by-step)</h4>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-300">
                  <li><strong>Android Studio 프로젝트 생성</strong>: Empty Activity로 신규 프로젝트 생성 (최소 SDK API 24+ 권장).</li>
                  <li><strong>Manifest 등록</strong>: 상단 탭의 <code className="text-indigo-300">AndroidManifest.xml</code>과 <code className="text-indigo-300">accessibility_config.xml</code> 추가.</li>
                  <li><strong>서비스 파일 복사</strong>: <code className="text-indigo-300">MacroAccessibilityService.kt</code> 및 <code className="text-indigo-300">FloatingOverlayService.kt</code> 소스코드를 프로젝트에 복사.</li>
                  <li><strong>권한 획득 처리</strong>: 메인 액티비티에서 <em>다른 앱 위에 표시</em> 및 <em>접근성 서비스</em> 허용 유도.</li>
                  <li><strong>앱 빌드 & 실행</strong>: 스마트폰에 설치 후 오버레이 위젯을 통해 바로 매크로 구동!</li>
                </ol>
              </div>

              <div className="p-4 rounded-xl bg-teal-950/30 border border-teal-500/20 text-xs text-teal-300">
                <strong>Tip. 앱을 직접 만들지 않고 즉시 테스트하고 싶다면?</strong>
                <p className="mt-1">
                  상단의 <span className="underline font-semibold cursor-pointer" onClick={() => setActiveTab('adb')}>'ADB 즉시 실행 스크립트'</span> 탭을 클릭하세요. 스마트폰을 PC에 USB로 연결하고 터미널에서 스크립트를 실행하면 APK 개발 없이도 지금 만든 매크로가 실제 폰에서 즉시 동작합니다!
                </p>
              </div>
            </div>
          ) : (
            <div className="relative h-full flex flex-col">
              {/* Code Header Bar with Copy / Download */}
              <div className="flex items-center justify-between pb-3 text-xs text-slate-400 font-mono">
                <span>
                  {activeTab === 'adb'
                    ? '현재 구성된 매크로 시퀀스가 반영된 실행 스크립트'
                    : '안드로이드 스튜디오 프로젝트에 바로 붙여넣을 수 있는 소스코드'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-1.5 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? '복사됨!' : '코드 복사'}</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>파일 다운로드</span>
                  </button>
                </div>
              </div>

              {/* Code Box */}
              <pre className="flex-1 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-indigo-200 overflow-auto leading-relaxed select-text">
                <code>{currentCode}</code>
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
