/**
 * 이미지 압축 및 리사이징 유틸리티
 */

interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

/**
 * 이미지 파일을 압축하고 리사이징합니다.
 */
export const compressImage = async (
  file: File,
  options: CompressOptions = {}
): Promise<{ file: File; dataUrl: string }> => {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.85,
    mimeType = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        // 캔버스 생성
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas context를 생성할 수 없습니다.'));
          return;
        }

        // 이미지 크기 계산
        let { width, height } = img;

        // 최대 크기 제한
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // 캔버스 크기 설정
        canvas.width = width;
        canvas.height = height;

        // 이미지 그리기
        ctx.drawImage(img, 0, 0, width, height);

        // 압축된 이미지 데이터 얻기
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('이미지 압축에 실패했습니다.'));
              return;
            }

            // 새 파일 생성
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, '') + '.jpg',
              { type: mimeType }
            );

            // DataURL도 생성
            const dataUrl = canvas.toDataURL(mimeType, quality);

            resolve({ file: compressedFile, dataUrl });
          },
          mimeType,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('이미지를 로드할 수 없습니다.'));
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('파일을 읽을 수 없습니다.'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * 썸네일 생성
 */
export const createThumbnail = async (
  file: File,
  size: number = 200
): Promise<{ file: File; dataUrl: string }> => {
  return compressImage(file, {
    maxWidth: size,
    maxHeight: size,
    quality: 0.7,
  });
};

/**
 * 썸네일 생성 (파일만 반환)
 */
export const generateThumbnail = async (
  file: File,
  maxSize: number = 200
): Promise<File> => {
  const result = await createThumbnail(file, maxSize);
  return result.file;
};

/**
 * 이미지 포맷 최적화
 */
export const optimizeImageFormat = async (file: File): Promise<File> => {
  // PNG나 BMP를 JPEG로 변환 (투명도가 필요없는 경우)
  if (file.type === 'image/png' || file.type === 'image/bmp') {
    const result = await compressImage(file, {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.9,
      mimeType: 'image/jpeg'
    });
    return result.file;
  }
  
  // JPEG는 품질만 최적화
  if (file.type === 'image/jpeg') {
    const result = await compressImage(file, {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.85,
      mimeType: 'image/jpeg'
    });
    return result.file;
  }
  
  // 기타 포맷은 그대로 반환
  return file;
};

/**
 * 파일 크기를 사람이 읽기 쉬운 형식으로 변환
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 이미지 파일인지 확인
 */
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

/**
 * 비디오 파일인지 확인
 */
export const isVideoFile = (file: File): boolean => {
  return file.type.startsWith('video/');
};

/**
 * 파일명을 안전하게 처리 (한글 지원)
 */
export const sanitizeFileName = (fileName: string): string => {
  // 원본 파일명에서 확장자 분리
  const lastDotIndex = fileName.lastIndexOf('.');
  const nameWithoutExt = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
  const fileExt = lastDotIndex > 0 ? fileName.substring(lastDotIndex + 1).toLowerCase() : 'bin';

  // 한글, 영문, 숫자, 하이픈, 언더스코어, 괄호만 허용하고 안전하지 않은 문자 제거
  const safeFileName = nameWithoutExt
    .replace(/[<>:"/\\|?*]/g, '') // Windows/Linux 금지 문자 제거
    .replace(/[\x00-\x1f\x80-\x9f]/g, '') // 제어 문자 제거
    .replace(/^\.+/, '') // 시작 부분의 점 제거
    .replace(/\.+$/, '') // 끝 부분의 점 제거
    .replace(/\s+/g, '-') // 연속된 공백을 하이픈으로 변경
    .trim() || `file-${Date.now()}`;

  return `${safeFileName}.${fileExt}`;
};

/**
 * 업로드용 파일명 생성 (한글 지원, URL 인코딩)
 */
export const generateSafeFileName = (file: File, memoryId: string): string => {
  const sanitizedName = sanitizeFileName(file.name);
  const timestamp = Date.now();

  // 파일명과 확장자 분리
  const lastDotIndex = sanitizedName.lastIndexOf('.');
  const nameWithoutExt = lastDotIndex > 0 ? sanitizedName.substring(0, lastDotIndex) : sanitizedName;
  const fileExt = lastDotIndex > 0 ? sanitizedName.substring(lastDotIndex + 1) : 'bin';

  // URL 인코딩하여 한글 파일명 안전하게 처리
  const encodedFileName = encodeURIComponent(nameWithoutExt);
  return `memories/${memoryId}/${timestamp}-${encodedFileName}.${fileExt}`;
};
