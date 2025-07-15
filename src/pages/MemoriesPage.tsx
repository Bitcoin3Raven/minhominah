import { useState, useRef, useMemo, useEffect } from 'react';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { FiFilter, FiSearch, FiGrid, FiList, FiCalendar, FiTag, FiX, FiMoreVertical, FiEdit2, FiTrash2, FiPlay } from 'react-icons/fi';
import { supabase } from '../lib/supabase';
import { useDebounce } from '../hooks/useDebounce';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { highlightText } from '../utils/searchHighlight';
import OptimizedImage from '../components/OptimizedImage';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface Memory {
  id: string;
  title: string;
  description: string | null;
  memory_date: string;
  created_at: string;
  user_id: string;
  created_by: string; // 추가
  media_files: MediaFile[];
  memory_people: MemoryPerson[];
  memory_tags: MemoryTag[];
}

interface MediaFile {
  id: string;
  file_path: string;
  thumbnail_path: string | null;
  file_type: 'image' | 'video';
}

interface MemoryPerson {
  people: {
    id: string;
    name: string;
  };
}

interface MemoryTag {
  tags: {
    id: string;
    name: string;
  };
}

const PAGE_SIZE = 12; // 한 페이지에 표시할 메모리 수

// 민호와 민아의 생년월일
const BIRTH_DATES = {
  '민호': new Date('2018-03-18'), // 민호 생년월일
  '민아': new Date('2019-08-03')  // 민아 생년월일
};

// 특정 날짜 기준으로 나이 계산
const calculateAge = (birthDate: Date, targetDate: Date) => {
  const age = targetDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = targetDate.getMonth() - birthDate.getMonth();
  const dayDiff = targetDate.getDate() - birthDate.getDate();
  
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    return age - 1;
  }
  return age;
};

const MemoriesPage = () => {
  const [searchParams] = useSearchParams();
  const personParam = searchParams.get('person');
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  
  const [selectedPerson, setSelectedPerson] = useState<string>(personParam || 'all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [memoryToDelete, setMemoryToDelete] = useState<Memory | null>(null);
  const [selectedAge, setSelectedAge] = useState<number | 'all'>('all'); // 나이별 필터
  const [showSlideshow, setShowSlideshow] = useState(false); // 슬라이드쇼
  const [slideshowIndex, setSlideshowIndex] = useState(0); // 슬라이드쇼 인덱스
  
  // 디바운스된 검색어
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // 활성 필터 개수 계산
  const activeFilterCount = 
    (selectedPerson !== 'all' ? 1 : 0) +
    (selectedYear !== 'all' ? 1 : 0) +
    (selectedTags.length > 0 ? selectedTags.length : 0) +
    (searchQuery ? 1 : 0) +
    (selectedAge !== 'all' ? 1 : 0);
    
  // 필터 초기화 함수
  const resetFilters = () => {
    setSelectedPerson('all');
    setSelectedYear('all');
    setSelectedTags([]);
    setSearchQuery('');
    setSelectedAge('all');
  };

  // 필터 옵션 데이터 로드
  const { data: people } = useQuery({
    queryKey: ['people'],
    queryFn: async () => {
      const { data, error } = await supabase.from('people').select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tags').select('*');
      if (error) throw error;
      return data;
    },
  });

  // 메모리 데이터 로드 (무한 스크롤)
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ['memories-infinite', selectedPerson, selectedYear, selectedTags, debouncedSearchQuery],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('memories')
        .select(`
          *,
          media_files(*),
          memory_people(people(*)),
          memory_tags(tags(*))
        `, { count: 'exact' })
        .order('memory_date', { ascending: false })
        .range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      
      return {
        memories: data as Memory[],
        totalCount: count || 0,
        pageParam,
      };
    },
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.pageParam + 1;
      const totalPages = Math.ceil(lastPage.totalCount / PAGE_SIZE);
      return nextPage < totalPages ? nextPage : undefined;
    },
    initialPageParam: 0,
  });

  // 모든 페이지의 메모리를 하나의 배열로 합치기
  const allMemories = useMemo(() => {
    return data?.pages.flatMap(page => page.memories) || [];
  }, [data]);

  // 연도 옵션 생성
  const yearOptions = allMemories
    ? [...new Set(allMemories.map(m => new Date(m.memory_date).getFullYear()))]
        .sort((a, b) => b - a)
    : [];

  // 필터링된 메모리
  const filteredMemories = allMemories?.filter(memory => {
    // 인물 필터
    if (selectedPerson !== 'all') {
      const hasPerson = memory.memory_people?.some(mp => 
        mp.people.name === selectedPerson
      );
      if (!hasPerson) return false;
    }

    // 연도 필터
    if (selectedYear !== 'all') {
      const year = new Date(memory.memory_date).getFullYear();
      if (year !== parseInt(selectedYear)) return false;
    }

    // 태그 필터
    if (selectedTags.length > 0) {
      const memoryTags = memory.memory_tags?.map(mt => mt.tags.id) || [];
      const hasAllTags = selectedTags.every(tag => memoryTags.includes(tag));
      if (!hasAllTags) return false;
    }

    // 나이별 필터
    if (selectedAge !== 'all') {
      const memoryDate = new Date(memory.memory_date);
      const hasPerson = memory.memory_people?.some(mp => {
        const birthDate = BIRTH_DATES[mp.people.name as keyof typeof BIRTH_DATES];
        if (!birthDate) return false;
        const ageAtMemory = calculateAge(birthDate, memoryDate);
        return ageAtMemory === selectedAge;
      });
      if (!hasPerson) return false;
    }

    // 검색어 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        memory.title?.toLowerCase().includes(query) ||
        memory.description?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // 무한 스크롤 설정
  useInfiniteScroll(
    () => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    loadMoreRef,
    {
      enabled: !isLoading && hasNextPage && !isFetchingNextPage,
      threshold: 0.5,
    }
  );

  const getMediaUrl = (path: string) => {
    const { data } = supabase.storage.from('media').getPublicUrl(path);
    return data.publicUrl;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 삭제 mutation
  const deleteMutation = useMutation({
    mutationFn: async (memoryId: string) => {
      // RLS 정책이 자동으로 created_by를 확인하므로 별도 조건 불필요
      const { error } = await supabase
        .from('memories')
        .delete()
        .eq('id', memoryId);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories-infinite'] });
      setDeleteModalOpen(false);
      setMemoryToDelete(null);
    },
    onError: (error: any) => {
      console.error('삭제 실패:', error);
      // 권한 관련 에러 체크
      if (error.message?.includes('permission') || error.code === '42501' || error.code === '403') {
        alert(t('memories.permissionError'));
      } else {
        alert(t('memories.deleteError'));
      }
    }
  });

  // 수정 페이지로 이동
  const handleEdit = (memory: Memory) => {
    navigate(`/upload?edit=${memory.id}`);
  };

  // 삭제 확인
  const handleDeleteClick = (memory: Memory) => {
    setMemoryToDelete(memory);
    setDeleteModalOpen(true);
  };

  // 삭제 실행
  const handleDeleteConfirm = () => {
    if (memoryToDelete) {
      deleteMutation.mutate(memoryToDelete.id);
    }
  };

  // 드롭다운 토글
  const toggleDropdown = (memoryId: string) => {
    setShowDropdown(showDropdown === memoryId ? null : memoryId);
  };

  // 외부 클릭시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // 드롭다운 메뉴나 드롭다운 버튼이 아닌 곳을 클릭했을 때만 닫기
      if (showDropdown && 
          !target.closest('.dropdown-menu') && 
          !target.closest('.dropdown-button')) {
        setShowDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showDropdown]);

  // 슬라이드쇼 자동 재생
  useEffect(() => {
    if (!showSlideshow || !filteredMemories || filteredMemories.length === 0) return;

    const interval = setInterval(() => {
      setSlideshowIndex((prev) => 
        prev === filteredMemories.length - 1 ? 0 : prev + 1
      );
    }, 3000); // 3초마다 자동 전환

    return () => clearInterval(interval);
  }, [showSlideshow, filteredMemories, slideshowIndex]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-red-600 dark:text-red-400 mb-4">{t('memories.error')}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {t('memories.refresh')}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">
            {t('memories.title')}
          </h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${
                viewMode === 'grid'
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              <FiGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${
                viewMode === 'list'
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              <FiList className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowSlideshow(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              disabled={filteredMemories?.length === 0}
            >
              <FiPlay className="w-5 h-5" />
              <span>{t('memories.slideshow')}</span>
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="relative flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <FiFilter className="w-5 h-5" />
              <span>{t('memories.filter')}</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 검색 바 */}
        <div className="relative mb-6">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t('memories.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* 나이별 필터 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('memories.ageFilter')}
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedAge('all')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedAge === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500'
              }`}
            >
              {t('memories.all')}
            </button>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((age) => {
              // 현재 날짜 기준으로 민호와 민아의 나이 계산
              const today = new Date();
              const minhoAge = calculateAge(BIRTH_DATES['민호'], today);
              const minaAge = calculateAge(BIRTH_DATES['민아'], today);
              
              // 언어별 나이 표시 형식 설정
              let ageText = '';
              
              if (language === 'en') {
                // 영어: 1 year old, 2 years old
                ageText = age === 1 ? `${age} year old` : `${age} years old`;
              } else if (language === 'th') {
                // 태국어: 1 ปี, 2 ปี
                ageText = `${age} ปี`;
              } else {
                // 한국어: 1세, 2세
                ageText = `${age}세`;
              }
              
              let emoji = '';
              let isMinhoAge = age === minhoAge;
              let isMinaAge = age === minaAge;
              
              if (isMinhoAge) {
                emoji = ' 👦'; // 민호
              } else if (isMinaAge) {
                emoji = ' 👧'; // 민아
              }
              
              // 민호/민아 나이에 특별한 스타일 적용
              let buttonClass = '';
              if (selectedAge === age) {
                // 선택된 상태
                if (isMinhoAge) {
                  buttonClass = 'bg-blue-600 text-white border-2 border-blue-700 ring-2 ring-blue-400 dark:bg-blue-600 dark:border-blue-700 dark:ring-blue-500';
                } else if (isMinaAge) {
                  buttonClass = 'bg-pink-600 text-white border-2 border-pink-700 ring-2 ring-pink-400 dark:bg-pink-600 dark:border-pink-700 dark:ring-pink-500';
                } else {
                  buttonClass = 'bg-blue-600 text-white';
                }
              } else if (isMinhoAge) {
                buttonClass = 'bg-blue-100 text-blue-700 border-2 border-blue-400 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-600 dark:hover:bg-blue-900/50';
              } else if (isMinaAge) {
                buttonClass = 'bg-pink-100 text-pink-700 border-2 border-pink-400 hover:bg-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-600 dark:hover:bg-pink-900/50';
              } else {
                buttonClass = 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500';
              }
              
              return (
                <button
                  key={age}
                  onClick={() => setSelectedAge(age)}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${buttonClass}`}
                >
                  {ageText}{emoji}
                </button>
              );
            })}
          </div>
        </div>

        {/* 필터 섹션 */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {/* 인물 필터 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('memories.personFilter')}
                  </label>
                  <select
                    value={selectedPerson}
                    onChange={(e) => setSelectedPerson(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">{t('memories.all')}</option>
                    {people?.map(person => (
                      <option key={person.id} value={person.name}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 연도 필터 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('memories.yearFilter')}
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">{t('memories.all')}</option>
                    {yearOptions.map(year => (
                      <option key={year} value={year}>
                        {year}{t('memories.year')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 태그 필터 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('memories.tagFilter')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {tags?.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => {
                          setSelectedTags(prev =>
                            prev.includes(tag.id)
                              ? prev.filter(t => t !== tag.id)
                              : [...prev, tag.id]
                          );
                        }}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          selectedTags.includes(tag.id)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500'
                        }`}
                      >
                        <FiTag className="inline-block w-3 h-3 mr-1" />
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* 필터 초기화 버튼 */}
              {activeFilterCount > 0 && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={resetFilters}
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <FiX className="w-4 h-4" />
                    <span>{t('memories.filterReset')}</span>
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 결과 요약 */}
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          {filteredMemories?.length || 0}{t('memories.count')}
        </div>
      </div>

      {/* 메모리 그리드/리스트 */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMemories?.map((memory, index) => (
            <motion.div
              key={memory.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="relative group"
            >
              {/* 수정/삭제 드롭다운 - created_by로 확인 */}
              {user?.id && memory.created_by === user.id && (
                <div className="absolute top-2 right-2 z-10">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleDropdown(memory.id);
                    }}
                    className="dropdown-button p-1.5 bg-white dark:bg-gray-800 rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <FiMoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                  
                  {showDropdown === memory.id && (
                    <div className="dropdown-menu absolute right-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-20"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleEdit(memory);
                          setShowDropdown(null);
                        }}
                        className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <FiEdit2 className="w-4 h-4 mr-2" />
                        {t('memories.edit')}
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteClick(memory);
                          setShowDropdown(null);
                        }}
                        className="flex items-center w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <FiTrash2 className="w-4 h-4 mr-2" />
                        {t('memories.delete')}
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              <Link
                to={`/memories/${memory.id}`}
                className="block bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow group"
              >
                {memory.media_files[0] && (
                  <div className="aspect-square overflow-hidden bg-gray-200 dark:bg-gray-700">
                    <OptimizedImage
                      src={getMediaUrl(memory.media_files[0].file_path)}
                      thumbnailSrc={memory.media_files[0].thumbnail_path ? getMediaUrl(memory.media_files[0].thumbnail_path) : undefined}
                      alt={memory.title}
                      className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                )}
                
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
                    {searchQuery ? highlightText(memory.title, searchQuery) : memory.title}
                  </h3>
                  {memory.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-2">
                      {searchQuery ? highlightText(memory.description, searchQuery) : memory.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                  <div className="flex items-center">
                    <FiCalendar className="w-3 h-3 mr-1" />
                    {formatDate(memory.memory_date)}
                  </div>
                  {memory.media_files.length > 1 && (
                    <span>{memory.media_files.length}{t('memories.photos')}</span>
                  )}
                </div>
                {memory.memory_tags?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {memory.memory_tags.map(mt => (
                      <span
                        key={mt.tags.id}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full"
                      >
                        #{mt.tags.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMemories?.map((memory, index) => (
            <motion.div
              key={memory.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="relative"
            >
              <Link 
                to={`/memories/${memory.id}`}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 flex items-center space-x-4 hover:shadow-xl transition-shadow block"
              >
              {memory.media_files[0] && (
                <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
                  <OptimizedImage
                    src={getMediaUrl(memory.media_files[0].file_path)}
                    thumbnailSrc={memory.media_files[0].thumbnail_path ? getMediaUrl(memory.media_files[0].thumbnail_path) : undefined}
                    alt={memory.title}
                    className="w-full h-full"
                    loading="lazy"
                  />
                </div>
              )}
              
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                  {memory.title}
                </h3>
                {memory.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                    {memory.description}
                  </p>
                )}
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-500">
                  <div className="flex items-center">
                    <FiCalendar className="w-3 h-3 mr-1" />
                    {formatDate(memory.memory_date)}
                  </div>
                  {memory.media_files.length > 1 && (
                    <span>{memory.media_files.length}{t('memories.photos')}</span>
                  )}
                  {memory.memory_people?.length > 0 && (
                    <span>{memory.memory_people.map(mp => mp.people.name).join(', ')}</span>
                  )}
                </div>
              </div>
              
              {/* 수정/삭제 버튼 - 리스트 뷰 */}
              {user?.id && memory.created_by === user.id && (
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleEdit(memory);
                    }}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeleteClick(memory);
                    }}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* 빈 상태 */}
      {filteredMemories?.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery || selectedPerson !== 'all' || selectedYear !== 'all' || selectedTags.length > 0
              ? t('memories.noResults')
              : t('memories.noMemories')}
          </p>
        </div>
      )}

      {/* 무한 스크롤 트리거 및 로딩 인디케이터 */}
      <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
        {isFetchingNextPage && (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-600 dark:text-gray-400">{t('memories.loadingMore')}</span>
          </div>
        )}
        {!hasNextPage && filteredMemories && filteredMemories.length > 0 && (
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {t('memories.allLoaded')}
          </p>
        )}
      </div>

      {/* 삭제 확인 모달 */}
      <AnimatePresence>
        {deleteModalOpen && memoryToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setDeleteModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('memories.deleteConfirmTitle')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                "{memoryToDelete.title}" {t('memories.deleteConfirmMessage')}
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  disabled={deleteMutation.isPending}
                >
                  {t('memories.cancel')}
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <span className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {t('memories.deleting')}
                    </span>
                  ) : (
                    t('memories.delete')
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 슬라이드쇼 */}
      <AnimatePresence>
        {showSlideshow && filteredMemories && filteredMemories.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex items-center justify-center"
            onClick={() => setShowSlideshow(false)}
          >
            <div className="relative w-full h-full" onClick={(e) => e.stopPropagation()}>
              {/* 닫기 버튼 */}
              <button
                onClick={() => setShowSlideshow(false)}
                className="absolute top-4 right-4 text-white p-2 rounded-full bg-black/50 hover:bg-black/70 z-10"
              >
                <FiX className="w-6 h-6" />
              </button>

              {/* 슬라이드쇼 이미지 */}
              {filteredMemories[slideshowIndex]?.media_files.map((media, idx) => (
                idx === 0 && (
                  <div key={media.id} className="w-full h-full flex items-center justify-center">
                    <img
                      src={getMediaUrl(media.file_path)}
                      alt={filteredMemories[slideshowIndex].title}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                )
              ))}

              {/* 정보 표시 */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-8">
                <h2 className="text-white text-2xl font-bold mb-2">
                  {filteredMemories[slideshowIndex].title}
                </h2>
                {filteredMemories[slideshowIndex].description && (
                  <p className="text-white/80">
                    {filteredMemories[slideshowIndex].description}
                  </p>
                )}
                <div className="text-white/60 text-sm mt-2">
                  {formatDate(filteredMemories[slideshowIndex].memory_date)}
                  {filteredMemories[slideshowIndex].memory_people?.length > 0 && (
                    <span className="ml-4">
                      {filteredMemories[slideshowIndex].memory_people.map(mp => mp.people.name).join(', ')}
                    </span>
                  )}
                </div>
              </div>

              {/* 이전/다음 버튼 */}
              <button
                onClick={() => setSlideshowIndex((prev) => 
                  prev === 0 ? filteredMemories.length - 1 : prev - 1
                )}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white p-3 rounded-full bg-black/50 hover:bg-black/70"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setSlideshowIndex((prev) => 
                  prev === filteredMemories.length - 1 ? 0 : prev + 1
                )}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white p-3 rounded-full bg-black/50 hover:bg-black/70"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* 슬라이드 인디케이터 */}
              <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {filteredMemories.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSlideshowIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === slideshowIndex
                        ? 'bg-white w-8'
                        : 'bg-white/50 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MemoriesPage;