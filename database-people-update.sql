-- people 테이블에 민호, 민아 정보 추가 (이미 있으면 스킵)

-- 민호 추가
INSERT INTO people (name, birth_date)
VALUES ('민호', NULL)  -- 생년월일은 나중에 UPDATE로 설정
ON CONFLICT (name) DO NOTHING;

-- 민아 추가  
INSERT INTO people (name, birth_date)
VALUES ('민아', NULL)  -- 생년월일은 나중에 UPDATE로 설정
ON CONFLICT (name) DO NOTHING;

-- 생년월일 업데이트 예시
-- UPDATE people SET birth_date = '2020-03-15' WHERE name = '민호';
-- UPDATE people SET birth_date = '2022-07-20' WHERE name = '민아';

-- 생년월일 업데이트를 위한 함수
CREATE OR REPLACE FUNCTION update_child_birthdate(
  p_child_name TEXT,
  p_birthdate DATE
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE people
  SET birth_date = p_birthdate
  WHERE name = p_child_name;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 사용 예시:
-- SELECT update_child_birthdate('민호', '2020-03-15');
-- SELECT update_child_birthdate('민아', '2022-07-20');
