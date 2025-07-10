# minhominah.com 도메인 연결 가이드

## 현재 상황
- 도메인: minhominah.com (dotname 보유)
- Vercel 프로젝트: minhominah.vercel.app (배포됨)
- 목표: minhominah.com을 Vercel 프로젝트에 연결

## 설정 단계

### 1. Vercel에서 도메인 추가
1. Vercel 프로젝트 설정 > Domains 페이지 접속
2. "Add Domain" 버튼 클릭
3. `minhominah.com` 입력 후 추가
4. DNS 설정 안내 확인

### 2. dotname DNS 설정
dotname 관리자 페이지에 로그인 후 DNS 설정:

#### 옵션 A: DNS 레코드 추가 (권장)
```
Type: A
Name: @ (또는 빈칸)
Value: 76.76.21.21

Type: CNAME  
Name: www
Value: cname.vercel-dns.com
```

#### 옵션 B: 네임서버 변경
Vercel 네임서버로 변경:
- ns1.vercel-dns.com
- ns2.vercel-dns.com

### 3. SSL 인증서 자동 설정
- Vercel이 자동으로 Let's Encrypt SSL 인증서 발급
- DNS 설정 후 몇 분 내에 자동 완료

### 4. 설정 확인
- DNS 전파: 최대 48시간 소요 (보통 몇 분~몇 시간)
- Vercel Domains 페이지에서 상태 확인
- 초록색 체크 표시가 나타나면 완료

## 추가 설정

### www 리다이렉션
Vercel은 자동으로 www.minhominah.com을 minhominah.com으로 리다이렉트

### 서브도메인 추가 (선택사항)
예: api.minhominah.com, blog.minhominah.com 등
- 같은 방법으로 추가 가능

## 문제 해결

### DNS 설정이 적용되지 않을 때
1. DNS 캐시 확인: `nslookup minhominah.com`
2. 다른 DNS 서버로 테스트: `nslookup minhominah.com 8.8.8.8`
3. dotname에서 DNS 설정 재확인

### SSL 인증서 오류
- Vercel Domains 페이지에서 "Refresh" 클릭
- 24시간 이상 지속되면 Vercel 지원팀 문의

## 참고 링크
- [Vercel Custom Domains 문서](https://vercel.com/docs/concepts/projects/domains)
- [dotname DNS 설정 가이드](https://www.dotname.co.kr)
