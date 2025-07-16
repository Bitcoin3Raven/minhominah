import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiCalendar, FiTag, FiUser, FiDownload, FiShare2, FiHeart, FiMessageSquare, FiMoreVertical, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';
import CommentSection from '../components/CommentSection';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface Memory {
  id: string;
  title: string;
  description: string | null;
  memory_date: string;
  created_at: string;
  user_id: string;
  created_by: string;
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

const MemoryDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const { data: memory, isLoading } = useQuery({
    queryKey: ['memory', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('memories')
        .select(`
          *,
          media_files(*),
          memory_people(people(*)),
          memory_tags(tags(*))
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Memory;
    },
  });

  // 삭제 mutation
  const deleteMutation = useMutation({
    mutationFn: async (memoryId: string) => {
      const { error } = await supabase
        .from('memories')
        .delete()
        .eq('id', memoryId);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories-infinite'] });
      navigate('/memories');
    },
    onError: (error: any) => {
      console.error('삭제 실패:', error);
      if (error.message?.includes('permission') || error.code === '42501' || error.code === '403') {
        alert(t('memories.permissionError'));
      } else {
        alert(t('memories.deleteError'));
      }
    }
  });

  // 수정 페이지로 이동
  const handleEdit = () => {
    navigate(`/upload?edit=${id}`);
  };

  // 삭제 확인
  const handleDeleteClick = () => {
    setDeleteModalOpen(true);
  };

  // 삭제 실행
  const handleDeleteConfirm = () => {
    if (id) {
      deleteMutation.mutate(id);
    }
  };

  // 외부 클릭시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showDropdown && 
          !target.closest('.dropdown-menu') && 
          !target.closest('.dropdown-button')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showDropdown]);

  const getMediaUrl = (path: string) => {
    const { data } = supabase.storage.from('media').getPublicUrl(path);
    return data.publicUrl;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = language === 'ko' ? 'ko-KR' : language === 'th' ? 'th-TH' : 'en-US';
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleShare = async () => {
    const shareData = {
      title: memory.title,
      text: memory.description || `${memory.title}의 추억을 확인해보세요!`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('링크가 클립보드에 복사되었습니다!');
      }
    } catch (error) {
      console.error('공유 실패:', error);
    }
  };

  const handleDownload = async () => {
    if (!memory.media_files || memory.media_files.length === 0) return;

    try {
      const currentMedia = memory.media_files[currentImageIndex];
      const response = await fetch(getMediaUrl(currentMedia.file_path));
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${memory.title}_${currentImageIndex + 1}.${currentMedia.file_type === 'image' ? 'jpg' : 'mp4'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('다운로드 실패:', error);
      alert('다운로드에 실패했습니다.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"
        />
      </div>
    );
  }

  if (!memory) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 dark:text-gray-400">{t('memories.notFound')}</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* 배경 그라데이션 */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 dark:opacity-0 transition-opacity duration-300"
          style={{
            background: `
              radial-gradient(circle at 30% 20%, rgba(255, 182, 193, 0.2) 0%, transparent 50%),
              radial-gradient(circle at 70% 80%, rgba(135, 206, 235, 0.2) 0%, transparent 50%),
              linear-gradient(135deg, #fef9f6 0%, #f0f8ff 100%)
            `
          }}
        />
        <div className="absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate('/memories')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
            <span>{t('memories.backToGallery')}</span>
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 이미지/비디오 섹션 */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-2"
          >
            {memory.media_files && memory.media_files.length > 0 && (
              <div className="space-y-4">
                {/* 메인 이미지 */}
                <div className="relative aspect-[4/3] bg-gray-200/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-2xl overflow-hidden shadow-2xl">
                  {memory.media_files[currentImageIndex].file_type === 'image' ? (
                    <motion.img
                      key={currentImageIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      src={getMediaUrl(memory.media_files[currentImageIndex].file_path)}
                      alt={memory.title}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <video
                      src={getMediaUrl(memory.media_files[currentImageIndex].file_path)}
                      controls
                      className="w-full h-full"
                    />
                  )}
                </div>

                {/* 썸네일 */}
                {memory.media_files.length > 1 && (
                  <div className="grid grid-cols-6 gap-2">
                    {memory.media_files.map((file, index) => (
                      <motion.button
                        key={file.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`relative aspect-square rounded-lg overflow-hidden transition-all ${
                          index === currentImageIndex
                            ? 'ring-2 ring-purple-500 shadow-lg'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                      >
                        {file.file_type === 'image' ? (
                          <img
                            src={getMediaUrl(file.thumbnail_path || file.file_path)}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                            <span className="text-2xl">🎥</span>
                          </div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* 정보 섹션 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200/50 dark:border-gray-700/50"
          >
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {memory.title}
              </h1>
              
              {/* 수정/삭제 드롭다운 */}
              {user?.id && memory.created_by === user.id && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowDropdown(!showDropdown);
                    }}
                    className="dropdown-button p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <FiMoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                  
                  {showDropdown && (
                    <div className="dropdown-menu absolute right-0 mt-1 w-36 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-20"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleEdit();
                          setShowDropdown(false);
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
                          handleDeleteClick();
                          setShowDropdown(false);
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
            </div>

            {memory.description && (
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {memory.description}
              </p>
            )}

            <div className="space-y-4">
              {/* 날짜 */}
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <FiCalendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-gray-700 dark:text-gray-300">
                  {formatDate(memory.memory_date)}
                </span>
              </div>

              {/* 인물 */}
              {memory.memory_people && memory.memory_people.length > 0 && (
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mt-0.5">
                    <FiUser className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {memory.memory_people.map(mp => (
                      <span
                        key={mp.people.id}
                        className="px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full text-sm font-medium"
                      >
                        {mp.people.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 태그 */}
              {memory.memory_tags && memory.memory_tags.length > 0 && (
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg mt-0.5">
                    <FiTag className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {memory.memory_tags.map(mt => (
                      <span
                        key={mt.tags.id}
                        className="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                      >
                        #{mt.tags.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 액션 버튼 */}
            <div className="mt-8 space-y-3">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleShare}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg"
              >
                <FiShare2 className="w-5 h-5" />
                <span>{t('memories.share')}</span>
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDownload}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
              >
                <FiDownload className="w-5 h-5" />
                <span>{t('memories.download')}</span>
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* 댓글 섹션 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200/50 dark:border-gray-700/50"
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <FiMessageSquare className="mr-2" />
            {t('memories.comments')}
          </h2>
          <CommentSection memoryId={id!} />
        </motion.div>
      </div>

      {/* 삭제 확인 모달 */}
      <AnimatePresence>
        {deleteModalOpen && memory && (
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
                "{memory.title}" {t('memories.deleteConfirmMessage')}
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
    </div>
  );
};

export default MemoryDetailPage;