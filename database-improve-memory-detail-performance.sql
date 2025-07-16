-- 메모리 상세페이지 성능 개선을 위한 인덱스 생성
-- Supabase 대시보드의 SQL Editor에서 실행하세요

-- memories 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_memories_id ON memories(id);
CREATE INDEX IF NOT EXISTS idx_memories_created_at ON memories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memories_memory_date ON memories(memory_date DESC);

-- media_files 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_media_files_memory_id ON media_files(memory_id);
CREATE INDEX IF NOT EXISTS idx_media_files_created_at ON media_files(created_at);

-- memory_people 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_memory_people_memory_id ON memory_people(memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_people_person_id ON memory_people(person_id);

-- memory_tags 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_memory_tags_memory_id ON memory_tags(memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_tags_tag_id ON memory_tags(tag_id);

-- 복합 인덱스 (자주 함께 사용되는 컬럼들)
CREATE INDEX IF NOT EXISTS idx_memories_user_created_at ON memories(created_by, created_at DESC);

-- 뷰 생성 (자주 사용되는 조인 쿼리 최적화)
CREATE OR REPLACE VIEW memory_details AS
SELECT 
  m.*,
  COALESCE(
    json_agg(DISTINCT 
      jsonb_build_object(
        'id', mf.id,
        'file_path', mf.file_path,
        'thumbnail_path', mf.thumbnail_path,
        'file_type', mf.file_type
      )
    ) FILTER (WHERE mf.id IS NOT NULL), 
    '[]'::json
  ) AS media_files,
  COALESCE(
    json_agg(DISTINCT 
      jsonb_build_object(
        'people', jsonb_build_object(
          'id', p.id,
          'name', p.name
        )
      )
    ) FILTER (WHERE p.id IS NOT NULL), 
    '[]'::json
  ) AS memory_people,
  COALESCE(
    json_agg(DISTINCT 
      jsonb_build_object(
        'tags', jsonb_build_object(
          'id', t.id,
          'name', t.name
        )
      )
    ) FILTER (WHERE t.id IS NOT NULL), 
    '[]'::json
  ) AS memory_tags
FROM memories m
LEFT JOIN media_files mf ON m.id = mf.memory_id
LEFT JOIN memory_people mp ON m.id = mp.memory_id
LEFT JOIN people p ON mp.person_id = p.id
LEFT JOIN memory_tags mt ON m.id = mt.memory_id
LEFT JOIN tags t ON mt.tag_id = t.id
GROUP BY m.id;

-- 뷰에 대한 RLS 정책 설정
ALTER VIEW memory_details SET (security_invoker = true);

-- 인덱스 통계 업데이트 (선택사항)
ANALYZE memories;
ANALYZE media_files;
ANALYZE memory_people;
ANALYZE memory_tags;

-- 실행 계획 확인 (테스트용)
-- EXPLAIN (ANALYZE, BUFFERS) 
-- SELECT * FROM memory_details WHERE id = 'your-memory-id';
