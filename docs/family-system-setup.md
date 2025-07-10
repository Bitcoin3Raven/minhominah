# Supabase 가족 계정 시스템 설정 가이드

## 📋 개요
이 가이드는 민호민아 성장앨범에 가족 계정 시스템을 설정하는 방법을 안내합니다.

## 🚀 설정 단계

### 1. Supabase 대시보드 접속
1. [app.supabase.com](https://app.supabase.com) 로그인
2. 민호민아 프로젝트 선택

### 2. SQL Editor에서 스키마 실행
1. 왼쪽 메뉴에서 **SQL Editor** 클릭
2. **New query** 버튼 클릭
3. `database-family-schema.sql` 파일의 내용을 복사하여 붙여넣기
4. **Run** 버튼 클릭하여 실행

### 3. 테이블 확인
1. 왼쪽 메뉴에서 **Table Editor** 클릭
2. 다음 테이블들이 생성되었는지 확인:
   - `family_groups`
   - `family_members`
   - `family_invitations`

### 4. RLS (Row Level Security) 확인
1. 각 테이블의 **RLS** 탭에서 정책이 활성화되었는지 확인
2. 다음 정책들이 생성되었는지 확인:
   - 가족 구성원 조회 정책
   - 부모 권한 관리 정책
   - 초대 관련 정책

### 5. Functions 확인
1. **Database** → **Functions** 메뉴에서 다음 함수들이 생성되었는지 확인:
   - `generate_invitation_code()`
   - `generate_invitation_token()`
   - `accept_family_invitation()`

### 6. Triggers 확인
1. 각 테이블의 **Triggers** 탭에서 다음 트리거들이 활성화되었는지 확인:
   - `family_groups_invitation_code` - 초대 코드 자동 생성
   - `family_groups_add_creator` - 생성자를 부모로 자동 추가
   - `family_invitations_token` - 초대 토큰 자동 생성

## 🔐 보안 설정

### 인증 이메일 템플릿 수정 (선택사항)
1. **Authentication** → **Email Templates**로 이동
2. **Invite User** 템플릿 수정:

```html
<h2>민호민아 성장앨범 가족 초대</h2>
<p>안녕하세요!</p>
<p>{{ .SenderName }}님이 민호민아 성장앨범의 가족으로 초대했습니다.</p>
<p>아래 버튼을 클릭하여 가족에 참여하세요:</p>
<a href="{{ .SiteURL }}/family-invite.html?token={{ .Token }}" 
   style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
   가족 참여하기
</a>
<p>이 초대는 7일 후에 만료됩니다.</p>
```

## 🧪 테스트 방법

### 1. 가족 생성 테스트
1. 웹사이트에서 로그인
2. 가족 설정 페이지 접속
3. "가족 만들기" 클릭
4. 가족 이름 입력 후 생성
5. Supabase 대시보드에서 `family_groups` 테이블 확인

### 2. 초대 테스트
1. 가족 설정 페이지에서 이메일 초대
2. `family_invitations` 테이블에서 초대 생성 확인
3. 토큰과 만료일이 자동 설정되었는지 확인

### 3. 권한 테스트
1. 다른 계정으로 로그인
2. 초대 코드로 가족 참여
3. 부모/가족/관람객 권한별 기능 테스트

## ⚠️ 주의사항

1. **이메일 전송 설정**
   - 현재 코드는 이메일 전송 로직이 포함되어 있지 않습니다
   - Supabase Edge Functions나 외부 이메일 서비스 연동이 필요합니다

2. **프로덕션 배포 전 체크리스트**
   - [ ] RLS 정책이 모두 활성화되었는지 확인
   - [ ] 초대 만료 기간이 적절한지 확인 (현재 7일)
   - [ ] 권한별 접근 제어가 올바르게 작동하는지 확인

## 📧 이메일 전송 구현 (선택사항)

### Supabase Edge Function 사용
```javascript
// supabase/functions/send-invitation/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { email, inviterName, familyName, inviteUrl } = await req.json()
  
  // 이메일 전송 로직 (SendGrid, Resend 등 사용)
  // ...
  
  return new Response(
    JSON.stringify({ success: true }),
    { headers: { "Content-Type": "application/json" } }
  )
})
```

## 🎯 다음 단계
1. 이메일 전송 기능 구현 (필요시)
2. PDF 내보내기 기능 개발
3. AI 자동 태깅 기능 개발

---
최종 업데이트: 2025-07-09
