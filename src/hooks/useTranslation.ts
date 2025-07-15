// 임시 번역 훅 - 나중에 실제 번역 시스템으로 교체 필요
export const useTranslation = () => {
  const t = (key: string) => {
    const translations: { [key: string]: string } = {
      // Photobook Creator translations
      photobook_title: '포토북 만들기',
      photobook_subtitle: '소중한 추억들을 아름다운 책으로 만들어보세요',
      photobook_settings: '포토북 설정',
      template_selection: '템플릿 선택',
      photobook_template_classic: '클래식',
      photobook_template_classic_desc: '전통적이고 우아한 스타일',
      photobook_template_modern: '모던',
      photobook_template_modern_desc: '현대적이고 화려한 스타일',
      photobook_template_minimal: '미니멀',
      photobook_template_minimal_desc: '깔끔하고 심플한 스타일',
      period_to_include: '포함할 기간',
      start_date: '시작일',
      end_date: '종료일',
      options: '옵션',
      include_cover_page: '표지 페이지 포함',
      include_stats_page: '통계 페이지 포함',
      include_index_page: '목차 페이지 포함',
      include_timeline: '타임라인 포함',
      people_to_include: '포함할 인물',
      all: '전체',
      minho_only: '민호만',
      mina_only: '민아만',
      minho_mina_together: '민호민아 함께',
      preview: '미리보기',
      generate_photobook: '포토북 생성하기',
      photobook_preview: '포토북 미리보기',
      creating_photobook: '포토북 생성 중...',
      preparing: '준비 중...',
    };

    return translations[key] || key;
  };

  return { t };
};
