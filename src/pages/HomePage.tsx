import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FiCamera, FiHeart, FiUsers, FiCalendar } from 'react-icons/fi';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLegacyStyles } from '../hooks/useLegacyStyles';

const HomePage = () => {
  const { user } = useAuth();
  const styles = useLegacyStyles();
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
      // 추억 총 개수
      const { count: memoriesCount } = await supabase
        .from('memories')
        .select('*', { count: 'exact', head: true });

      // 사진 총 개수
      const { count: photosCount } = await supabase
        .from('media_files')
        .select('*', { count: 'exact', head: true });

      // 최근 추억
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
    <div>
      {/* 히어로 섹션 - 기존의 선명한 그라데이션 복원 */}
      <section 
        className="relative overflow-hidden -mt-16 pt-32 pb-16" 
        style={{
          background: `
            radial-gradient(circle at 10% 10%, rgba(255, 182, 193, 0.8) 0%, rgba(255, 192, 203, 0.5) 25%, transparent 50%),
            radial-gradient(circle at 90% 90%, rgba(135, 206, 235, 0.8) 0%, rgba(135, 206, 235, 0.5) 25%, transparent 50%),
            linear-gradient(135deg, #ffe0e6 0%, #fff5f7 50%, #e6f3ff 100%)
          `
        }}
      >
        {/* 추가 장식 요소 - 더 선명한 효과 */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-40 right-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-3xl md:text-5xl font-bold mb-2" style={{ fontFamily: 'Pretendard' }}>
              <span style={{ color: '#333' }}>민호와 민아의</span>
              <br />
              <span 
                className="inline-block"
                style={{ 
                  background: 'linear-gradient(to right, #ff69b4 0%, #87ceeb 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontSize: '1.1em'
                }}
              >
                소중한 순간들
              </span>
            </h1>
            <p className="text-lg max-w-2xl mx-auto mb-8" style={{ color: '#666', fontFamily: 'Pretendard' }}>
              우리 아이들의 성장 이야기를 기록하고,<br className="hidden sm:block" />
              추억을 간직하며, 사랑을 나누는 공간입니다.
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
                추억 둘러보기
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
                  추억 추가하기
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
                  추억 추가하기
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* 통계 섹션 */}
      <section className="py-16" style={{ backgroundColor: '#f8f9fa' }}>
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
          >
            <div className="card p-6 text-center">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pink-100">
                  <FiHeart className="w-8 h-8 text-pink-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-800 mb-2">{stats.totalMemories}</p>
              <p className="text-gray-600">전체 추억</p>
            </div>

            <div className="card p-6 text-center">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100">
                  <FiCamera className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-800 mb-2">{stats.totalPhotos}</p>
              <p className="text-gray-600">사진</p>
            </div>

            <div className="card p-6 text-center">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100">
                  <FiCalendar className="w-8 h-8 text-purple-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-800 mb-2">0</p>
              <p className="text-gray-600">동영상</p>
            </div>

            <div className="card p-6 text-center">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
                  <FiUsers className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-800 mb-2">0</p>
              <p className="text-gray-600">기념일</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 아이들 소개 섹션 */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-3xl font-bold text-center mb-12 text-gray-800"
          >
            우리 아이들
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="card overflow-hidden hover:transform hover:scale-105 transition-transform duration-300"
            >
              <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600" />
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-3 text-gray-800">민호</h3>
                <p className="text-gray-600">
                  우리 집의 든든한 첫째, 민호의 성장 이야기
                </p>
                <Link
                  to="/memories?person=민호"
                  className="inline-flex items-center mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  민호의 추억 보기 →
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="card overflow-hidden hover:transform hover:scale-105 transition-transform duration-300"
            >
              <div className="h-48 bg-gradient-to-br from-pink-400 to-pink-600" />
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-3 text-gray-800">민아</h3>
                <p className="text-gray-600">
                  사랑스러운 막내, 민아의 귀여운 일상
                </p>
                <Link
                  to="/memories?person=민아"
                  className="inline-flex items-center mt-4 text-pink-600 hover:text-pink-700 font-medium"
                >
                  민아의 추억 보기 →
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 최근 추억 섹션 */}
      {stats.recentMemories.length > 0 && (
        <section className="py-16" style={{ backgroundColor: '#f8f9fa' }}>
          <div className="container mx-auto px-4">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="text-3xl font-bold text-center mb-12 text-gray-800"
            >
              최근 추억
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stats.recentMemories.map((memory, index) => (
                <motion.div
                  key={memory.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                  className="card overflow-hidden hover:transform hover:translateY(-4px) transition-all duration-300"
                >
                  <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                    {/* 썸네일 이미지 */}
                    <div className="flex items-center justify-center h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                      <FiCamera className="w-12 h-12 text-gray-400" />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-2">
                      {memory.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(memory.memory_date).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link
                to="/memories"
                className="inline-flex items-center text-primary hover:text-primary-dark font-medium"
              >
                모든 추억 보기 →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 하단 CTA 섹션 */}
      <section className="py-20 bg-gradient-to-r from-purple-100 via-pink-100 to-blue-100">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4 text-gray-800">
              오늘의 소중한 순간을 기록해보세요
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              시간이 지나도 빛나는 추억들을 민호민아닷컴에 담아두세요
            </p>
            {user ? (
              <Link
                to="/upload"
                className="btn-primary inline-flex items-center justify-center text-lg"
                style={{ padding: '14px 40px' }}
              >
                <FiCamera className="mr-2" />
                추억 업로드하기
              </Link>
            ) : (
              <Link
                to="/login"
                className="btn-primary inline-flex items-center justify-center text-lg"
                style={{ padding: '14px 40px' }}
              >
                시작하기
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;