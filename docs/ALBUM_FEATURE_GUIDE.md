# 앨범 기능 설정 가이드

## 1. Supabase에서 테이블 생성

1. Supabase 대시보드에 로그인
2. SQL Editor로 이동
3. `docs/database-create-albums-table.sql` 파일의 내용을 복사하여 실행

## 2. 생성되는 테이블

- **albums**: 앨범 정보 저장
  - id, name, description, is_public, cover_image_id, created_by, created_at, updated_at
  
- **album_memories**: 앨범과 메모리 연결
  - id, album_id, memory_id, position, created_at

## 3. RLS 정책

- 공개 앨범은 모든 사용자가 조회 가능
- 비공개 앨범은 생성자만 조회 가능
- parent 역할은 모든 앨범 조회 가능
- 앨범 생성/수정/삭제는 인증된 사용자만 가능

## 4. 사용 방법

1. 앨범 페이지(/albums)에서 "새 앨범" 버튼 클릭
2. 앨범 이름과 설명 입력
3. 공개 여부 선택
4. "만들기" 버튼 클릭

## 5. 향후 추가 기능

- 앨범에 메모리 추가/삭제
- 앨범 커버 이미지 설정
- 앨범 공유 링크 생성
- 앨범별 슬라이드쇼