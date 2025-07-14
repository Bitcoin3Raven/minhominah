# 이미지 가시성 문제 해결 가이드

## 문제 설명
- **증상**: 페이지를 처음 로드할 때 이미지가 간헐적으로 표시되지 않음
- **해결**: 하드 리프레시(Ctrl+Shift+R) 시에만 이미지가 나타남
- **원인**: AOS(Animate On Scroll) 라이브러리가 애니메이션 후 opacity를 제대로 복원하지 않음

## 해결 방법

### 1. aos-safe-mode.js
- AOS 초기화 전후로 안전 장치 적용
- 주기적으로 숨겨진 요소 검사 및 수정

### 2. image-visibility-fix.js
- 이미지 강제 가시성 보장
- MutationObserver로 새로운 이미지 감시
- 수동 수정 함수 제공: `window.fixImageVisibility()`

### 3. aos-disable.css
- AOS 애니메이션 완전 비활성화
- 모든 이미지에 `opacity: 1 !important` 적용

## 테스트 방법
1. `test-image-visibility.html` 페이지 열기
2. "이미지 상태 확인" 버튼 클릭
3. 모든 이미지가 표시되는지 확인

## 적용된 파일
- `/js/aos-safe-mode.js`
- `/js/image-visibility-fix.js`
- `/css/aos-disable.css`
- `/index.html` (위 파일들 포함)
