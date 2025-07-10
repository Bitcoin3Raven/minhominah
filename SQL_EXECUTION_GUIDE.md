# Supabase SQL 실행 가이드

## 🚨 보안 패치 (2025-01-20) - 최우선 실행

### 0. 보안 패치 적용 (필수)
```sql
-- database-security-patch.sql 실행
-- Supabase Security Advisor 경고 해결
```
- Function Search Path Mutable 문제 해결
- get_comments_tree 함수에 search_path 설정 추가
- **중요**: SQL Editor에서 실행 후, Authentication 설정에서 추가 작업 필요

## 📋 SQL 파일 실행 순서

### 1. 가족 계정 시스템 (필수)
```sql
-- database-family-schema.sql 전체 실행
```
- 가족 그룹, 구성원, 초대 테이블 생성
- RLS 정책 설정
- 자동화 트리거 생성

### 2. People 테이블 업데이트 (필수)
```sql
-- database-people-update.sql 실행
```
- 민호, 민아 레코드 생성 (이미 있으면 스킵)
- 생년월일 업데이트 함수 생성

### 3. 댓글 시스템 (선택사항)

**🚀 간편 설치 (권장):**
```sql
-- database-comments-quick-install.sql 실행
-- 이 스크립트 하나로 모든 댓글 기능 설치 완료!
```

**📋 개별 설치 (문제 해결용):**
```sql
-- 1. 전체 설치: database-comments-schema.sql
-- 2. 누락된 테이블만: database-comments-missing-tables.sql  
-- 3. 상태 확인: database-comments-check-status.sql
```

댓글 시스템 기능:
- 댓글, 좋아요, 알림 테이블 생성
- RLS 정책으로 가족 구성원만 접근 가능
- 댓글 트리 구조 함수 생성
- 실시간 업데이트 자동 설정

### 3-1. 실시간 기능 활성화 (댓글 시스템 사용 시 필수)
```sql
-- database-realtime-setup.sql 실행
-- 또는 아래 SQL 직접 실행:
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE comment_likes;
```

### 4. 생년월일 설정 (선택사항)
SQL Editor에서 직접 실행:
```sql
-- 민호 생년월일 설정 (예시)
UPDATE people SET birth_date = '2020-03-15' WHERE name = '민호';

-- 민아 생년월일 설정 (예시)
UPDATE people SET birth_date = '2022-07-20' WHERE name = '민아';
```

또는 웹 UI에서 설정:
- 메인 페이지의 나이별 필터 섹션에서 설정 가능

## ⚠️ 주의사항
- 순서대로 실행해주세요
- 이미 테이블이 있다면 오류가 발생할 수 있습니다
- 실행 전 백업을 권장합니다
