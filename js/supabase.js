// Supabase 클라이언트 설정
// 주의: 실제 프로덕션에서는 환경변수를 사용하세요
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Supabase 클라이언트 초기화 (CDN 버전 사용)
let supabase;
if (window.supabase) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// 인증 관련 함수
const auth = {
    // 로그인
    async signIn(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('로그인 오류:', error);
            throw error;
        }
    },

    // 회원가입
    async signUp(email, password, fullName) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName
                    }
                }
            });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('회원가입 오류:', error);
            throw error;
        }
    },

    // 로그아웃
    async signOut() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
        } catch (error) {
            console.error('로그아웃 오류:', error);
            throw error;
        }
    },

    // 현재 사용자 가져오기
    async getCurrentUser() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            return user;
        } catch (error) {
            console.error('사용자 정보 가져오기 오류:', error);
            return null;
        }
    }
};

// 추억 관련 함수
const memories = {
    // 추억 목록 가져오기
    async getMemories(limit = 10, offset = 0) {
        try {
            const { data, error } = await supabase
                .from('memories')
                .select(`
                    *,
                    media_files(id, file_path, thumbnail_path, file_type),
                    memory_people(people(name)),
                    memory_tags(tags(name, color))
                `)
                .order('memory_date', { ascending: false })
                .range(offset, offset + limit - 1);
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('추억 목록 가져오기 오류:', error);
            return [];
        }
    },

    // 추억 생성
    async createMemory(memoryData) {
        try {
            const { data, error } = await supabase
                .from('memories')
                .insert([memoryData])
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('추억 생성 오류:', error);
            throw error;
        }
    },

    // 추억 상세 정보 가져오기
    async getMemoryById(id) {
        try {
            const { data, error } = await supabase
                .from('memories')
                .select(`
                    *,
                    media_files(*),
                    memory_people(people(*)),
                    memory_tags(tags(*)),
                    comments(*, profiles(full_name))
                `)
                .eq('id', id)
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('추억 상세 정보 가져오기 오류:', error);
            return null;
        }
    }
};

// 파일 업로드 관련 함수
const storage = {
    // 이미지 업로드
    async uploadImage(file, memoryId) {
        try {
            const fileName = `memories/${memoryId}/${Date.now()}-${file.name}`;
            const { data, error } = await supabase.storage
                .from('media')
                .upload(fileName, file);
            
            if (error) throw error;
            
            // 썸네일 생성 (클라이언트 사이드)
            const thumbnail = await this.createThumbnail(file);
            const thumbName = `thumbnails/${memoryId}/${Date.now()}-thumb-${file.name}`;
            
            await supabase.storage
                .from('media')
                .upload(thumbName, thumbnail);
            
            // 데이터베이스에 파일 정보 저장
            await supabase.from('media_files').insert({
                memory_id: memoryId,
                file_path: fileName,
                thumbnail_path: thumbName,
                file_type: 'image',
                file_size: file.size
            });
            
            return data;
        } catch (error) {
            console.error('이미지 업로드 오류:', error);
            throw error;
        }
    },

    // 썸네일 생성
    async createThumbnail(file, maxSize = 300) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > height) {
                        if (width > maxSize) {
                            height = height * (maxSize / width);
                            width = maxSize;
                        }
                    } else {
                        if (height > maxSize) {
                            width = width * (maxSize / height);
                            height = maxSize;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob(resolve, 'image/jpeg', 0.8);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    },

    // 파일 URL 가져오기
    getFileUrl(path) {
        const { data } = supabase.storage.from('media').getPublicUrl(path);
        return data.publicUrl;
    }
};

// 성장 기록 관련 함수
const growth = {
    // 성장 기록 가져오기
    async getGrowthRecords(personId) {
        try {
            const { data, error } = await supabase
                .from('growth_records')
                .select('*')
                .eq('person_id', personId)
                .order('record_date', { ascending: true });
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('성장 기록 가져오기 오류:', error);
            return [];
        }
    },

    // 성장 기록 추가
    async addGrowthRecord(record) {
        try {
            const { data, error } = await supabase
                .from('growth_records')
                .insert([record])
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('성장 기록 추가 오류:', error);
            throw error;
        }
    }
};

// 실시간 구독 관련 함수
const realtime = {
    // 추억 변경 사항 구독
    subscribeToMemories(callback) {
        return supabase
            .channel('memories_channel')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'memories' },
                callback
            )
            .subscribe();
    },

    // 댓글 변경 사항 구독
    subscribeToComments(memoryId, callback) {
        return supabase
            .channel(`comments_${memoryId}`)
            .on('postgres_changes',
                { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'comments',
                    filter: `memory_id=eq.${memoryId}`
                },
                callback
            )
            .subscribe();
    }
};

// 유틸리티 함수
const utils = {
    // 날짜 포맷팅
    formatDate(dateString) {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    },

    // 파일 크기 포맷팅
    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    },

    // 이미지 리사이징
    async resizeImage(file, maxWidth = 1920, quality = 0.8) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > maxWidth) {
                        height = height * (maxWidth / width);
                        width = maxWidth;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob(resolve, 'image/jpeg', quality);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }
};

// 전역 객체로 내보내기
window.minhominah = {
    auth,
    memories,
    storage,
    growth,
    realtime,
    utils
};
