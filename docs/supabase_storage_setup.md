# Supabase Storage 설정 가이드

## 1. Storage 버킷 설정

### media 버킷 생성
1. Supabase 대시보드에서 Storage 섹션으로 이동
2. "New bucket" 클릭
3. 버킷 이름: `media`
4. Public bucket: ✅ 체크 (공개 접근 허용)
5. File size limit: 50MB
6. Allowed MIME types: 
   - image/*
   - video/*

### RLS 정책 설정

```sql
-- 인증된 사용자만 업로드 가능
CREATE POLICY "Authenticated users can upload media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');

-- 모든 사용자가 읽기 가능 (공개 버킷)
CREATE POLICY "Anyone can view media"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'media');

-- 업로드한 사용자만 삭제 가능
CREATE POLICY "Users can delete own media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'media' 
  AND auth.uid() = (
    SELECT created_by 
    FROM memories 
    WHERE id = (storage.foldername(name))[1]::uuid
  )
);
```

## 2. 썸네일 생성 (옵션)

### Edge Function 사용 (권장)
Supabase Edge Functions를 사용하여 자동 썸네일 생성:

```typescript
// supabase/functions/generate-thumbnail/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { record } = await req.json()
  
  // 이미지 파일인 경우만 처리
  if (!record.file_type.startsWith('image/')) {
    return new Response('Not an image', { status: 200 })
  }

  // 썸네일 생성 로직
  // Sharp 또는 ImageMagick 사용
  
  return new Response('Thumbnail created', { status: 200 })
})
```

### 클라이언트 측 썸네일 (현재 구현)
- 업로드 전 클라이언트에서 Canvas API를 사용하여 압축
- 장점: 서버 부하 감소, 빠른 업로드
- 단점: 클라이언트 성능에 의존

## 3. 폴더 구조

```
media/
├── memories/
│   ├── {memory_id}/
│   │   ├── {timestamp}-{filename}
│   │   └── ...
│   └── ...
└── thumbnails/
    └── memories/
        └── {memory_id}/
            └── {timestamp}-{filename}
```

## 4. URL 패턴

### 원본 이미지
```
https://{project_ref}.supabase.co/storage/v1/object/public/media/memories/{memory_id}/{timestamp}-{filename}
```

### 썸네일 (클라이언트 생성)
```
https://{project_ref}.supabase.co/storage/v1/object/public/media/thumbnails/memories/{memory_id}/{timestamp}-{filename}
```

## 5. 업로드 제한

- 최대 파일 크기: 50MB
- 동시 업로드: 제한 없음 (클라이언트에서 순차 처리)
- 지원 형식:
  - 이미지: JPEG, PNG, GIF, WebP
  - 비디오: MP4, WebM, MOV

## 6. 보안 고려사항

1. **파일 검증**
   - MIME 타입 검증
   - 파일 확장자 검증
   - 파일 크기 제한

2. **경로 구조**
   - memory_id를 폴더명으로 사용하여 권한 관리 용이

3. **CDN 캐싱**
   - Supabase는 자동으로 CDN 캐싱 제공
   - Cache-Control 헤더는 자동 설정됨
