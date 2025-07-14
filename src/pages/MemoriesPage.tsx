import { useState, useRef, useMemo } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, Link } from 'react-router-dom';
import { FiFilter, FiSearch, FiGrid, FiList, FiCalendar, FiTag, FiX } from 'react-icons/fi';
import { supabase } from '../lib/supabase';
import { useDebounce } from '../hooks/useDebounce';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { highlightText } from '../utils/searchHighlight';
import OptimizedImage from '../components/OptimizedImage';

interface Memory {
  id: string;
  title: string;
  description: string | null;
  memory_date: string;
  created_at: string;
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

const MemoriesPage = () => {
  const [searchParams] = useSearchParams();
  const personParam = searchParams.get('person');
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const [selectedPerson, setSelectedPerson] = useState<string>(personParam || 'all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // 디바운스된 검색어
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // 활성 필터 개수 계산
  const activeFilterCount = 
    (selectedPerson !== 'all' ? 1 : 0) +
    (selectedYear !== 'all' ? 1 : 0) +
    (selectedTags.length > 0 ? selectedTags.length : 0) +
    (searchQuery ? 1 : 0);
    
  // 필터 초기화 함수
  const resetFilters = () => {
    setSelectedPerson('all');
    setSelectedYear('all');
    setSelectedTags([]);
    setSearchQuery('');
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
        <p className="text-red-600 dark:text-red-400 mb-4">추억을 불러오는 중 오류가 발생했습니다.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          새로고침
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">
            추억 갤러리
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
              onClick={() => setShowFilters(!showFilters)}
              className="relative flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <FiFilter className="w-5 h-5" />
              <span>필터</span>
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
            placeholder="추억 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
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
                    인물
                  </label>
                  <select
                    value={selectedPerson}
                    onChange={(e) => setSelectedPerson(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">전체</option>
                    <option value="민호">민호</option>
                    <option value="민아">민아</option>
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
                    연도
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">전체</option>
                    {yearOptions.map(year => (
                      <option key={year} value={year}>
                        {year}년
                      </option>
                    ))}
                  </select>
                </div>

                {/* 태그 필터 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    태그
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
                    <span>필터 초기화</span>
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 결과 요약 */}
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          {filteredMemories?.length || 0}개의 추억
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
            >
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
                    <span>{memory.media_files.length}개 사진</span>
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
                    <span>{memory.media_files.length}개 사진</span>
                  )}
                  {memory.memory_people?.length > 0 && (
                    <span>{memory.memory_people.map(mp => mp.people.name).join(', ')}</span>
                  )}
                </div>
              </div>
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
              ? '검색 결과가 없습니다.'
              : '아직 추억이 없습니다.'}
          </p>
        </div>
      )}

      {/* 무한 스크롤 트리거 및 로딩 인디케이터 */}
      <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
        {isFetchingNextPage && (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-600 dark:text-gray-400">더 많은 추억을 불러오는 중...</span>
          </div>
        )}
        {!hasNextPage && filteredMemories && filteredMemories.length > 0 && (
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            모든 추억을 불러왔습니다
          </p>
        )}
      </div>
    </div>
  );
};

export default MemoriesPage;