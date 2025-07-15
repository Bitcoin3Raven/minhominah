export interface Memory {
  id: string;
  title: string;
  description: string | null;
  memory_date: string;
  created_at: string;
  user_id: string;
  media_files: MediaFile[];
  memory_people: MemoryPerson[];
  memory_tags: MemoryTag[];
}

export interface ExtendedMemory extends Memory {
  memory_date: string;
}

export interface MediaFile {
  id: string;
  file_path: string;
  thumbnail_path: string | null;
  file_type: 'image' | 'video';
}

export interface MemoryPerson {
  people: {
    id: string;
    name: string;
  };
}

export interface MemoryTag {
  tags: {
    id: string;
    name: string;
  };
}
