# Overlay Macro - Android Studio 프로젝트

안드로이드 스마트폰에서 다른 앱(게임, 숏폼, 웹브라우저 등) 위에 항상 떠 있는 플로팅 위젯(Floating Overlay)을 띄우고, 정해진 초마다 클릭 및 스와이프 제스처를 실행하는 **네이티브 안드로이드 앱 프로젝트**입니다.

---

## 🛠️ 개발 환경 요구사항
- **Android Studio**: Iguana (2023.2.1) 또는 Hedgehog 이상 권장
- **최소 지원 OS**: Android 7.0 Nougat (API 24 이상)
- **타깃 OS**: Android 14 (API 34)
- **언어**: Kotlin 1.9+

---

## 🚀 안드로이드 스튜디오에서 열고 빌드하는 방법

### 1단계: 프로젝트 열기
1. **Android Studio** 실행
2. 메인 화면에서 **Open (열기)** 클릭
3. 이 `android-project` 폴더를 선택하고 **OK** 클릭
4. 하단에서 Gradle Sync가 완료될 때까지 잠시 대기합니다.

### 2단계: 스마트폰 연결
1. 안드로이드 스마트폰에서 **[설정] > [휴대전화 정보] > [소프트웨어 정보]**로 이동
2. **[빌드번호]**를 연속 7번 터치하여 **"개발자 모드"** 활성화
3. **[설정] > [개발자 옵션]**으로 이동하여 **[USB 디버깅]**을 켬
4. 스마트폰을 PC에 USB 케이블로 연결 (스마트폰 화면에 뜨는 '이 컴퓨터에서 항상 허용' 승인)

### 3단계: 스마트폰에 앱 설치 (Run)
1. Android Studio 상단 기기 선택 목록에서 연결된 스마트폰 모델명 확인
2. 상단의 녹색 **Run (▶)** 버튼 클릭 (또는 Shift + F10)
3. 스마트폰에 앱이 자동으로 컴파일 및 설치되고 실행됩니다!

---

## 📱 스마트폰에서 권한 허용 및 사용 방법

1. 앱이 실행되면 화면에 2가지 필수 권한 허용 버튼이 나타납니다:
   - **1단계: [다른 앱 위에 표시 허용하기]** 클릭 -> 권한 '허용'
   - **2단계: [접근성 서비스 활성화하기]** 클릭 -> 목록에서 **[Overlay Macro]** 선택 후 '사용' 활성화
2. 하단의 **[플로팅 위젯 시작하기]** 버튼 클릭
3. 앱이 닫히며 화면 위에 **[플로팅 툴바(컨트롤러)]**가 나타납니다.
4. 원하는 게임이나 앱을 실행합니다.
5. 플로팅 툴바의 **[+] 버튼**을 누르면 화면에 **타깃 핀(①, ②)**이 생성됩니다.
6. 타깃 핀을 원하는 위치로 손가락으로 드래그하여 배치합니다.
7. **[재생 ▶]** 버튼을 누르면 정해진 초마다 실제 터치가 동작합니다!

---

## 📂 핵심 소스코드 구조 설명

- `app/src/main/AndroidManifest.xml`: `SYSTEM_ALERT_WINDOW` 및 `BIND_ACCESSIBILITY_SERVICE` 시스템 권한 선언
- `app/src/main/res/xml/accessibility_service_config.xml`: 제스처 주입(`canPerformGestures="true"`) 설정
- `MacroAccessibilityService.kt`: `dispatchGesture()` API를 사용해 루팅 없이 임의의 좌표에 탭 및 스와이프를 주입하는 핵심 엔진
- `FloatingOverlayService.kt`: `WindowManager`의 `TYPE_APPLICATION_OVERLAY`를 사용해 화면 최상단에 항상 떠 있는 툴바 및 드래그 핀 구현
- `MainActivity.kt`: 사용자에게 필수 권한 2가지를 안내하고 서비스를 시작하는 진입점
