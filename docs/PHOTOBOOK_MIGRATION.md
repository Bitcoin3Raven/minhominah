# 포토북 생성기 React 마이그레이션

## 개요
photobook-creator.html을 React 컴포넌트로 마이그레이션 완료

## 주요 기능
- 템플릿 선택 (클래식, 모던, 미니멀)
- 기간 선택 (시작일, 종료일)
- 옵션 설정 (표지, 통계, 목차, 타임라인)
- 인물 필터 (전체, 민호만, 민아만, 함께)
- PDF 미리보기 및 생성

## 기술 스택
- React + TypeScript
- jsPDF (PDF 생성)
- html2canvas (HTML to Canvas 변환)
- Supabase (데이터 조회)

## 설치 필요 패키지
```bash
npm install jspdf html2canvas @types/jspdf
```

## 사용법
1. `/photobook-creator` 경로로 접속
2. 템플릿, 기간, 옵션 선택
3. 미리보기 버튼으로 확인
4. 포토북 생성하기 버튼으로 PDF 다운로드

## 추가 개선 사항
- 한글 폰트 지원 (현재 영문으로 대체)
- 이미지 CORS 문제 해결
- 더 다양한 템플릿 추가
- 페이지 레이아웃 커스터마이징
