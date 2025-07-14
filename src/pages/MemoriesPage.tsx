import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';

interface Memory {
  id: string;
  title: string;
  description: string | null;
  memory_date: string;
  created_at: string;
  media_files: MediaFile[];
}

interface MediaFile {
  id: string;
  file_path: string;
  thumbnail_path: string | null;
  file_type: 'image' | 'video';
}

const MemoriesPage = () => {
  const [selectedPerson, setSelectedPerson] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { data: memories, isLoading } = useQuery({
    queryKey: ['memories', selectedPerson, selectedTags],
    queryFn: async () => {
      let query = supabase
        .from('memories')
        .select(`
          *,
          media_files(*)
        `)
        .order('memory_date', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data as Memory[];
    },
  });

  const getMediaUrl = (path: string) => {
    const { data } = supabase.storage.from('media').getPublicUrl(path);
    return data.publicUrl;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">추억 갤러리</h1>
        
        <div className="flex gap-4 mb-6">
          <select
            value={selectedPerson}
            onChange={(e) => setSelectedPerson(e.target.value)}
            className="px-4 py-2 border rounded-md"
          >
            <option value="all">전체</option>
            <option value="minho">민호</option>
            <option value="mina">민아</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {memories?.map((memory, index) => (
          <motion.div
            key={memory.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-card rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
          >
            {memory.media_files[0] && (
              <div className="aspect-square overflow-hidden">
                <img
                  src={getMediaUrl(memory.media_files[0].thumbnail_path || memory.media_files[0].file_path)}
                  alt={memory.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
            
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">{memory.title}</h3>
              {memory.description && (
                <p className="text-muted-foreground text-sm mb-2">
                  {memory.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {new Date(memory.memory_date).toLocaleDateString('ko-KR')}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MemoriesPage;
