// Activity Log Types
export interface Activity {
  id: string;
  action: string;
  resourceTitle: string;
  createdAt: string;
  resourceType?: string;
  resourceId?: string;
  userId?: string;
}

// Album Types
export interface Album {
  id: string;
  name: string;
  coverImage?: string;
  isPublic: boolean;
  memories: number;
  createdAt: string;
  updatedAt: string;
}

// Trash Types
export interface TrashedItem {
  id: string;
  title: string;
  thumbnail?: string;
  deletedAt: string;
  permanentDeleteAt: string;
  type: 'memory' | 'album';
}

// Statistics Types
export interface StatCardProps {
  Icon: React.ElementType;
  title: string;
  value: string | number;
  color: string;
}

// HomePage Types
export interface RecentMemory {
  id: string;
  title: string;
  memory_date: string;
  media_files?: Array<{
    id: string;
    file_path: string;
    thumbnail_path?: string;
  }>;
}
