import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
  thumbnailSrc?: string;
}

const OptimizedImage = ({
  src,
  alt,
  className = '',
  loading = 'lazy',
  sizes,
  onLoad,
  onError,
  fallbackSrc = '/assets/images/placeholder.jpg',
  thumbnailSrc,
}: OptimizedImageProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(thumbnailSrc || src);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!thumbnailSrc) return;

    // Preload full resolution image
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setCurrentSrc(src);
      setImageLoaded(true);
    };
    img.onerror = () => {
      setImageError(true);
      setCurrentSrc(fallbackSrc);
    };
  }, [src, thumbnailSrc, fallbackSrc]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    onLoad?.();
  };

  const handleImageError = () => {
    setImageError(true);
    setCurrentSrc(fallbackSrc);
    onError?.();
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* 블러 효과를 위한 썸네일 */}
      {thumbnailSrc && !imageLoaded && (
        <img
          src={thumbnailSrc}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover blur-xl scale-110"
          aria-hidden="true"
        />
      )}
      
      {/* 메인 이미지 */}
      <motion.img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        className={`w-full h-full object-cover ${!imageLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        loading={loading}
        sizes={sizes}
        onLoad={handleImageLoad}
        onError={handleImageError}
        initial={{ opacity: 0 }}
        animate={{ opacity: imageLoaded ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
      
      {/* 로딩 인디케이터 */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;