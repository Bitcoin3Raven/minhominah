# 민호민아닷컴 디자인 시스템

## 🎨 기존 디자인 요소 (Legacy HTML/CSS)

### 색상 팔레트
```css
/* 기본 색상 */
--primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
--background-color: #f8f9fa;
--text-color: #333;
--white: #ffffff;

/* 다크모드 색상 (style-improved.css) */
--dark-bg: #1a1a1a;
--dark-text: #f0f0f0;
--dark-card-bg: #2a2a2a;
```

### 타이포그래피
```css
/* 폰트 */
--font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
--line-height: 1.6;

/* 크기 */
--h1-size: 2rem;
--h2-size: 1.8rem;
--body-size: 1rem;
```

### 레이아웃
```css
/* 컨테이너 */
--max-width: 1200px;
--padding: 20px;

/* 그리드 */
--grid-gap: 20px;
--card-radius: 10px;
```

### 주요 컴포넌트 스타일

#### 1. 헤더
- 그라데이션 배경: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- 그림자: `0 2px 10px rgba(0,0,0,0.1)`
- 패딩: `20px 0`

#### 2. 메모리 카드
- 배경: 흰색 (다크모드: #2a2a2a)
- 그림자: `0 4px 6px rgba(0,0,0,0.1)`
- 호버 효과: 그림자 증가, 살짝 위로 이동
- 테두리 반경: 10px

#### 3. 버튼
- 기본: 보라색 그라데이션
- 호버: 밝기 증가
- 클릭: 살짝 눌림 효과

#### 4. 애니메이션
- AOS 애니메이션 사용 (fade-up, fade-in)
- 트랜지션: 0.3s ease

## 🔄 React 컴포넌트 마이그레이션 가이드

### 1. 글로벌 스타일 (src/styles/globals.css)
```css
/* 기존 스타일 import */
@import url('./legacy-styles.css');

/* Tailwind 확장 */
@layer base {
  :root {
    --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
}
```

### 2. 컴포넌트별 스타일 매핑

#### Header 컴포넌트
- 기존: `.header` 클래스
- React: Tailwind + 커스텀 그라데이션

#### MemoryCard 컴포넌트  
- 기존: `.memory-card` 클래스
- React: `bg-white dark:bg-gray-800 shadow-lg rounded-lg`

### 3. 디자인 토큰
```typescript
// src/constants/design-tokens.ts
export const colors = {
  primary: '#667eea',
  secondary: '#764ba2',
  background: '#f8f9fa',
  // ...
};

export const spacing = {
  container: '1200px',
  padding: '20px',
  // ...
};
```

## 📝 마이그레이션 체크리스트

- [ ] 색상 시스템 이전
- [ ] 타이포그래피 설정
- [ ] 레이아웃 구조
- [ ] 컴포넌트 스타일
- [ ] 애니메이션/트랜지션
- [ ] 반응형 디자인
- [ ] 다크모드 지원

## 🚀 구현 우선순위

1. **Phase 1**: 핵심 레이아웃과 색상
2. **Phase 2**: 컴포넌트 스타일링
3. **Phase 3**: 애니메이션과 인터랙션
4. **Phase 4**: 세부 조정 및 최적화
