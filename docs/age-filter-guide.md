# 나이별 필터링 기능 구현 가이드

## 📋 개요
민호민아 성장앨범에서 가장 직관적인 사용자 경험을 제공하는 **나이별 필터링** 기능 구현 완료

## ✨ 주요 특징

### 1. 하이브리드 UI 디자인
- **메인 필터**: 나이별 버튼 (0세, 1세, 2세...)
- **상세 필터**: 날짜 범위 검색 (숨김 가능)
- 성장앨범의 특성에 최적화된 UX

### 2. 생년월일 기반 자동 계산
- 아이들의 생년월일 설정 및 로컬 저장
- 추억 날짜와 생년월일을 비교하여 자동 나이 계산
- 현재 나이에 맞춰 동적으로 필터 버튼 생성

### 3. 개월별 세분화 필터
- 0세의 경우 개월별 필터 제공
  - 0-3개월
  - 4-6개월
  - 7-9개월
  - 10-12개월

## 🔧 기술 구현

### 1. UI 구조
```html
<!-- 나이별 필터 섹션 -->
<div id="ageFilterSection">
    <!-- 생년월일 미설정 시 표시 -->
    <div id="birthdateSetup" class="hidden">
        <!-- 민호, 민아 생년월일 입력 -->
    </div>
    
    <!-- 나이별 버튼 -->
    <div class="age-filter-buttons">
        <button data-age="all">전체</button>
        <button data-age="0">0세</button>
        <button data-age="1">1세</button>
        <!-- 동적 생성 -->
    </div>
    
    <!-- 상세 필터 토글 -->
    <button onclick="toggleDetailFilter()">상세 필터</button>
</div>
```

### 2. JavaScript 로직

#### 데이터 로드 (Supabase people 테이블)
```javascript
async function loadChildrenInfo() {
    const { data: people } = await supabaseClient
        .from('people')
        .select('*')
        .in('name', ['민호', '민아']);
        
    if (people) {
        people.forEach(person => {
            if (person.name === '민호') {
                childrenInfo.minho.birthdate = person.birth_date;
                childrenInfo.minho.id = person.id;
            } else if (person.name === '민아') {
                childrenInfo.mina.birthdate = person.birth_date;
                childrenInfo.mina.id = person.id;
            }
        });
    }
}
```

#### 나이 계산
```javascript
function calculateAge(birthdate, targetDate) {
    const birth = new Date(birthdate);
    const target = new Date(targetDate);
    
    let age = target.getFullYear() - birth.getFullYear();
    const monthDiff = target.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && target.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}
```

#### 필터링 로직
```javascript
// 나이별 필터링
if (ageFilter) {
    filteredMemories = filteredMemories.filter(memory => {
        const memoryDate = new Date(memory.memory_date);
        
        // 인물별 나이 계산
        let matchesAge = false;
        
        if (hasMinho && childrenInfo.minho.birthdate) {
            const minhoAge = calculateAge(childrenInfo.minho.birthdate, memoryDate);
            if (minhoAge === ageFilter.age) matchesAge = true;
        }
        
        if (hasMina && childrenInfo.mina.birthdate) {
            const minaAge = calculateAge(childrenInfo.mina.birthdate, memoryDate);
            if (minaAge === ageFilter.age) matchesAge = true;
        }
        
        return matchesAge;
    });
}
```

### 3. 데이터 저장
- ~~생년월일은 `localStorage`에 저장~~ ❌
- **Supabase `people` 테이블의 `birth_date` 컬럼 활용** ✅
- 데이터베이스에 안전하게 저장되어 어떤 기기에서도 동기화

## 🎯 사용자 시나리오

### 시나리오 1: 첫 사용자
1. 나이별 필터 영역에 생년월일 설정 안내 표시
2. 민호, 민아 생년월일 입력 후 저장
3. 자동으로 나이별 버튼 생성 및 표시

### 시나리오 2: 나이별 추억 보기
1. "1세" 버튼 클릭
2. 해당 시기의 모든 추억만 필터링되어 표시
3. 민호 1세, 민아 1세 시기 모두 포함

### 시나리오 3: 세부 기간 보기
1. "0세" 버튼 클릭
2. 개월별 서브 필터 표시 (0-3개월, 4-6개월...)
3. 원하는 개월 범위 선택

### 시나리오 4: 특정 날짜 검색
1. "상세 필터" 버튼 클릭
2. 시작일/종료일 직접 입력
3. 특정 여행이나 이벤트 기간 검색

## 📈 개선 효과

### Before (날짜 필터만 사용)
- 아이가 2살이었던 시기를 보려면 계산기로 날짜 계산 필요
- 매번 시작일/종료일 입력하는 번거로움
- 성장 단계를 직관적으로 볼 수 없음

### After (나이별 필터 추가)
- 원클릭으로 특정 나이 시기 추억 보기
- 성장 과정을 한눈에 파악 가능
- 부모님들이 자주 찾는 "우리 아이 돌 때 사진" 쉽게 접근

## 🚀 향후 개선 계획

1. **더 세밀한 개월 필터**
   - 1-2세도 6개월 단위 필터 추가
   - 신생아 시기 주 단위 필터

2. **성장 통계 연동**
   - 나이별 사진/영상 개수 표시
   - 성장 그래프와 연동

3. **스마트 알림**
   - "작년 이맘때 민호는..." 알림
   - 성장 마일스톤 알림

## 📝 구현 완료 사항

- [x] 생년월일 설정 기능
- [x] 나이 자동 계산 로직
- [x] 나이별 필터 버튼 UI
- [x] 개월별 서브 필터 (0세)
- [x] 기존 날짜 필터와 통합
- [x] ~~로컬스토리지 데이터 저장~~ → **Supabase people 테이블 활용** ✅
- [x] 다크모드 지원

---

이 기능으로 민호민아 성장앨범이 진정한 "성장 기록" 도구로 거듭났습니다! 👶📸
