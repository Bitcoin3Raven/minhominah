# Tailwind CSS 프로덕션 설정 가이드

## 현재 상태
- CDN 방식으로 Tailwind CSS 사용 중
- 개발 단계에서는 문제없이 작동

## 프로덕션 최적화 (선택사항)

### 방법 1: Tailwind CLI 사용
```bash
# 1. Node.js 설치 필요
# 2. 프로젝트 루트에서 실행
npm init -y
npm install -D tailwindcss

# 3. Tailwind 설정 파일 생성
npx tailwindcss init

# 4. tailwind.config.js 수정
module.exports = {
  content: ["./**/*.{php,html,js}"],
  theme: {
    extend: {},
  },
  plugins: [],
}

# 5. CSS 파일 생성
# assets/css/input.css 생성:
@tailwind base;
@tailwind components;
@tailwind utilities;

# 6. CSS 빌드
npx tailwindcss -i ./assets/css/input.css -o ./assets/css/output.css --watch
```

### 방법 2: CDN 유지하면서 커스텀 설정
```html
<script src="https://cdn.tailwindcss.com"></script>
<script>
    tailwind.config = {
        theme: {
            extend: {
                colors: {
                    'minho-pink': '#FF69B4',
                    'mina-blue': '#87CEEB',
                }
            }
        }
    }
</script>
```

### 방법 3: CDN + 커스텀 CSS
```css
/* assets/css/custom.css */
@layer utilities {
    .text-shadow {
        text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
    }
    .card-hover {
        @apply transform hover:scale-105 transition duration-300;
    }
}
```

## 권장사항
- **개발 단계**: 현재 CDN 방식 유지 (문제없음)
- **프로덕션 배포 시**: Tailwind CLI로 최적화된 CSS 생성

## 커스텀 컴포넌트 예시
현재 프로젝트에서 자주 사용하는 스타일을 컴포넌트화할 수 있습니다:

```css
/* 버튼 컴포넌트 */
.btn-primary {
    @apply bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition;
}

.btn-secondary {
    @apply bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition;
}

/* 카드 컴포넌트 */
.card {
    @apply bg-white rounded-lg shadow-md overflow-hidden;
}

.card-hover {
    @apply transform hover:scale-105 transition duration-300;
}
```
