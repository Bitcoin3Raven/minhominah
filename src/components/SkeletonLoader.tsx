import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  className?: string;
  height?: string;
  width?: string;
  rounded?: boolean;
}

export const SkeletonLoader = ({ 
  className = '', 
  height = 'h-4', 
  width = 'w-full',
  rounded = false 
}: SkeletonLoaderProps) => {
  return (
    <motion.div
      className={`bg-gray-200 dark:bg-gray-700 ${height} ${width} ${rounded ? 'rounded-full' : 'rounded'} ${className}`}
      animate={{
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  );
};

export const GrowthPageSkeleton = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-20 pb-12">
      <div className="container mx-auto px-4">
        {/* Header Skeleton */}
        <div className="text-center mb-8">
          <SkeletonLoader height="h-10" width="w-64" className="mx-auto mb-4" />
          <SkeletonLoader height="h-6" width="w-96" className="mx-auto" />
        </div>

        {/* Person Selector Skeleton */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="flex gap-4 justify-center">
            {[1, 2].map((i) => (
              <SkeletonLoader key={i} height="h-12" width="w-32" rounded />
            ))}
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="max-w-6xl mx-auto mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <SkeletonLoader height="h-12" width="w-12" rounded />
                <SkeletonLoader height="h-4" width="w-20" />
              </div>
              <SkeletonLoader height="h-8" width="w-24" className="mb-2" />
              <SkeletonLoader height="h-4" width="w-32" />
            </div>
          ))}
        </div>

        {/* Chart Skeleton */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <SkeletonLoader height="h-6" width="w-48" className="mb-4" />
            <SkeletonLoader height="h-64" width="w-full" />
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="max-w-6xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <SkeletonLoader height="h-6" width="w-48" />
              <SkeletonLoader height="h-10" width="w-32" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <SkeletonLoader key={i} height="h-12" width="w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};