// 이미지 최적화 시스템
class ImageOptimizer {
    constructor() {
        this.maxWidth = 1920;
        this.maxHeight = 1080;
        this.quality = 0.85;
        this.thumbnailSize = 400;
        this.supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    }

    // 이미지 크기 조정 및 압축
    async optimizeImage(file, options = {}) {
        const {
            maxWidth = this.maxWidth,
            maxHeight = this.maxHeight,
            quality = this.quality,
            format = 'image/jpeg'
        } = options;

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => {
                    // 캔버스 생성
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // 크기 계산
                    let { width, height } = this.calculateDimensions(
                        img.width, 
                        img.height, 
                        maxWidth, 
                        maxHeight
                    );
                    
                    // 캔버스 크기 설정
                    canvas.width = width;
                    canvas.height = height;
                    
                    // 이미지 그리기
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Blob으로 변환
                    canvas.toBlob((blob) => {
                        if (blob) {
                            // 새 파일 객체 생성
                            const optimizedFile = new File([blob], file.name, {
                                type: format,
                                lastModified: Date.now()
                            });
                            
                            resolve({
                                file: optimizedFile,
                                originalSize: file.size,
                                optimizedSize: blob.size,
                                compressionRatio: ((file.size - blob.size) / file.size * 100).toFixed(2),
                                dimensions: { width, height }
                            });
                        } else {
                            reject(new Error('이미지 변환 실패'));
                        }
                    }, format, quality);
                };
                
                img.onerror = () => reject(new Error('이미지 로드 실패'));
                img.src = e.target.result;
            };
            
            reader.onerror = () => reject(new Error('파일 읽기 실패'));
            reader.readAsDataURL(file);
        });
    }

    // 썸네일 생성
    async createThumbnail(file, size = this.thumbnailSize) {
        return this.optimizeImage(file, {
            maxWidth: size,
            maxHeight: size,
            quality: 0.8
        });
    }

    // 크기 계산
    calculateDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
        let width = originalWidth;
        let height = originalHeight;
        
        // 비율 유지하며 크기 조정
        if (width > maxWidth || height > maxHeight) {
            const widthRatio = maxWidth / width;
            const heightRatio = maxHeight / height;
            const ratio = Math.min(widthRatio, heightRatio);
            
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
        }
        
        return { width, height };
    }

    // 여러 이미지 일괄 최적화
    async optimizeMultipleImages(files, onProgress) {
        const results = [];
        const totalFiles = files.length;
        
        for (let i = 0; i < totalFiles; i++) {
            const file = files[i];
            
            try {
                // 지원되는 형식인지 확인
                if (!this.supportedFormats.includes(file.type)) {
                    results.push({
                        success: false,
                        file: file,
                        error: '지원되지 않는 이미지 형식'
                    });
                    continue;
                }
                
                // 이미지 최적화
                const result = await this.optimizeImage(file);
                results.push({
                    success: true,
                    ...result
                });
                
                // 진행 상황 콜백
                if (onProgress) {
                    onProgress({
                        current: i + 1,
                        total: totalFiles,
                        percentage: ((i + 1) / totalFiles * 100).toFixed(0)
                    });
                }
            } catch (error) {
                results.push({
                    success: false,
                    file: file,
                    error: error.message
                });
            }
        }
        
        return results;
    }

    // 이미지 메타데이터 추출
    async extractMetadata(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => {
                    resolve({
                        width: img.width,
                        height: img.height,
                        aspectRatio: (img.width / img.height).toFixed(2),
                        size: file.size,
                        type: file.type,
                        name: file.name
                    });
                };
                
                img.onerror = () => resolve(null);
                img.src = e.target.result;
            };
            
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
        });
    }

    // Base64로 변환 (미리보기용)
    async toBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // 파일 크기 포맷팅
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// 전역 인스턴스 생성
window.imageOptimizer = new ImageOptimizer();

// add-memory.html에서 사용할 헬퍼 함수
async function optimizeMemoryImages(files) {
    const optimizer = window.imageOptimizer;
    const optimizedFiles = [];
    
    // 진행 상황 표시
    const progressContainer = document.createElement('div');
    progressContainer.className = 'image-optimization-progress';
    progressContainer.innerHTML = `
        <div class="text-sm text-gray-600 mb-2">이미지 최적화 중...</div>
        <div class="w-full bg-gray-200 rounded-full h-2">
            <div class="bg-blue-500 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
        </div>
        <div class="text-xs text-gray-500 mt-1">
            <span class="current">0</span> / <span class="total">${files.length}</span> 완료
        </div>
    `;
    
    // 업로드 영역에 진행 상황 추가
    const uploadArea = document.querySelector('.upload-area');
    if (uploadArea) {
        uploadArea.appendChild(progressContainer);
    }
    
    // 이미지 최적화 실행
    const results = await optimizer.optimizeMultipleImages(files, (progress) => {
        const progressBar = progressContainer.querySelector('.bg-blue-500');
        const currentSpan = progressContainer.querySelector('.current');
        
        progressBar.style.width = `${progress.percentage}%`;
        currentSpan.textContent = progress.current;
    });
    
    // 결과 처리
    let totalOriginalSize = 0;
    let totalOptimizedSize = 0;
    
    results.forEach(result => {
        if (result.success) {
            optimizedFiles.push(result.file);
            totalOriginalSize += result.originalSize;
            totalOptimizedSize += result.optimizedSize;
        }
    });
    
    // 최적화 결과 표시
    const compressionRatio = ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize * 100).toFixed(0);
    progressContainer.innerHTML = `
        <div class="text-sm text-green-600 font-medium">
            ✓ 최적화 완료!
        </div>
        <div class="text-xs text-gray-600 mt-1">
            ${optimizer.formatFileSize(totalOriginalSize)} → ${optimizer.formatFileSize(totalOptimizedSize)} 
            (${compressionRatio}% 절약)
        </div>
    `;
    
    // 3초 후 제거
    setTimeout(() => {
        progressContainer.remove();
    }, 3000);
    
    return optimizedFiles;
}

// Lazy loading을 위한 Intersection Observer
function setupLazyLoading() {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                
                // data-src에서 실제 src로 변경
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    
                    // 로드 완료 후 observer 해제
                    img.onload = () => {
                        img.classList.add('loaded');
                        observer.unobserve(img);
                    };
                }
            }
        });
    }, {
        rootMargin: '50px 0px',
        threshold: 0.01
    });
    
    // 모든 lazy-load 이미지 관찰
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
    
    return imageObserver;
}

// 페이지 로드 시 lazy loading 설정
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupLazyLoading);
} else {
    setupLazyLoading();
}