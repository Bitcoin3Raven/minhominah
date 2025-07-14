// watermark-manager.js - 워터마크 설정 관리

class WatermarkManager {
    constructor() {
        this.settings = {
            enabled: false,
            text: '© 민호민아 성장앨범',
            position: 'bottom_right',
            opacity: 0.7,
            font_size: 14,
            font_color: '#FFFFFF'
        };
        this.canvas = null;
        this.ctx = null;
    }

    // 워터마크 설정 로드
    async loadSettings() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            const { data: settings, error } = await supabase
                .from('watermark_settings')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (settings) {
                this.settings = {
                    enabled: settings.enabled,
                    text: settings.text,
                    position: settings.position,
                    opacity: settings.opacity,
                    font_size: settings.font_size,
                    font_color: settings.font_color
                };
                this.updateUI();
            }
        } catch (error) {
            console.error('Load watermark settings error:', error);
        }
    }

    // UI 업데이트
    updateUI() {
        document.getElementById('watermark-enabled').checked = this.settings.enabled;
        document.getElementById('watermark-text').value = this.settings.text;
        document.getElementById('watermark-position').value = this.settings.position;
        document.getElementById('watermark-opacity').value = this.settings.opacity;
        document.getElementById('watermark-opacity-value').textContent = Math.round(this.settings.opacity * 100) + '%';
        document.getElementById('watermark-font-size').value = this.settings.font_size;
        document.getElementById('watermark-font-color').value = this.settings.font_color;
        
        // 미리보기 업데이트
        this.updatePreview();
    }

    // 설정 저장
    async saveSettings() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            this.settings = {
                enabled: document.getElementById('watermark-enabled').checked,
                text: document.getElementById('watermark-text').value,
                position: document.getElementById('watermark-position').value,
                opacity: parseFloat(document.getElementById('watermark-opacity').value),
                font_size: parseInt(document.getElementById('watermark-font-size').value),
                font_color: document.getElementById('watermark-font-color').value
            };

            const { error } = await supabase
                .from('watermark_settings')
                .upsert({
                    user_id: user.id,
                    ...this.settings,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            showNotification(window.translations[currentLang].msg_watermark_saved, 'success');
            
            // 활동 로그
            await this.logActivity('update', 'watermark_settings', user.id, {
                settings: this.settings
            });

        } catch (error) {
            console.error('Save watermark settings error:', error);
            showNotification(window.translations[currentLang].msg_error, 'error');
        }
    }

    // 미리보기 업데이트
    updatePreview() {
        const preview = document.getElementById('watermark-preview');
        if (!preview) return;

        // 샘플 이미지 로드
        const img = new Image();
        img.onload = () => {
            this.canvas = document.createElement('canvas');
            this.canvas.width = preview.clientWidth;
            this.canvas.height = preview.clientHeight;
            this.ctx = this.canvas.getContext('2d');

            // 이미지 그리기
            this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);

            // 워터마크 추가
            if (this.settings.enabled) {
                this.applyWatermark();
            }

            // 미리보기에 표시
            preview.innerHTML = '';
            preview.appendChild(this.canvas);
        };
        img.src = '/assets/images/sample-photo.jpg';
    }

    // 워터마크 적용
    applyWatermark() {
        if (!this.ctx) return;

        // 폰트 설정
        this.ctx.font = `${this.settings.font_size}px Arial`;
        this.ctx.fillStyle = this.settings.font_color;
        this.ctx.globalAlpha = this.settings.opacity;

        // 텍스트 크기 측정
        const metrics = this.ctx.measureText(this.settings.text);
        const textWidth = metrics.width;
        const textHeight = this.settings.font_size;
        const padding = 10;

        // 위치 계산
        let x, y;
        switch (this.settings.position) {
            case 'top_left':
                x = padding;
                y = textHeight + padding;
                break;
            case 'top_right':
                x = this.canvas.width - textWidth - padding;
                y = textHeight + padding;
                break;
            case 'bottom_left':
                x = padding;
                y = this.canvas.height - padding;
                break;
            case 'bottom_right':
                x = this.canvas.width - textWidth - padding;
                y = this.canvas.height - padding;
                break;
            case 'center':
                x = (this.canvas.width - textWidth) / 2;
                y = (this.canvas.height + textHeight) / 2;
                break;
            default:
                x = this.canvas.width - textWidth - padding;
                y = this.canvas.height - padding;
        }

        // 그림자 효과
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 2;
        this.ctx.shadowOffsetX = 1;
        this.ctx.shadowOffsetY = 1;

        // 텍스트 그리기
        this.ctx.fillText(this.settings.text, x, y);

        // 알파값 복원
        this.ctx.globalAlpha = 1.0;
    }

    // 이미지에 워터마크 적용
    async applyToImage(imageFile) {
        if (!this.settings.enabled) {
            return imageFile;
        }

        return new Promise((resolve) => {
            const img = new Image();
            const reader = new FileReader();

            reader.onload = (e) => {
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');

                    // 원본 이미지 그리기
                    ctx.drawImage(img, 0, 0);

                    // 워터마크 설정 임시 저장
                    const tempCanvas = this.canvas;
                    const tempCtx = this.ctx;
                    
                    this.canvas = canvas;
                    this.ctx = ctx;
                    
                    // 워터마크 적용
                    this.applyWatermark();
                    
                    // 원래 캔버스 복원
                    this.canvas = tempCanvas;
                    this.ctx = tempCtx;

                    // Blob으로 변환
                    canvas.toBlob((blob) => {
                        const watermarkedFile = new File([blob], imageFile.name, {
                            type: imageFile.type,
                            lastModified: imageFile.lastModified
                        });
                        resolve(watermarkedFile);
                    }, imageFile.type);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(imageFile);
        });
    }

    // 활동 로그 기록
    async logActivity(action, resourceType, resourceId, details = null) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            await supabase
                .from('activity_logs')
                .insert({
                    user_id: user.id,
                    action: action,
                    resource_type: resourceType,
                    resource_id: resourceId,
                    details: details,
                    user_agent: navigator.userAgent
                });
        } catch (error) {
            console.error('Log activity error:', error);
        }
    }
}

// 전역 인스턴스 생성
window.watermarkManager = new WatermarkManager();
