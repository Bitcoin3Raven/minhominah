export const ko = {
  // 네비게이션
  nav_home: "홈",
  nav_growth: "성장 기록",
  nav_statistics: "통계",
  nav_family: "가족",
  nav_backup: "백업",
  nav_add_memory: "추억 추가",
  nav_main_menu: "주요 메뉴",
  nav_photobook: "포토북 만들기",
  nav_family_settings: "가족 설정",
  nav_share: "공유",
  nav_memories: "추억 보기",
  nav_albums: "앨범",
  nav_invite: "가족 초대",
  nav_admin: "관리자",
  nav_activity_log: "활동 로그",
  nav_trash: "휴지통",
  nav_profile: "프로필",
  
  // 사이트 공통
  site_title: "민호민아",
  language: "언어",
  
  // 인증
  auth_login: "로그인",
  auth_logout: "로그아웃",
  auth_signup: "회원가입",
  auth_account: "계정",
  
  // 히어로 섹션
  hero_title: "민호와 민아의",
  hero_subtitle: "소중한 순간들",
  hero_description: "우리 아이들의 성장 이야기를 기록하고, 추억을 간직하며, 사랑을 나누는 공간입니다.",
  
  // 통계 카드
  stat_total_posts: "총 게시물",
  stat_photos: "사진",
  stat_videos: "동영상",
  stat_milestones: "기념일",
  
  // 필터 섹션
  filter_title: "추억 필터",
  filter_search_placeholder: "제목이나 설명으로 검색...",
  filter_age_view: "나이별 보기",
  filter_all: "전체",
  filter_tags: "태그 필터",
  filter_reset: "초기화",
  filter_slideshow: "슬라이드쇼",
  filter_photobook: "포토북 만들기",
  filter_all_people: "전체보기",
  filter_minho: "민호",
  filter_mina: "민아",
  filter_both: "민호민아",
  
  // 레이아웃
  layout_grid: "그리드",
  layout_masonry: "마소너리",
  layout_timeline: "타임라인",
  
  // 공통 메시지
  msg_loading: "로딩 중...",
  msg_no_data: "데이터가 없습니다",
  msg_error: "오류가 발생했습니다",
  msg_success: "성공적으로 완료되었습니다",
  no_memories: "추억이 없습니다.",
  
  // 버튼
  btn_save: "저장",
  btn_cancel: "취소",
  btn_edit: "편집",
  btn_delete: "삭제",
  btn_share: "공유",
  btn_close: "닫기",
} as const;

export type TranslationKeys = keyof typeof ko;