# 기존 디자인 마이그레이션 가이드

## 🎨 효율적인 디자인 마이그레이션 방법

### 방법 1: 디자인 시스템 활용 (추천) ✅

이미 구축한 시스템을 활용하는 방법:

```tsx
// 컴포넌트에서 사용
import { useLegacyStyles } from '../hooks/useLegacyStyles';

const MyComponent = () => {
  const styles = useLegacyStyles();
  
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.gradientText}>제목</h2>
        <button className={styles.button.primary}>버튼</button>
      </div>
    </div>
  );
};
```

### 방법 2: 레거시 CSS 클래스 직접 사용

```tsx
// legacy-styles.css의 클래스 직접 사용
<div className="legacy-header">
  <div className="legacy-container">
    <h1 className="legacy-gradient-text">민호민아닷컴</h1>
  </div>
</div>
```

### 방법 3: Tailwind 커스텀 클래스 활용

```tsx
// tailwind.config.js에 정의된 커스텀 색상/스타일 사용
<header className="bg-primary-gradient shadow-header">
  <div className="max-w-[1200px] mx-auto px-5">
    <h1 className="text-2xl font-bold text-white">민호민아닷컴</h1>
  </div>
</header>
```

## 📋 컴포넌트별 마이그레이션 예시

### 1. 메모리 카드
```tsx
// 기존 HTML
<div class="memory-card">...</div>

// React 버전
<div className={styles.card}>...</div>
// 또는
<div className="legacy-card">...</div>
// 또는
<div className="bg-white dark:bg-background-card rounded-[10px] shadow-md hover:shadow-xl">...</div>
```

### 2. 버튼
```tsx
// 기존 HTML
<button class="btn-primary">추억 추가</button>

// React 버전
<button className={styles.button.primary}>추억 추가</button>
```

### 3. 그리드 레이아웃
```tsx
// 기존 HTML
<div class="memories-grid">...</div>

// React 버전
<div className={styles.memoryGrid}>...</div>
```

## 🔍 기존 디자인 참조 방법

### 빠른 참조:
1. **DESIGN_SYSTEM.md** 확인
2. **legacy-styles.css** 참조
3. **기존 CSS 파일**: `/css/style.css`, `/css/style-improved.css`

### 스타일 검색:
```bash
# 특정 클래스 찾기
grep -r "클래스명" ./css/
grep -r "클래스명" ./backup/
```

## 💡 추천 워크플로우

1. **새 컴포넌트 작성 시**:
   - 먼저 `useLegacyStyles` 훅 확인
   - 없으면 `DESIGN_SYSTEM.md` 참조
   - 필요시 기존 CSS 파일 직접 확인

2. **기존 페이지 마이그레이션 시**:
   - 해당 HTML 파일을 `/backup/` 또는 기존 위치에서 확인
   - 스타일 클래스를 `legacyToTailwind()` 함수로 변환
   - 또는 직접 Tailwind 클래스로 재작성

3. **디자인 토큰 추가 시**:
   - `tailwind.config.js`에 추가
   - `useLegacyStyles` 훅 업데이트
   - `DESIGN_SYSTEM.md` 문서화

## 🚀 자주 사용하는 패턴

```tsx
// 페이드인 애니메이션
<div className={styles.fadeIn}>...</div>

// 그라데이션 텍스트
<h1 className={styles.gradientText}>제목</h1>

// 호버 효과가 있는 카드
<div className={`${styles.card} group`}>
  <img className={styles.cardImage} />
</div>

// 컨테이너
<div className={styles.container}>...</div>
```

## 📌 주의사항

1. **다크모드**: 기존 디자인의 다크모드 색상도 이미 통합됨
2. **반응형**: Tailwind의 반응형 유틸리티 활용
3. **애니메이션**: AOS 대신 Framer Motion 사용 권장
4. **폰트**: 한글 폰트 우선순위 이미 설정됨

## 🔧 디버깅 팁

스타일이 제대로 적용되지 않을 때:
1. 브라우저 개발자 도구에서 적용된 클래스 확인
2. `legacy-styles.css`가 제대로 import 되었는지 확인
3. Tailwind 클래스 우선순위 문제인지 확인 (!important 사용 자제)
