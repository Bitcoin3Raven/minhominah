// Supabase 클라이언트 설정
// 주의: 실제 프로덕션에서는 환경변수를 사용하세요
const SUPABASE_URL = 'https://illwscrdeyncckltjrmr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsbHdzY3JkZXluY2NrbHRqcm1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODMxMTAsImV4cCI6MjA2NzU1OTExMH0.lBBWAA09Dro-2ckbUs1pQR9HzfeTsOZM4sFcK3J5RoQ';

// Supabase 클라이언트 초기화 (CDN 버전 사용)
let supabaseClient;
if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.supabaseClient = supabaseClient; // 전역 변수로 설정
}

// 인증 관련 함수
const auth = {
    // 로그인
    async signIn(email, password) {
        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
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
            const { data, error } = await supabaseClient.auth.signUp({
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
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;
        } catch (error) {
            console.error('로그아웃 오류:', error);
            throw error;
        }
    },

    // 현재 사용자 가져오기
    async getCurrentUser() {
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
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
            const { data, error } = await supabaseClient
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
            const { data, error } = await supabaseClient
                .from('memories')
                .insert(memoryData)
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('추억 생성 오류:', error);
            throw error;
        }
    }
};

// 파일 업로드 관련 함수
const storage = {
    // 이미지 업로드
    async uploadImage(file, path) {
        try {
            const { data, error } = await supabaseClient.storage
                .from('media')
                .upload(path, file);
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('이미지 업로드 오류:', error);
            throw error;
        }
    },

    // 공개 URL 가져오기
    getPublicUrl(path) {
        const { data } = supabaseClient.storage
            .from('media')
            .getPublicUrl(path);
        
        return data.publicUrl;
    }
};
