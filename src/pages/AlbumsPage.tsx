import React, { useState } from 'react';
import { FiPlus, FiFolder, FiLock, FiGlobe, FiX, FiUpload } from 'react-icons/fi';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

interface Album {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  cover_image_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  memories_count?: number;
  cover_url?: string;
  cover_image?: {
    id: string;
    file_path: string;
    file_type: 'image' | 'video';
  } | null;
}

const AlbumsPage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_public: false
  });

  // 앨범 목록 가져오기
  const { data: albums = [], isLoading } = useQuery({
    queryKey: ['albums'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('albums')
        .select(`
          *,
          memories:album_memories(count)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // 앨범별 메모리 개수 처리
      return data.map(album => ({
        ...album,
        memories_count: album.memories?.[0]?.count || 0
      }));
    },
  });

  // 앨범 생성 mutation
  const createAlbumMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data: newAlbum, error } = await supabase
        .from('albums')
        .insert({
          name: data.name,
          description: data.description || null,
          is_public: data.is_public,
          created_by: user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return newAlbum;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
      setShowCreateModal(false);
      setFormData({ name: '', description: '', is_public: false });
    },
  });

  // 미디어 URL 가져오기
  const getMediaUrl = (path: string) => {
    const { data } = supabase.storage.from('media').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleCreateAlbum = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    createAlbumMutation.mutate(formData);
  };

  return (
    <div className="space-y-6 pt-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('albums.title')}</h1>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <FiPlus className="w-5 h-5" />
          <span>{t('albums.newAlbum')}</span>
        </button>
      </div>

      {albums.length === 0 ? (
        <div className="text-center py-20">
          <FiFolder className="w-24 h-24 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
            {t('albums.noAlbums')}
          </h2>
          <p className="text-gray-500 dark:text-gray-500">
            {t('albums.createFirst')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map((album) => (
            <Link
              key={album.id}
              to={`/albums/${album.id}`}
              className="block"
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer">
                <div className="h-48 bg-gray-200 dark:bg-gray-700">
                  <div className="flex items-center justify-center h-full">
                    <FiFolder className="w-16 h-16 text-gray-400" />
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {album.name}
                    </h3>
                    {album.is_public ? (
                      <FiGlobe className="w-4 h-4 text-gray-500" />
                    ) : (
                      <FiLock className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {album.memories_count || 0} {t('albums.memoriesCount')}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 앨범 생성 모달 */}
      <AnimatePresence>
        {showCreateModal && (
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
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t('albums.createAlbum')}
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateAlbum} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('albums.albumName')}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder={t('albums.albumNamePlaceholder')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('albums.description')}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder={t('albums.descriptionPlaceholder')}
                    rows={3}
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={formData.is_public}
                    onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="is_public" className="text-sm text-gray-700 dark:text-gray-300">
                    {t('albums.makePublic')}
                  </label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={createAlbumMutation.isPending}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {createAlbumMutation.isPending ? t('albums.creating') : t('albums.create')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
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
    </div>
  );
};

export default AlbumsPage;