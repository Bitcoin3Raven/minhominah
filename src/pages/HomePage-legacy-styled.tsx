import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FiCamera, FiHeart, FiUsers, FiCalendar } from 'react-icons/fi';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLegacyStyles } from '../hooks/useLegacyStyles';

const HomePage = () => {
  const { user } = useAuth();
  const styles = useLegacyStyles(); // 레거시 스타일 훅 사용
  const [stats, setStats] = useState({
    totalMemories: 0,
    totalPhotos: 0,
    recentMemories: [],
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { count: memoriesCount } = await supabase
        .from('memories')
        .select('*', { count: 'exact', head: true });

      const { count: photosCount } = await supabase
        .from('media_files')
        .select('*', { count: 'exact', head: true });

      const { data: recentMemories } = await supabase
        .from('memories')
        .select('*')
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

  return (
    <div className="min-h-screen">
      {/* Hero Section - 기존 그라데이션 배경 적용 */}
      <section 
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
      >
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className={`${styles.container} relative z-10 py-20 text-center`}>
          <motion.h1 
            className="text-4xl md:text-6xl font-bold text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            민호민아의 성장 이야기
          </motion.h1>
          
          <motion.p 
            className="text-xl text-white/90 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            소중한 순간들을 영원히 기억합니다
          </motion.p>

          {user ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Link 
                to="/upload" 
                className={styles.button + " inline-flex items-center gap-2"}
              >
                <FiCamera /> 추억 추가하기
              </Link>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Link 
                to="/login" 
                className={styles.button + " inline-flex items-center gap-2"}
              >
                로그인하여 시작하기
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* Stats Section - 레거시 카드 스타일 */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className={styles.container}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 추억 카드 */}
            <motion.div 
              className={styles.card}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center p-8">
                <FiHeart className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                <h3 className="text-2xl font-bold mb-2">{stats.totalMemories}</h3>
                <p className="text-gray-600 dark:text-gray-400">소중한 추억</p>
              </div>
            </motion.div>

            {/* 사진 카드 */}
            <motion.div 
              className={styles.card}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center p-8">
                <FiCamera className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                <h3 className="text-2xl font-bold mb-2">{stats.totalPhotos}</h3>
                <p className="text-gray-600 dark:text-gray-400">사진과 동영상</p>
              </div>
            </motion.div>

            {/* 가족 카드 */}
            <motion.div 
              className={styles.card}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center p-8">
                <FiUsers className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                <h3 className="text-2xl font-bold mb-2">함께하는</h3>
                <p className="text-gray-600 dark:text-gray-400">가족의 이야기</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Recent Memories - 레거시 메모리 카드 스타일 */}
      {stats.recentMemories.length > 0 && (
        <section className="py-16">
          <div className={styles.container}>
            <h2 className="text-3xl font-bold text-center mb-12">최근 추억들</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {stats.recentMemories.map((memory) => (
                <Link 
                  key={memory.id} 
                  to={`/memories/${memory.id}`}
                  className="block"
                >
                  <motion.div 
                    className={styles.memoryCard}
                    whileHover={{ scale: 1.03 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="aspect-w-16 aspect-h-12 bg-gray-200 rounded-lg overflow-hidden mb-4">
                      {/* 썸네일 이미지 */}
                      <div className="w-full h-full flex items-center justify-center">
                        <FiCalendar className="w-8 h-8 text-gray-400" />
                      </div>
                    </div>
                    <h3 className="font-semibold mb-2">{memory.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(memory.memory_date).toLocaleDateString('ko-KR')}
                    </p>
                  </motion.div>
                </Link>
              ))}
            </div>
            
            <div className="text-center mt-12">
              <Link to="/memories" className={styles.button}>
                모든 추억 보기
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;
