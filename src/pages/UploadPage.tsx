import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface UploadFormData {
  title: string;
  description: string;
  memory_date: string;
  people: string[];
  files: FileList;
}

const UploadPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UploadFormData>();

  const onSubmit = async (data: UploadFormData) => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // 1. 추억 생성
      const { data: memory, error: memoryError } = await supabase
        .from('memories')
        .insert({
          title: data.title,
          description: data.description,
          memory_date: data.memory_date,
          created_by: user.id,
        })
        .select()
        .single();

      if (memoryError) throw memoryError;

      // 2. 파일 업로드
      const files = Array.from(data.files);
      const totalFiles = files.length;

      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        const fileName = `memories/${memory.id}/${Date.now()}-${file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // 3. 미디어 파일 정보 저장
        const { error: mediaError } = await supabase
          .from('media_files')
          .insert({
            memory_id: memory.id,
            file_path: fileName,
            file_type: file.type.startsWith('image/') ? 'image' : 'video',
            file_size: file.size,
          });

        if (mediaError) throw mediaError;

        setUploadProgress(((i + 1) / totalFiles) * 100);
      }

      // 성공 후 추억 갤러리로 이동
      navigate('/memories');
    } catch (error) {
      console.error('Upload error:', error);
      alert('업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">새로운 추억 추가</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            제목 *
          </label>
          <input
            type="text"
            {...register('title', { required: '제목을 입력해주세요' })}
            className="w-full px-3 py-2 border rounded-md"
          />
          {errors.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            설명
          </label>
          <textarea
            {...register('description')}
            rows={4}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            날짜 *
          </label>
          <input
            type="date"
            {...register('memory_date', { required: '날짜를 선택해주세요' })}
            className="w-full px-3 py-2 border rounded-md"
          />
          {errors.memory_date && (
            <p className="text-red-500 text-sm mt-1">{errors.memory_date.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            사진/동영상 *
          </label>
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            {...register('files', { required: '파일을 선택해주세요' })}
            className="w-full px-3 py-2 border rounded-md"
          />
          {errors.files && (
            <p className="text-red-500 text-sm mt-1">{errors.files.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {uploading ? '업로드 중...' : '추억 추가하기'}
        </button>

        {uploading && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${uploadProgress}%` }}
            className="h-2 bg-primary rounded-full"
          />
        )}
      </form>
    </div>
  );
};

export default UploadPage;
