import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiFolder, FiCheck, FiLock, FiGlobe } from 'react-icons/fi';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface Album {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_by: string;
}

interface AlbumMemory {
  album_id: string;
  memory_id: string;
}

interface AddToAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  memoryId: string;
  onSuccess?: () => void;
}

const AddToAlbumModal: React.FC<AddToAlbumModalProps> = ({ isOpen, onClose, memoryId, onSuccess }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [selectedAlbums, setSelectedAlbums] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // 모든 앨범 가져오기
  const { data: albums = [] } = useQuery({
    queryKey: ['albums-for-memory', memoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('albums')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Album[];
    },
    enabled: isOpen && !!user,
  });

  // 현재 메모리가 속한 앨범 가져오기
  const { data: currentAlbums = [] } = useQuery({
    queryKey: ['memory-albums', memoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('album_memories')
        .select('album_id')
        .eq('memory_id', memoryId);
      
      if (error) throw error;
      return data.map(item => item.album_id);
    },
    enabled: isOpen && !!memoryId,
  });

  // 초기 선택 상태 설정
  React.useEffect(() => {
    if (currentAlbums.length > 0) {
      setSelectedAlbums(currentAlbums);
    }
  }, [currentAlbums]);

  const handleToggleAlbum = (albumId: string) => {
    setSelectedAlbums(prev => {
      if (prev.includes(albumId)) {
        return prev.filter(id => id !== albumId);
      } else {
        return [...prev, albumId];
      }
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // 현재 연결 삭제
      await supabase
        .from('album_memories')
        .delete()
        .eq('memory_id', memoryId);

      // 새로운 연결 추가
      if (selectedAlbums.length > 0) {
        const newConnections = selectedAlbums.map(albumId => ({
          album_id: albumId,
          memory_id: memoryId,
          position: 0
        }));

        const { error } = await supabase
          .from('album_memories')
          .insert(newConnections);

        if (error) throw error;
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error updating albums:', error);
      alert(t('albums.updateError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('memories.selectAlbums')}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* 앨범 목록 */}
            <div className="overflow-y-auto max-h-[50vh] p-6">
              {albums.length === 0 ? (
                <div className="text-center py-8">
                  <FiFolder className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {t('albums.noAlbums')}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {albums.map((album) => (
                    <label
                      key={album.id}
                      className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAlbums.includes(album.id)}
                        onChange={() => handleToggleAlbum(album.id)}
                        className="sr-only"
                      />
                      <div
                        className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center transition-colors ${
                          selectedAlbums.includes(album.id)
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {selectedAlbums.includes(album.id) && (
                          <FiCheck className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <FiFolder className="w-5 h-5 text-gray-400 mr-3" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {album.name}
                        </div>
                        {album.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {album.description}
                          </div>
                        )}
                      </div>
                      {album.is_public ? (
                        <FiGlobe className="w-4 h-4 text-gray-400" />
                      ) : (
                        <FiLock className="w-4 h-4 text-gray-400" />
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* 액션 버튼 */}
            <div className="flex space-x-3 p-6 border-t dark:border-gray-700">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? t('albums.saving') : t('albums.save')}
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                {t('albums.cancel')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddToAlbumModal;