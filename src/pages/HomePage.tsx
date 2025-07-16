import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FiCamera, FiHeart, FiUsers, FiCalendar } from 'react-icons/fi';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLegacyStyles } from '../hooks/useLegacyStyles';
import { useLanguage } from '../contexts/LanguageContext';

interface MediaFile {
  id: string;
  file_path: string;
  thumbnail_path: string | null;
  file_type: 'image' | 'video';
}

interface Memory {
  id: string;
  title: string;
  memory_date: string;
  media_files?: MediaFile[];
}

interface Stats {
  totalMemories: number;
  totalPhotos: number;
  recentMemories: Memory[];
}

const HomePage = () => {
  const { user } = useAuth();
  const styles = useLegacyStyles();
  const { t } = useLanguage();
  const [stats, setStats] = useState<Stats>({
    totalMemories: 0,
    totalPhotos: 0,
    recentMemories: [],
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // 추억 총 개수
      const { count: memoriesCount } = await supabase
        .from('memories')
        .select('*', { count: 'exact', head: true });

      // 사진 총 개수
      const { count: photosCount } = await supabase
        .from('media_files')
        .select('*', { count: 'exact', head: true });

      // 최근 추억 (미디어 파일 포함)
      const { data: recentMemories } = await supabase
        .from('memories')
        .select(`
          *,
          media_files(*)
        `)
        .order('memory_date', { ascending: false })
        .limit(3);

      setStats({
        totalMemories: memoriesCount || 0,
        totalPhotos: photosCount || 0,
        recentMemories: recentMemories || [],
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // 미디어 URL 가져오기
  const getMediaUrl = (path: string) => {
    const { data } = supabase.storage.from('media').getPublicUrl(path);
    return data.publicUrl;
  };

  return (
    <div>
      {/* 히어로 섹션 - 다크모드 지원 추가 */}
      <section className="relative overflow-hidden -mt-16 pt-32 pb-16">
        {/* 라이트모드 배경 */}
        <div 
          className="absolute inset-0 dark:hidden"
          style={{
            background: `
              radial-gradient(circle at 10% 10%, rgba(255, 182, 193, 0.8) 0%, rgba(255, 192, 203, 0.5) 25%, transparent 50%),
              radial-gradient(circle at 90% 90%, rgba(135, 206, 235, 0.8) 0%, rgba(135, 206, 235, 0.5) 25%, transparent 50%),
              linear-gradient(135deg, #ffe0e6 0%, #fff5f7 50%, #e6f3ff 100%)
            `
          }}
        />
        
        {/* 다크모드 배경 */}
        <div className="absolute inset-0 bg-gray-900 hidden dark:block" />
        
        {/* 추가 장식 요소 - 다크모드에서 투명도 조정 및 모바일 반응형 개선 */}
        <div className="absolute inset-0">
          {/* 핑크색 원 - 왼쪽 위, 더 연하게 처리 */}
          <div className="absolute top-20 left-10 md:left-20 w-48 h-48 md:w-72 md:h-72 bg-pink-300 dark:bg-pink-600/20 rounded-full mix-blend-multiply filter blur-xl opacity-40 dark:opacity-20 animate-blob"></div>
          
          {/* 파란색 원 - 오른쪽 위, 더 연하게 처리 */}
          <div className="absolute top-40 right-10 md:right-20 w-48 h-48 md:w-72 md:h-72 bg-blue-300 dark:bg-blue-600/20 rounded-full mix-blend-multiply filter blur-xl opacity-40 dark:opacity-20 animate-blob animation-delay-2000"></div>
          
          {/* 보라색 원 - 가운데 아래, 더 아래로 이동하고 투명도 낮춤 */}
          <div className="absolute -bottom-32 md:-bottom-16 left-1/2 transform -translate-x-1/2 w-48 h-48 md:w-72 md:h-72 bg-purple-300 dark:bg-purple-600/30 rounded-full mix-blend-multiply filter blur-xl opacity-40 dark:opacity-20 animate-blob-gentle animation-delay-4000"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-3xl md:text-5xl font-bold mb-2" style={{ fontFamily: 'Pretendard' }}>
              <span className="text-gray-800 dark:text-gray-100">{t('hero_title')}</span>
              <br />
              <span className="inline-block text-5xl md:text-6xl">
                <span className="bg-gradient-to-r from-pink-500 to-blue-400 bg-clip-text text-transparent dark:hidden">
                  {t('hero_subtitle')}
                </span>
                <span className="hidden dark:inline bg-gradient-to-r from-pink-300 to-blue-300 bg-clip-text text-transparent">
                  {t('hero_subtitle')}
                </span>
              </span>
            </h1>
            <p className="text-lg max-w-2xl mx-auto mb-8 dark:text-gray-300" style={{ color: '#666', fontFamily: 'Pretendard' }}>
              {t('hero_description')}
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link
                to="/memories"
                className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white rounded-full transition-all duration-300 hover:shadow-lg hover:transform hover:scale-105"
                style={{ 
                  backgroundColor: '#667eea',
                  textDecoration: 'none'
                }}
              >
                {t('hero_view_memories')}
              </Link>
              {user ? (
                <Link
                  to="/upload"
                  className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium bg-white rounded-full transition-all duration-300 hover:shadow-lg hover:transform hover:scale-105"
                  style={{ 
                    color: '#667eea',
                    border: '1px solid #e5e7eb',
                    textDecoration: 'none'
                  }}
                >
                  {t('hero_add_memory')}
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium bg-white rounded-full transition-all duration-300 hover:shadow-lg hover:transform hover:scale-105"
                  style={{ 
                    color: '#667eea',
                    border: '1px solid #e5e7eb',
                    textDecoration: 'none'
                  }}
                >
                  {t('hero_add_memory')}
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* 통계 섹션 */}
      <section className="py-16 bg-background-secondary dark:from-gray-800/50 dark:to-gray-900/50 dark:bg-gradient-to-b" style={{ backgroundColor: '#f8f9fa' }}>
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
          >
            <div className="card p-6 text-center bg-card dark:bg-gray-800/80 shadow-custom-md dark:backdrop-blur">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pink-100 dark:bg-pink-900/30">
                  <FiHeart className="w-8 h-8 text-pink-600 dark:text-pink-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">{stats.totalMemories}</p>
              <p className="text-gray-600 dark:text-gray-300">{t('stat_total_memories')}</p>
            </div>

            <div className="card p-6 text-center bg-card dark:bg-gray-800/80 shadow-custom-md dark:backdrop-blur">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <FiCamera className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">{stats.totalPhotos}</p>
              <p className="text-gray-600 dark:text-gray-300">{t('stat_photos')}</p>
            </div>

            <div className="card p-6 text-center bg-card dark:bg-gray-800/80 shadow-custom-md dark:backdrop-blur">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30">
                  <FiCalendar className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">0</p>
              <p className="text-gray-600 dark:text-gray-300">{t('stat_videos')}</p>
            </div>

            <div className="card p-6 text-center bg-card dark:bg-gray-800/80 shadow-custom-md dark:backdrop-blur">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30">
                  <FiUsers className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">0</p>
              <p className="text-gray-600 dark:text-gray-300">{t('stat_milestones')}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 아이들 소개 섹션 */}
      <section className="py-16 bg-white dark:from-gray-900/50 dark:to-gray-800/50 dark:bg-gradient-to-b">
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-3xl font-bold text-center mb-12 text-gray-800 dark:text-gray-100"
          >
            {t('section_our_children')}
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="card overflow-hidden hover:transform hover:scale-105 transition-transform duration-300 bg-card dark:bg-gray-800 shadow-custom-md"
            >
              <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-600 dark:to-blue-800" />
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-3 text-gray-800 dark:text-gray-100">{t('child_minho_title')}</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t('child_minho_desc')}
                </p>
                <Link
                  to="/memories?person=민호"
                  className="inline-flex items-center mt-4 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  {t('child_minho_view')} →
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="card overflow-hidden hover:transform hover:scale-105 transition-transform duration-300 bg-card dark:bg-gray-800 shadow-custom-md"
            >
              <div className="h-48 bg-gradient-to-br from-pink-400 to-pink-600 dark:from-pink-600 dark:to-pink-800" />
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-3 text-gray-800 dark:text-gray-100">{t('child_mina_title')}</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t('child_mina_desc')}
                </p>
                <Link
                  to="/memories?person=민아"
                  className="inline-flex items-center mt-4 text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 font-medium"
                >
                  {t('child_mina_view')} →
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 최근 추억 섹션 */}
      {stats.recentMemories.length > 0 && (
        <section className="py-16 bg-background-secondary dark:from-gray-800/50 dark:to-gray-900/50 dark:bg-gradient-to-b" style={{ backgroundColor: '#f8f9fa' }}>
          <div className="container mx-auto px-4">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="text-3xl font-bold text-center mb-12 text-gray-800 dark:text-gray-100"
            >
              {t('section_recent_memories')}
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stats.recentMemories.map((memory, index) => (
                <Link
                  key={memory.id}
                  to={`/memories/${memory.id}`}
                  className="block"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                    className="card overflow-hidden hover:transform hover:translateY(-4px) transition-all duration-300 bg-card dark:bg-gray-800/80 shadow-custom-md dark:backdrop-blur"
                  >
                    <div className="aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-600">
                      {/* 썸네일 이미지 */}
                      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 overflow-hidden">
                        {memory.media_files && memory.media_files.length > 0 ? (
                          <img
                            src={getMediaUrl(memory.media_files[0].thumbnail_path || memory.media_files[0].file_path)}
                            alt={memory.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              const fallbackDiv = e.currentTarget.nextElementSibling;
                              if (fallbackDiv) {
                                (fallbackDiv as HTMLElement).style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div 
                          className={`absolute inset-0 flex items-center justify-center ${memory.media_files && memory.media_files.length > 0 ? 'hidden' : 'flex'}`}
                          style={{ display: memory.media_files && memory.media_files.length > 0 ? 'none' : 'flex' }}
                        >
                          <FiCamera className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                        {memory.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(memory.memory_date).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link
                to="/memories"
                className="inline-flex items-center text-primary hover:text-primary-dark dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                {t('view_all_memories')} →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 하단 CTA 섹션 */}
      <section className="py-20 bg-gradient-to-r from-purple-100 via-pink-100 to-blue-100 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-100">
              {t('cta_title')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              {t('cta_desc')}
            </p>
            {user ? (
              <Link
                to="/upload"
                className="btn-primary inline-flex items-center justify-center text-lg hover:shadow-lg transition-all hover:scale-105"
                style={{ padding: '14px 40px' }}
              >
                <FiCamera className="mr-2" />
                {t('btn_upload_memory')}
              </Link>
            ) : (
              <Link
                to="/login"
                className="btn-primary inline-flex items-center justify-center text-lg hover:shadow-lg transition-all hover:scale-105"
                style={{ padding: '14px 40px' }}
              >
                {t('btn_start')}
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;