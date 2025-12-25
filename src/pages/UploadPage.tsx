import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUpload, FiX, FiVideo, FiCalendar, FiTag, FiUser, FiPlus, FiEdit2, FiFolder } from 'react-icons/fi';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import AddPersonModal from '../components/AddPersonModal';
import AddTagModal from '../components/AddTagModal';
import { compressImage, formatFileSize, isImageFile, isVideoFile, generateSafeFileName } from '../utils/imageUtils';
import { useLegacyStyles } from '../hooks/useLegacyStyles';
import { useLanguage } from '../contexts/LanguageContext';
import { useChunkedUpload } from '../hooks/useChunkedUpload';
import { ChunkedUploadProgress } from '../components/ChunkedUploadProgress';

interface UploadFormData {
  title: string;
  description: string;
  memory_date: string;
  people: string[];
  tags: string[];
  albums: string[];
  is_public?: boolean; // 공개 여부 추가
}

interface FilePreview {
  file: File;
  url: string;
  type: 'image' | 'video';
  uploadState?: 'pending' | 'uploading' | 'completed' | 'error';
  uploadedPath?: string;
}

interface ExistingMedia {
  id: string;
  file_path: string;
  file_type: 'image' | 'video';
  url?: string;
}

const UploadPage = () => {
  const { user } = useAuth();
  const styles = useLegacyStyles(); // 레거시 스타일 적용
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditMode = !!editId;
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);
  const [existingMedia, setExistingMedia] = useState<ExistingMedia[]>([]);
  const [deletedMediaIds, setDeletedMediaIds] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);
  const [showAddTagModal, setShowAddTagModal] = useState(false);
  const [activeChunkedUpload, setActiveChunkedUpload] = useState<{ file: File; fileName: string; previewIndex: number } | null>(null);

  // 청크 업로드 훅
  const {
    uploadState: chunkedUploadState,
    uploadFile: uploadChunkedFile,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    resetState: resetChunkedUploadState
  } = useChunkedUpload();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<UploadFormData>({
    defaultValues: {
      people: [],
      tags: [],
      albums: [],
    },
  });

  const selectedPeople = watch('people');
  const selectedTags = watch('tags');
  const selectedAlbums = watch('albums');

  // 사람 목록 불러오기
  const { data: people, refetch: refetchPeople } = useQuery({
    queryKey: ['people'],
    queryFn: async () => {
      const { data, error } = await supabase.from('people').select('*');
      if (error) throw error;
      return data;
    },
  });

  // 태그 목록 불러오기
  const { data: tags, refetch: refetchTags } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tags').select('*');
      if (error) throw error;
      return data;
    },
  });

  // 앨범 목록 불러오기
  const { data: albums } = useQuery({
    queryKey: ['albums'],
    queryFn: async () => {
      const { data, error } = await supabase.from('albums').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // 편집 모드: 기존 메모리 데이터 로드
  const { data: editMemory } = useQuery({
    queryKey: ['memory', editId],
    queryFn: async () => {
      if (!editId) return null;
      
      const { data, error } = await supabase
        .from('memories')
        .select(`
          *,
          media_files(*),
          memory_people(person_id),
          memory_tags(tag_id),
          album_memories(album_id)
        `)
        .eq('id', editId)
        .eq('created_by', user?.id)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: isEditMode && !!user,
  });

  // 편집 모드: 폼에 기존 데이터 채우기
  useEffect(() => {
    if (editMemory && people && tags && albums) {
      // 인물 ID 설정
      const peopleIds = editMemory.memory_people?.map((mp: any) => mp.person_id).filter(id => id != null) || [];
      
      // 태그 ID 설정
      const tagIds = editMemory.memory_tags?.map((mt: any) => mt.tag_id).filter(id => id != null) || [];
      
      // 앨범 ID 설정
      const albumIds = editMemory.album_memories?.map((am: any) => am.album_id).filter(id => id != null) || [];
      
      // reset을 사용하여 폼 전체를 한번에 업데이트
      reset({
        title: editMemory.title,
        description: editMemory.description || '',
        memory_date: editMemory.memory_date.split('T')[0],
        people: peopleIds,
        tags: tagIds,
        albums: albumIds,
        is_public: editMemory.is_public || false, // 공개 설정 추가
      });
      
      // 기존 미디어 파일 설정
      const existingMediaFiles = editMemory.media_files?.map((file: any) => ({
        id: file.id,
        file_path: file.file_path,
        file_type: file.file_type,
        url: supabase.storage.from('media').getPublicUrl(file.file_path).data.publicUrl
      })) || [];
      setExistingMedia(existingMediaFiles);
    }
  }, [editMemory, people, tags, albums, reset]);

  // 대용량 파일 여부 확인 (6MB 기준)
  const isLargeFile = useCallback((file: File): boolean => {
    return file.size > 6 * 1024 * 1024; // 6MB
  }, []);

  // generateSafeFileName 유틸리티 함수를 래핑
  const generateFileName = useCallback((file: File, memoryId: string): string => {
    return generateSafeFileName(file, memoryId);
  }, []);

  // 파일 처리
  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;

    const newPreviews: FilePreview[] = [];

    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        try {
          let processedFile = file;
          let url = '';

          // 이미지인 경우만 압축 (동영상은 압축하지 않음)
          if (isImageFile(file) && file.size > 1024 * 1024) { // 1MB 이상인 경우만 압축
            const compressed = await compressImage(file, {
              maxWidth: 2048,
              maxHeight: 2048,
              quality: 0.9,
            });
            processedFile = compressed.file;
            url = compressed.dataUrl;

            console.log(`압축 완료: ${formatFileSize(file.size)} → ${formatFileSize(processedFile.size)}`);
          } else {
            url = URL.createObjectURL(file);
          }

          newPreviews.push({
            file: processedFile,
            url,
            type: file.type.startsWith('image/') ? 'image' : 'video',
            uploadState: 'pending',
          });
        } catch (error) {
          console.error('파일 처리 중 오류:', error);
          alert(`파일 처리 중 오류가 발생했습니다: ${file.name}`);
        }
      }
    }

    setFilePreviews(prev => [...prev, ...newPreviews]);
  }, []);

  // 드래그 앤 드롭 핸들러
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  // 파일 제거
  const removeFile = (index: number) => {
    setFilePreviews(prev => {
      const newPreviews = [...prev];
      URL.revokeObjectURL(newPreviews[index].url);
      newPreviews.splice(index, 1);
      return newPreviews;
    });
  };

  // 기존 미디어 파일 삭제
  const handleDeleteExistingMedia = (mediaId: string) => {
    setDeletedMediaIds(prev => [...prev, mediaId]);
    setExistingMedia(prev => prev.filter(media => media.id !== mediaId));
  };

  // 중복 제출 방지를 위한 ref
  const isSubmittingRef = useRef(false);

  // 폼 제출
  const onSubmit = async (data: UploadFormData) => {
    // 중복 제출 방지
    if (isSubmittingRef.current) {
      console.log('Already submitting, ignoring duplicate submission');
      return;
    }

    if (!user) {
      alert(t('upload_login_required'));
      navigate('/login');
      return;
    }

    // 편집 모드에서는 새 파일이 없어도 괜찮음
    if (!isEditMode && filePreviews.length === 0) {
      alert(t('upload_min_one_file'));
      return;
    }

    // 편집 모드에서 모든 미디어를 삭제하는 경우 체크
    if (isEditMode && filePreviews.length === 0 &&
        existingMedia.length === deletedMediaIds.length) {
      alert(t('upload_min_one_media'));
      return;
    }

    // 중복 제출 플래그 설정
    isSubmittingRef.current = true;
    setUploading(true);
    setUploadProgress(0);

    try {
      let memoryId: string;

      if (isEditMode && editId) {
        // 편집 모드: 기존 추억 업데이트
        const { error: updateError } = await supabase
          .from('memories')
          .update({
            title: data.title,
            description: data.description,
            memory_date: data.memory_date,
            is_public: data.is_public || false, // 공개 설정 추가
            updated_at: new Date().toISOString(),
          })
          .eq('id', editId)
          .eq('created_by', user.id);

        if (updateError) throw updateError;
        memoryId = editId;

        // 삭제된 미디어 파일 처리
        if (deletedMediaIds.length > 0) {
          // Storage에서 파일 삭제
          const deletedMedia = existingMedia.filter(media => 
            deletedMediaIds.includes(media.id)
          );
          
          for (const media of deletedMedia) {
            const { error: deleteStorageError } = await supabase.storage
              .from('media')
              .remove([media.file_path]);
            
            if (deleteStorageError) {
              console.error('Storage 삭제 오류:', deleteStorageError);
            }
          }

          // DB에서 미디어 정보 삭제
          const { error: deleteError } = await supabase
            .from('media_files')
            .delete()
            .in('id', deletedMediaIds);

          if (deleteError) throw deleteError;
        }

        // 기존 인물/태그 연결 삭제
        const { error: deletePeopleError } = await supabase
          .from('memory_people')
          .delete()
          .eq('memory_id', memoryId);
        
        if (deletePeopleError) {
          console.error('기존 인물 삭제 실패:', deletePeopleError);
          throw deletePeopleError;
        }

        const { error: deleteTagsError } = await supabase
          .from('memory_tags')
          .delete()
          .eq('memory_id', memoryId);
        
        if (deleteTagsError) {
          console.error('기존 태그 삭제 실패:', deleteTagsError);
          throw deleteTagsError;
        }

        const { error: deleteAlbumsError } = await supabase
          .from('album_memories')
          .delete()
          .eq('memory_id', memoryId);
        
        if (deleteAlbumsError) {
          console.error('기존 앨범 삭제 실패:', deleteAlbumsError);
          throw deleteAlbumsError;
        }

      } else {
        // 새로 생성
        // 먼저 같은 제목과 날짜의 메모리가 있는지 체크 (10초 이내)
        const tenSecondsAgo = new Date(Date.now() - 10000).toISOString();
        const { data: existingMemories } = await supabase
          .from('memories')
          .select('id, created_at')
          .eq('title', data.title)
          .eq('memory_date', data.memory_date)
          .eq('created_by', user.id)
          .gte('created_at', tenSecondsAgo);

        if (existingMemories && existingMemories.length > 0) {
          console.log('Duplicate memory detected within 10 seconds, skipping creation');
          alert('같은 추억이 이미 등록되었습니다. 추억 갤러리로 이동합니다.');
          navigate('/memories');
          return;
        }

        const { data: memory, error: memoryError } = await supabase
          .from('memories')
          .insert({
            title: data.title,
            description: data.description,
            memory_date: data.memory_date,
            created_by: user.id,
            is_public: data.is_public || false, // 공개 설정 추가
          })
          .select()
          .single();

        if (memoryError) throw memoryError;
        memoryId = memory.id;
      }

      // 2. 새 파일 업로드 (있는 경우)
      if (filePreviews.length > 0) {
        const totalFiles = filePreviews.length;
        let uploadedFiles: { fileName: string; fileType: 'image' | 'video'; fileSize: number }[] = [];

        for (let i = 0; i < totalFiles; i++) {
          const filePreview = filePreviews[i];
          const file = filePreview.file;

          // 파일명 생성
          const fileName = generateFileName(file, memoryId);

          // 대용량 파일인지 확인
          if (isLargeFile(file) || isVideoFile(file)) {
            // 청크 업로드 사용
            console.log(`대용량 파일 감지: ${file.name} (${formatFileSize(file.size)}), 청크 업로드 사용`);

            // 파일 상태 업데이트
            setFilePreviews(prev => prev.map((preview, idx) =>
              idx === i ? { ...preview, uploadState: 'uploading' } : preview
            ));

            // 청크 업로드 실행
            setActiveChunkedUpload({ file, fileName, previewIndex: i });

            await new Promise<void>((resolve, reject) => {
              uploadChunkedFile(file, fileName, {
                bucketName: 'media',
                onProgress: (bytesUploaded, bytesTotal) => {
                  const progress = (bytesUploaded / bytesTotal) * 100;
                  setUploadProgress(((i) / totalFiles) * 50 + 50 + (progress / totalFiles * 50 / 100));
                },
                onSuccess: (url) => {
                  console.log(`청크 업로드 완료: ${fileName}`);
                  uploadedFiles.push({
                    fileName,
                    fileType: filePreview.type,
                    fileSize: file.size
                  });

                  // 파일 상태 업데이트
                  setFilePreviews(prev => prev.map((preview, idx) =>
                    idx === i ? { ...preview, uploadState: 'completed', uploadedPath: fileName } : preview
                  ));

                  resolve();
                },
                onError: (error) => {
                  console.error(`청크 업로드 실패: ${fileName}`, error);

                  // 파일 상태 업데이트
                  setFilePreviews(prev => prev.map((preview, idx) =>
                    idx === i ? { ...preview, uploadState: 'error' } : preview
                  ));

                  reject(error);
                }
              });
            });

            setActiveChunkedUpload(null);

          } else {
            // 표준 업로드 사용 (소용량 파일)
            console.log(`소용량 파일: ${file.name} (${formatFileSize(file.size)}), 표준 업로드 사용`);

            // 파일 상태 업데이트
            setFilePreviews(prev => prev.map((preview, idx) =>
              idx === i ? { ...preview, uploadState: 'uploading' } : preview
            ));

            const { error: uploadError } = await supabase.storage
              .from('media')
              .upload(fileName, file);

            if (uploadError) {
              // 파일 상태 업데이트
              setFilePreviews(prev => prev.map((preview, idx) =>
                idx === i ? { ...preview, uploadState: 'error' } : preview
              ));
              throw uploadError;
            }

            uploadedFiles.push({
              fileName,
              fileType: filePreview.type,
              fileSize: file.size
            });

            // 파일 상태 업데이트
            setFilePreviews(prev => prev.map((preview, idx) =>
              idx === i ? { ...preview, uploadState: 'completed', uploadedPath: fileName } : preview
            ));

            setUploadProgress(((i + 1) / totalFiles) * 50 + 50);
          }
        }

        // 3. 미디어 파일 정보 저장 (모든 파일 업로드 완료 후)
        for (const uploadedFile of uploadedFiles) {
          // 썸네일 생성 (이미지만)
          let thumbnailPath = null;
          if (uploadedFile.fileType === 'image') {
            thumbnailPath = uploadedFile.fileName;
          }

          const { error: mediaError } = await supabase
            .from('media_files')
            .insert({
              memory_id: memoryId,
              file_path: uploadedFile.fileName,
              thumbnail_path: thumbnailPath,
              file_type: uploadedFile.fileType,
              file_size: uploadedFile.fileSize,
            });

          if (mediaError) throw mediaError;
        }
      }

      // 4. 인물 연결
      if (data.people.length > 0) {
        // null이나 undefined, 빈 문자열 값 필터링
        const validPeople = data.people.filter(personId => personId != null && personId !== '');
        
        if (validPeople.length > 0) {
          const peopleInserts = validPeople.map(personId => ({
            memory_id: memoryId,
            person_id: personId,
          }));

          const { error: peopleError } = await supabase
            .from('memory_people')
            .upsert(peopleInserts, { 
              onConflict: 'memory_id,person_id',
              ignoreDuplicates: true 
            });

          if (peopleError) throw peopleError;
        }
      }

      // 5. 태그 연결
      if (data.tags.length > 0) {
        // null이나 undefined, 빈 문자열 값 필터링
        const validTags = data.tags.filter(tagId => tagId != null && tagId !== '');
        
        if (validTags.length > 0) {
          const tagInserts = validTags.map(tagId => ({
            memory_id: memoryId,
            tag_id: tagId,
          }));

          const { error: tagsError } = await supabase
            .from('memory_tags')
            .upsert(tagInserts, { 
              onConflict: 'memory_id,tag_id',
              ignoreDuplicates: true 
            });

          if (tagsError) throw tagsError;
        }
      }

      // 6. 앨범 연결
      if (data.albums.length > 0) {
        // null이나 undefined, 빈 문자열 값 필터링
        const validAlbums = data.albums.filter(albumId => albumId != null && albumId !== '');
        
        if (validAlbums.length > 0) {
          const albumInserts = validAlbums.map(albumId => ({
            album_id: albumId,
            memory_id: memoryId,
            position: 0,
          }));

          const { error: albumsError } = await supabase
            .from('album_memories')
            .upsert(albumInserts, { 
              onConflict: 'album_id,memory_id',
              ignoreDuplicates: true 
            });

          if (albumsError) throw albumsError;
        }
      }

      // 성공 후 추억 갤러리로 이동
      navigate('/memories');
    } catch (error: any) {
      console.error('Upload error:', error);
      console.error('Error details:', error.message, error.details);
      const errorMessage = error.message || '알 수 없는 오류가 발생했습니다.';
      alert(isEditMode ? `${t('upload_edit_error')}: ${errorMessage}` : `${t('upload_error')}: ${errorMessage}`);
    } finally {
      setUploading(false);
      // 중복 제출 플래그 리셋
      isSubmittingRef.current = false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 그라데이션 헤더 섹션 */}
      <div 
        className="relative py-12 mb-8"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
      >
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className={`${styles.container} relative z-10`}>
          <motion.h1 
            className="text-3xl md:text-4xl font-bold text-white text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {isEditMode ? t('upload_edit_title') : t('upload_title')}
          </motion.h1>
          <motion.p 
            className="text-center text-white/90 mt-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {isEditMode ? t('upload_edit_subtitle') : t('upload_subtitle')}
          </motion.p>
        </div>
      </div>

      <div className={styles.container}>
        <motion.div 
          className={styles.card}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
            {/* Hidden fields for array values */}
            {selectedPeople.map((personId, index) => (
              <input
                key={`person-${index}`}
                type="hidden"
                {...register(`people.${index}`)}
                value={personId}
              />
            ))}
            {selectedTags.map((tagId, index) => (
              <input
                key={`tag-${index}`}
                type="hidden"
                {...register(`tags.${index}`)}
                value={tagId}
              />
            ))}
            {selectedAlbums.map((albumId, index) => (
              <input
                key={`album-${index}`}
                type="hidden"
                {...register(`albums.${index}`)}
                value={albumId}
              />
            ))}

            {/* 파일 업로드 영역 */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                {t('upload_media_label')}
              </label>
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                  isDragging
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={(e) => handleFiles(e.target.files)}
                  className="hidden"
                />
                
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <FiUpload className="w-16 h-16 mx-auto mb-4 text-purple-500" />
                </motion.div>
                <p className="text-gray-600 dark:text-gray-400 mb-2 text-lg">
                  {t('upload_drag_drop')}
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={styles.button}
                >
                  {t('upload_select_file')}
                </button>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {t('upload_file_types')}
                </p>
              </div>

              {/* 기존 미디어 파일 (편집 모드) */}
              {isEditMode && existingMedia.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {t('upload_existing_files')}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <AnimatePresence>
                      {existingMedia
                        .filter(media => !deletedMediaIds.includes(media.id))
                        .map((media) => (
                          <motion.div
                            key={media.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            whileHover={{ scale: 1.05 }}
                            className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 shadow-lg"
                          >
                            {media.file_type === 'image' ? (
                              <img
                                src={media.url}
                                alt="Existing media"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full bg-purple-50 dark:bg-purple-900/20">
                                <FiVideo className="w-12 h-12 text-purple-500" />
                              </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                              <p className="text-xs text-white font-medium">
                                {t('upload_existing_files')}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteExistingMedia(media.id)}
                              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all transform hover:scale-110 shadow-lg"
                            >
                              <FiX className="w-4 h-4" />
                            </button>
                          </motion.div>
                        ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* 새 파일 미리보기 */}
              {filePreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <AnimatePresence>
                    {filePreviews.map((preview, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        whileHover={{ scale: 1.05 }}
                        className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 shadow-lg"
                      >
                        {preview.type === 'image' ? (
                          <img
                            src={preview.url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full bg-purple-50 dark:bg-purple-900/20">
                            <FiVideo className="w-12 h-12 text-purple-500" />
                          </div>
                        )}

                        {/* 업로드 상태 오버레이 */}
                        {preview.uploadState === 'uploading' && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="text-center text-white">
                              <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                              <p className="text-xs">업로드 중...</p>
                            </div>
                          </div>
                        )}

                        {preview.uploadState === 'completed' && (
                          <div className="absolute top-2 left-2 p-1 bg-green-500 text-white rounded-full">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}

                        {preview.uploadState === 'error' && (
                          <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                            <div className="text-center text-red-600 dark:text-red-400">
                              <FiX className="w-6 h-6 mx-auto mb-1" />
                              <p className="text-xs">업로드 실패</p>
                            </div>
                          </div>
                        )}

                        {/* 파일 정보 */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                          <p className="text-xs text-white font-medium">
                            {formatFileSize(preview.file.size)}
                          </p>
                          {(isLargeFile(preview.file) || isVideoFile(preview.file)) && (
                            <p className="text-xs text-yellow-300">
                              대용량 파일 - 청크 업로드
                            </p>
                          )}
                        </div>

                        {preview.uploadState !== 'uploading' && (
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all transform hover:scale-110 shadow-lg"
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* 활성 청크 업로드 진행상태 */}
              {activeChunkedUpload && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6"
                >
                  <ChunkedUploadProgress
                    fileName={activeChunkedUpload.file.name}
                    fileSize={activeChunkedUpload.file.size}
                    progress={chunkedUploadState.progress}
                    bytesUploaded={chunkedUploadState.bytesUploaded}
                    bytesTotal={chunkedUploadState.bytesTotal}
                    uploadSpeed={chunkedUploadState.uploadSpeed}
                    estimatedTime={chunkedUploadState.estimatedTime}
                    isUploading={chunkedUploadState.isUploading}
                    isPaused={chunkedUploadState.isPaused}
                    error={chunkedUploadState.error}
                    onPause={pauseUpload}
                    onResume={resumeUpload}
                    onCancel={() => {
                      cancelUpload();
                      setActiveChunkedUpload(null);
                    }}
                  />
                </motion.div>
              )}
            </div>

            {/* 제목 */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                {t('upload_title_label')}
              </label>
              <input
                type="text"
                {...register('title', { required: t('upload_title_required') })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder={t('upload_title_placeholder')}
              />
              {errors.title && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-sm mt-1"
                >
                  {errors.title.message}
                </motion.p>
              )}
            </div>

            {/* 설명 */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                {t('upload_description_label')}
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                placeholder={t('upload_description_placeholder')}
              />
            </div>

            {/* 날짜 */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                <FiCalendar className="inline-block w-4 h-4 mr-1 text-purple-500" />
                {t('upload_date_label')}
              </label>
              <input
                type="date"
                {...register('memory_date', { required: t('upload_date_required') })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              {errors.memory_date && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-sm mt-1"
                >
                  {errors.memory_date.message}
                </motion.p>
              )}
            </div>

            {/* 공개 설정 (parent 역할만 표시) */}
            {user && (
              <div className="flex items-center space-x-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <input
                  type="checkbox"
                  id="is_public"
                  {...register('is_public')}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
                <label
                  htmlFor="is_public"
                  className="flex-1 cursor-pointer"
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    🌍 공개 추억으로 설정
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    이 추억을 로그인하지 않은 사람도 볼 수 있게 합니다
                  </div>
                </label>
              </div>
            )}

            {/* 인물 선택 */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                <FiUser className="inline-block w-4 h-4 mr-1 text-purple-500" />
                {t('upload_people_label')}
              </label>
              
              {/* 선택된 인물 표시 영역 */}
              {selectedPeople.length > 0 && (
                <div className="mb-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="flex flex-wrap gap-2">
                    <AnimatePresence>
                      {selectedPeople.map(personId => {
                        const person = people?.find(p => p.id === personId);
                        if (!person) return null;
                        
                        return (
                          <motion.div
                            key={personId}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${
                              person.name === '민호' 
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                                : person.name === '민아'
                                ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white'
                                : 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                            } shadow-md`}
                          >
                            {person.name}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setValue('people', selectedPeople.filter(id => id !== personId));
                              }}
                              className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                            >
                              <FiX className="w-3 h-3" />
                            </button>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              )}
              
              {/* 선택 가능한 인물 목록 */}
              <div className="flex flex-wrap gap-2">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    const minhoId = people?.find(p => p.name === '민호')?.id;
                    if (minhoId && !selectedPeople.includes(minhoId)) {
                      setValue('people', [...selectedPeople, minhoId]);
                    }
                  }}
                  disabled={selectedPeople.includes(people?.find(p => p.name === '민호')?.id || '')}
                  className={`px-4 py-2 rounded-full transition-all ${
                    selectedPeople.includes(people?.find(p => p.name === '민호')?.id || '')
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-blue-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {t('filter_minho')}
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    const minaId = people?.find(p => p.name === '민아')?.id;
                    if (minaId && !selectedPeople.includes(minaId)) {
                      setValue('people', [...selectedPeople, minaId]);
                    }
                  }}
                  disabled={selectedPeople.includes(people?.find(p => p.name === '민아')?.id || '')}
                  className={`px-4 py-2 rounded-full transition-all ${
                    selectedPeople.includes(people?.find(p => p.name === '민아')?.id || '')
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-pink-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {t('filter_mina')}
                </motion.button>
                {people?.filter(p => p.name !== '민호' && p.name !== '민아').map(person => (
                  <motion.button
                    key={person.id}
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (!selectedPeople.includes(person.id)) {
                        setValue('people', [...selectedPeople, person.id]);
                      }
                    }}
                    disabled={selectedPeople.includes(person.id)}
                    className={`px-4 py-2 rounded-full transition-all ${
                      selectedPeople.includes(person.id)
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-green-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {person.name}
                  </motion.button>
                ))}
                {/* 새 인물 추가 버튼 */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddPersonModal(true)}
                  className="px-4 py-2 rounded-full border-2 border-dashed border-purple-300 dark:border-purple-600 text-purple-600 dark:text-purple-400 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all flex items-center gap-1"
                >
                  <FiPlus className="w-4 h-4" />
                  {t('upload_add_person')}
                </motion.button>
              </div>
            </div>

            {/* 태그 선택 */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                <FiTag className="inline-block w-4 h-4 mr-1 text-purple-500" />
                {t('upload_tags_label')}
              </label>
              
              {/* 선택된 태그 표시 영역 */}
              {selectedTags.length > 0 && (
                <div className="mb-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="flex flex-wrap gap-2">
                    <AnimatePresence>
                      {selectedTags.map(tagId => {
                        const tag = tags?.find(t => t.id === tagId);
                        if (!tag) return null;
                        
                        return (
                          <motion.div
                            key={tagId}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md"
                          >
                            #{tag.name}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setValue('tags', selectedTags.filter(id => id !== tagId));
                              }}
                              className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                            >
                              <FiX className="w-3 h-3" />
                            </button>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              )}
              
              {/* 선택 가능한 태그 목록 */}
              <div className="flex flex-wrap gap-2">
                {tags?.map(tag => (
                  <motion.button
                    key={tag.id}
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (!selectedTags.includes(tag.id)) {
                        setValue('tags', [...selectedTags, tag.id]);
                      }
                    }}
                    disabled={selectedTags.includes(tag.id)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      selectedTags.includes(tag.id)
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-purple-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    #{tag.name}
                  </motion.button>
                ))}
                {/* 새 태그 추가 버튼 */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddTagModal(true)}
                  className="px-3 py-1.5 rounded-full border-2 border-dashed border-purple-300 dark:border-purple-600 text-purple-600 dark:text-purple-400 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all flex items-center gap-1 text-sm"
                >
                  <FiPlus className="w-3 h-3" />
                  {t('upload_add_tag')}
                </motion.button>
              </div>
            </div>

            {/* 앨범 선택 */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                <FiFolder className="inline-block w-4 h-4 mr-1 text-purple-500" />
                {t('upload_album_label')}
              </label>
              
              {/* 선택된 앨범 표시 */}
              {selectedAlbums.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedAlbums.map(albumId => {
                    const album = albums?.find(a => a.id === albumId);
                    if (!album) return null;
                    return (
                      <motion.span
                        key={albumId}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="inline-flex items-center px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm"
                      >
                        <FiFolder className="w-3 h-3 mr-1" />
                        {album.name}
                        <button
                          type="button"
                          onClick={() => setValue('albums', selectedAlbums.filter(id => id !== albumId))}
                          className="ml-2 hover:text-purple-900 dark:hover:text-purple-100"
                        >
                          <FiX className="w-3 h-3" />
                        </button>
                      </motion.span>
                    );
                  })}
                </div>
              )}
              
              {/* 선택 가능한 앨범 목록 */}
              <div className="flex flex-wrap gap-2">
                {albums?.map(album => (
                  <motion.button
                    key={album.id}
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (!selectedAlbums.includes(album.id)) {
                        setValue('albums', [...selectedAlbums, album.id]);
                      }
                    }}
                    disabled={selectedAlbums.includes(album.id)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      selectedAlbums.includes(album.id)
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-purple-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    <FiFolder className="inline-block w-3 h-3 mr-1" />
                    {album.name}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* 제출 버튼 */}
            <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/memories')}
                className={styles.secondaryButton}
              >
                {t('btn_cancel')}
              </motion.button>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={uploading}
                className={`${styles.button} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {uploading ? (isEditMode ? t('upload_editing') : t('upload_uploading')) : (isEditMode ? t('upload_edit_submit') : t('upload_submit'))}
              </motion.button>
            </div>

            {/* 업로드 진행률 */}
            {uploading && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-4"
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 to-purple-700"
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
            )}
          </form>
        </motion.div>
      </div>

      {/* 모달 컴포넌트들 */}
      <AddPersonModal
        isOpen={showAddPersonModal}
        onClose={() => setShowAddPersonModal(false)}
        onSuccess={() => refetchPeople()}
      />
      <AddTagModal
        isOpen={showAddTagModal}
        onClose={() => setShowAddTagModal(false)}
        onSuccess={() => refetchTags()}
      />
    </div>
  );
};

export default UploadPage;