import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiEdit2, FiTrash2, FiPlus, FiX, FiLock, FiGlobe, FiImage } from 'react-icons/fi';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface Album {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  cover_image_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  cover_image?: {
    id: string;
    file_path: string;
    file_type: 'image' | 'video';
  } | null;
}

interface Memory {
  id: string;
  title: string;
  memory_date: string;
  media_files?: {
    id: string;
    file_path: string;
    file_type: 'image' | 'video';
    thumbnail_path: string | null;
  }[];
}

interface AlbumMemory {
  id: string;
  album_id: string;
  memory_id: string;
  position: number;
  created_at: string;
  memories: Memory;
}

const AlbumDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    is_public: false
  });

  // 앨범 정보 가져오기
  const { data: album, isLoading: albumLoading } = useQuery({
    queryKey: ['album', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('albums')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Album;
    },
    enabled: !!id,
  });

  // 커버 이미지 정보 가져오기
  const { data: coverImage } = useQuery({
    queryKey: ['album-cover', album?.cover_image_id],
    queryFn: async () => {
      if (!album?.cover_image_id) return null;
      
      const { data, error } = await supabase
        .from('media_files')
        .select('id, file_path, file_type')
        .eq('id', album.cover_image_id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!album?.cover_image_id,
  });

  // 앨범의 메모리들 가져오기
  const { data: albumMemories = [], isLoading: memoriesLoading } = useQuery({
    queryKey: ['album-memories', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('album_memories')
        .select(`
          *,
          memories:memory_id (
            id,
            title,
            memory_date,
            media_files (
              id,
              file_path,
              file_type,
              thumbnail_path
            )
          )
        `)
        .eq('album_id', id)
        .order('position', { ascending: true });
      
      if (error) throw error;
      return data as AlbumMemory[];
    },
    enabled: !!id,
  });

  // 앨범 수정 mutation
  const updateAlbumMutation = useMutation({
    mutationFn: async (data: typeof editFormData) => {
      const { error } = await supabase
        .from('albums')
        .update({
          name: data.name,
          description: data.description || null,
          is_public: data.is_public,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['album', id] });
      setShowEditModal(false);
    },
  });

  // 앨범 삭제 mutation
  const deleteAlbumMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('albums')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      navigate('/albums');
    },
  });

  // 앨범에서 메모리 제거 mutation
  const removeMemoryMutation = useMutation({
    mutationFn: async (albumMemoryId: string) => {
      const { error } = await supabase
        .from('album_memories')
        .delete()
        .eq('id', albumMemoryId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['album-memories', id] });
    },
  });

  // 앨범 커버 이미지 설정 mutation
  const setCoverImageMutation = useMutation({
    mutationFn: async (mediaFileId: string) => {
      const { error } = await supabase
        .from('albums')
        .update({
          cover_image_id: mediaFileId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['album', id] });
    },
  });

  // 편집 모달 열기
  const handleEditClick = () => {
    if (album) {
      setEditFormData({
        name: album.name,
        description: album.description || '',
        is_public: album.is_public
      });
      setShowEditModal(true);
    }
  };

  // 미디어 URL 가져오기
  const getMediaUrl = (path: string) => {
    const { data } = supabase.storage.from('media').getPublicUrl(path);
    return data.publicUrl;
  };

  if (albumLoading || memoriesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-600 dark:text-gray-400">{t('albums.notFound')}</p>
      </div>
    );
  }

  const isOwner = user?.id === album.created_by;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/albums')}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
        >
          <FiArrowLeft className="w-5 h-5" />
          <span>{t('albums.backToAlbums')}</span>
        </button>

        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            {/* 커버 이미지 표시 */}
            {coverImage && (
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                <img
                  src={getMediaUrl(coverImage.file_path)}
                  alt={album.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {album.name}
                </h1>
                {album.is_public ? (
                  <FiGlobe className="w-5 h-5 text-gray-500" />
                ) : (
                  <FiLock className="w-5 h-5 text-gray-500" />
                )}
              </div>
              {album.description && (
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  {album.description}
                </p>
              )}
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
                {albumMemories.length} {t('albums.memoriesCount')}
              </p>
            </div>
          </div>

          {isOwner && (
            <div className="flex space-x-2">
              <button
                onClick={handleEditClick}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                <FiEdit2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="p-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                <FiTrash2 className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 메모리 그리드 */}
      {albumMemories.length === 0 ? (
        <div className="text-center py-20">
          <FiImage className="w-24 h-24 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
            {t('albums.noMemories')}
          </h2>
          <p className="text-gray-500 dark:text-gray-500 mb-4">
            {t('albums.addMemoriesDesc')}
          </p>
          {isOwner && (
            <Link
              to="/memories"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiPlus className="w-5 h-5" />
              <span>{t('albums.addMemories')}</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {albumMemories.map((albumMemory) => {
            const memory = albumMemory.memories;
            const firstMedia = memory.media_files?.[0];
            const thumbnailUrl = firstMedia ? getMediaUrl(firstMedia.thumbnail_path || firstMedia.file_path) : null;

            return (
              <motion.div
                key={albumMemory.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group"
              >
                <Link
                  to={`/memories/${memory.id}`}
                  className="block aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden"
                >
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt={memory.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FiImage className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <h3 className="text-white font-medium truncate">{memory.title}</h3>
                    <p className="text-white/80 text-sm">
                      {new Date(memory.memory_date).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </Link>
                {isOwner && (
                  <>
                    <button
                      onClick={() => removeMemoryMutation.mutate(albumMemory.id)}
                      className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                    {firstMedia && (
                      <button
                        onClick={() => setCoverImageMutation.mutate(firstMedia.id)}
                        className="absolute top-2 left-2 p-1.5 bg-blue-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title={t('albums.setCover')}
                      >
                        <FiImage className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* 편집 모달 */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {t('albums.editAlbum')}
              </h2>

              <form onSubmit={(e) => {
                e.preventDefault();
                updateAlbumMutation.mutate(editFormData);
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('albums.albumName')}
                  </label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('albums.description')}
                  </label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    rows={3}
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="edit_is_public"
                    checked={editFormData.is_public}
                    onChange={(e) => setEditFormData({ ...editFormData, is_public: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="edit_is_public" className="text-sm text-gray-700 dark:text-gray-300">
                    {t('albums.makePublic')}
                  </label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={updateAlbumMutation.isPending}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {updateAlbumMutation.isPending ? t('albums.saving') : t('albums.save')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    {t('albums.cancel')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 삭제 확인 모달 */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {t('albums.deleteAlbum')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t('albums.deleteConfirm')}
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => deleteAlbumMutation.mutate()}
                  disabled={deleteAlbumMutation.isPending}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {deleteAlbumMutation.isPending ? t('albums.deleting') : t('albums.delete')}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  {t('albums.cancel')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AlbumDetailPage;
