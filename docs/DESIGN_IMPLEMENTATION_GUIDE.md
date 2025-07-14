# 민호민아닷컴 - 기존 디자인 구현 가이드

## 🎨 DESIGN_SYSTEM.md 활용 방법

### 1. 색상 시스템 적용

#### 그라데이션 배경 (헤더, 버튼)
```jsx
// 방법 1: 인라인 스타일
<div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>

// 방법 2: Tailwind 클래스
<div className="bg-gradient-legacy">

// 방법 3: useLegacyStyles 훅
const styles = useLegacyStyles();
<button className={styles.button}>
```

#### 다크모드 지원
```jsx
<div className="bg-white dark:bg-gray-800">
  <p className="text-gray-900 dark:text-gray-100">
```

### 2. 컴포넌트별 구현 예시

#### 메모리 카드 (DESIGN_SYSTEM.md 참조)
```jsx
// 기존 스타일 특징:
// - 흰색 배경 (다크모드: #2a2a2a)
// - 그림자: 0 4px 6px rgba(0,0,0,0.1)
// - 호버: 그림자 증가, 위로 이동
// - 테두리 반경: 10px

const MemoryCard = ({ memory }) => {
  const styles = useLegacyStyles();
  
  return (
    <motion.div 
      className={styles.memoryCard}
      whileHover={{ y: -5, boxShadow: '0 8px 12px rgba(0,0,0,0.15)' }}
      transition={{ duration: 0.3 }}
    >
      {/* 카드 내용 */}
    </motion.div>
  );
};
```

#### 버튼 스타일
```jsx
// 기본 버튼 (보라색 그라데이션)
<button className={styles.button}>
  클릭하세요
</button>

// 보조 버튼
<button className={styles.buttonSecondary}>
  취소
</button>
```

### 3. 레이아웃 구조

#### 컨테이너
```jsx
// 최대 너비 1200px, 패딩 20px
<div className={styles.container}>
  {/* 콘텐츠 */}
</div>
```

#### 그리드 레이아웃
```jsx
// 반응형 그리드 (모바일: 1열, 태블릿: 2열, 데스크톱: 3열)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
  {/* 그리드 아이템 */}
</div>
```

### 4. 애니메이션 효과

#### AOS 스타일 애니메이션
```jsx
// Framer Motion으로 구현
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
>
  {/* 콘텐츠 */}
</motion.div>
```

#### 호버 효과
```jsx
<motion.div
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ duration: 0.3 }}
>
  {/* 인터랙티브 요소 */}
</motion.div>
```

### 5. 타이포그래피

```jsx
// 제목
<h1 className="text-3xl md:text-4xl font-bold">
  민호민아의 성장 이야기
</h1>

// 본문
<p className="text-base leading-relaxed">
  내용...
</p>
```

## 📝 구현 체크리스트

- [ ] 헤더 그라데이션 배경
- [ ] 메모리 카드 스타일링
- [ ] 버튼 호버 효과
- [ ] 다크모드 전환
- [ ] 애니메이션 효과
- [ ] 반응형 레이아웃

## 🔧 유틸리티 함수

```jsx
// 레거시 스타일 적용 헬퍼
import { useLegacyStyles } from '../hooks/useLegacyStyles';

// 조건부 스타일
import { cn } from '../utils/cn';

const className = cn(
  styles.card,
  isActive && styles.active,
  'cursor-pointer'
);
```

## 💡 팁

1. **점진적 적용**: 한 번에 모든 스타일을 변경하지 말고, 컴포넌트별로 점진적으로 적용
2. **일관성 유지**: DESIGN_SYSTEM.md의 값을 참조하여 일관된 디자인 유지
3. **성능 고려**: 애니메이션은 필요한 곳에만 적용
4. **접근성**: 색상 대비, 키보드 네비게이션 등 고려
