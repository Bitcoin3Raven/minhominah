# 앨범 기능 구현 가이드

## 개요
앨범 기능은 메모리(사진/동영상)를 그룹화하여 관리할 수 있는 기능입니다.

## 주요 기능
1. **앨범 생성/수정/삭제**
2. **메모리를 앨범에 추가**
3. **업로드 시 앨범 선택**
4. **앨범 커버 이미지 설정**

## 데이터베이스 구조
- `albums`: 앨범 정보
- `album_memories`: 앨범-메모리 연결

## 구현된 페이지
- `/albums`: 앨범 목록
- `/albums/:id`: 앨범 상세 페이지

## 사용 방법
1. 앨범 페이지에서 "새 앨범" 버튼으로 앨범 생성
2. 업로드 시 앨범 선택 가능
3. 메모리 상세 페이지에서 "앨범에 추가" 버튼 사용
4. 앨범 상세 페이지에서 커버 이미지 설정 가능

## 미구현 기능
- 앨범 순서 변경 (드래그 앤 드롭)
