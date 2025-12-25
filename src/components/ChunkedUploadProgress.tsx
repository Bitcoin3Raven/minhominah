import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPause, FiPlay, FiX, FiUpload, FiWifi, FiWifiOff } from 'react-icons/fi';
import { formatFileSize } from '../utils/imageUtils';

interface ChunkedUploadProgressProps {
  fileName: string;
  fileSize: number;
  progress: number;
  bytesUploaded: number;
  bytesTotal: number;
  uploadSpeed: number;
  estimatedTime: number;
  isUploading: boolean;
  isPaused: boolean;
  error: string | null;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
}

export const ChunkedUploadProgress: React.FC<ChunkedUploadProgressProps> = ({
  fileName,
  fileSize,
  progress,
  bytesUploaded,
  bytesTotal,
  uploadSpeed,
  estimatedTime,
  isUploading,
  isPaused,
  error,
  onPause,
  onResume,
  onCancel,
}) => {
  const formatSpeed = (bytesPerSecond: number): string => {
    if (bytesPerSecond === 0) return '계산 중...';
    return `${formatFileSize(bytesPerSecond)}/s`;
  };

  const formatTime = (seconds: number): string => {
    if (seconds === 0 || !isFinite(seconds)) return '계산 중...';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) return `${hours}시간 ${minutes}분`;
    if (minutes > 0) return `${minutes}분 ${secs}초`;
    return `${secs}초`;
  };

  const getStatusColor = () => {
    if (error) return 'text-red-500';
    if (isPaused) return 'text-yellow-500';
    if (isUploading) return 'text-blue-500';
    if (progress === 100) return 'text-green-500';
    return 'text-gray-500';
  };

  const getStatusIcon = () => {
    if (error) return <FiWifiOff className="w-4 h-4" />;
    if (isPaused) return <FiPause className="w-4 h-4" />;
    if (isUploading) return <FiWifi className="w-4 h-4" />;
    if (progress === 100) return <FiUpload className="w-4 h-4" />;
    return <FiUpload className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (error) return `오류: ${error}`;
    if (isPaused) return '일시정지됨';
    if (isUploading) return '업로드 중...';
    if (progress === 100) return '업로드 완료!';
    return '대기 중';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700"
      >
        {/* 파일 정보 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${getStatusColor()} bg-current bg-opacity-10`}>
              {getStatusIcon()}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white truncate max-w-xs">
                {fileName}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatFileSize(fileSize)}
              </p>
            </div>
          </div>

          {/* 컨트롤 버튼 */}
          <div className="flex items-center space-x-2">
            {(isUploading || isPaused) && (
              <>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={isPaused ? onResume : onPause}
                  className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
                  title={isPaused ? '재개' : '일시정지'}
                >
                  {isPaused ? <FiPlay className="w-4 h-4" /> : <FiPause className="w-4 h-4" />}
                </motion.button>
              </>
            )}

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onCancel}
              className="p-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
              title="취소"
            >
              <FiX className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* 진행률 바 */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {progress.toFixed(1)}%
            </span>
          </div>

          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`h-full rounded-full ${
                error
                  ? 'bg-red-500'
                  : isPaused
                  ? 'bg-yellow-500'
                  : isUploading
                  ? 'bg-blue-500'
                  : progress === 100
                  ? 'bg-green-500'
                  : 'bg-gray-400'
              }`}
            />
          </div>
        </div>

        {/* 상세 정보 */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 dark:text-gray-400">업로드됨</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {formatFileSize(bytesUploaded)} / {formatFileSize(bytesTotal)}
            </p>
          </div>

          {isUploading && (
            <>
              <div>
                <p className="text-gray-500 dark:text-gray-400">속도</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {formatSpeed(uploadSpeed)}
                </p>
              </div>

              {estimatedTime > 0 && (
                <div className="col-span-2">
                  <p className="text-gray-500 dark:text-gray-400">예상 남은 시간</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatTime(estimatedTime)}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* 에러 메시지 */}
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <p className="text-red-700 dark:text-red-300 text-sm">
              {error}
            </p>
            {isPaused && (
              <button
                onClick={onResume}
                className="mt-2 text-xs text-red-600 dark:text-red-400 hover:underline"
              >
                다시 시도
              </button>
            )}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};