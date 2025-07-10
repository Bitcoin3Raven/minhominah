// Supabase 데이터 액세스 헬퍼 함수들

// 최근 추억 가져오기
async function loadRecentMemories(limit = 10) {
    try {
        const { data, error } = await window.supabase
            .from('memories')
            .select(`
                *,
                media_files(*),
                memory_people(people(*)),
                memory_tags(tags(*))
            `)
            .order('memory_date', { ascending: false })
            .limit(limit);
            
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error loading memories:', error);
        return [];
    }
}

// 추억 상세 정보 가져오기
async function getMemoryDetail(memoryId) {
    try {
        const { data, error } = await window.supabase
            .from('memories')
            .select(`
                *,
                media_files(*),
                memory_people(people(*)),
                memory_tags(tags(*)),
                comments(*, profiles(*))
            `)
            .eq('id', memoryId)
            .single();
            
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error loading memory detail:', error);
        return null;
    }
}

// 새 추억 생성
async function createMemory(memoryData) {
    try {
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        
        const { data, error } = await window.supabase
            .from('memories')
            .insert({
                title: memoryData.title,
                description: memoryData.description,
                memory_date: memoryData.memory_date,
                location: memoryData.location,
                created_by: user.id
            })
            .select()
            .single();
            
        if (error) throw error;
        
        // 인물 연결
        if (memoryData.people && memoryData.people.length > 0) {
            const peopleConnections = memoryData.people.map(personId => ({
                memory_id: data.id,
                person_id: personId
            }));
            
            await window.supabase
                .from('memory_people')
                .insert(peopleConnections);
        }
        
        // 태그 연결
        if (memoryData.tags && memoryData.tags.length > 0) {
            const tagConnections = memoryData.tags.map(tagId => ({
                memory_id: data.id,
                tag_id: tagId
            }));
            
            await window.supabase
                .from('memory_tags')
                .insert(tagConnections);
        }
        
        return data;
    } catch (error) {
        console.error('Error creating memory:', error);
        throw error;
    }
}

// 파일 업로드
async function uploadFile(file, memoryId) {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${memoryId}/${Date.now()}.${fileExt}`;
        const filePath = `memories/${fileName}`;
        
        // 파일 업로드
        const { data, error } = await window.supabase.storage
            .from('media')
            .upload(filePath, file);
            
        if (error) throw error;
        
        // 파일 정보를 데이터베이스에 저장
        const { data: fileRecord, error: dbError } = await window.supabase
            .from('media_files')
            .insert({
                memory_id: memoryId,
                file_path: filePath,
                file_type: file.type.startsWith('image/') ? 'image' : 'video',
                file_size: file.size
            })
            .select()
            .single();
            
        if (dbError) throw dbError;
        
        return fileRecord;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
}

// 파일 URL 가져오기
function getFileUrl(filePath) {
    if (!filePath) return '';
    
    // 이미 전체 URL인 경우
    if (filePath.startsWith('http')) return filePath;
    
    const { data } = window.supabase.storage
        .from('media')
        .getPublicUrl(filePath);
        
    return data.publicUrl;
}

// 사용자 프로필 가져오기
async function getUserProfile(userId) {
    try {
        const { data, error } = await window.supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
            
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error loading user profile:', error);
        return null;
    }
}

// 현재 사용자 프로필 생성/업데이트
async function upsertUserProfile(profileData) {
    try {
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        
        const { data, error } = await window.supabase
            .from('profiles')
            .upsert({
                id: user.id,
                ...profileData,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();
            
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
}

// 성장 기록 추가
async function addGrowthRecord(recordData) {
    try {
        const { data, error } = await window.supabase
            .from('growth_records')
            .insert(recordData)
            .select()
            .single();
            
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error adding growth record:', error);
        throw error;
    }
}

// 댓글 추가
async function addComment(memoryId, content) {
    try {
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        
        const { data, error } = await window.supabase
            .from('comments')
            .insert({
                memory_id: memoryId,
                user_id: user.id,
                content: content
            })
            .select('*, profiles(*)')
            .single();
            
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error adding comment:', error);
        throw error;
    }
}

// 실시간 구독 설정
function subscribeToMemories(callback) {
    const subscription = window.supabase
        .channel('memories_channel')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'memories' },
            payload => {
                console.log('Memory change received:', payload);
                callback(payload);
            }
        )
        .subscribe();
        
    return subscription;
}

// 스토리지 헬퍼 객체
window.minhominah = {
    storage: {
        getFileUrl: getFileUrl
    },
    data: {
        loadRecentMemories,
        getMemoryDetail,
        createMemory,
        uploadFile,
        getUserProfile,
        upsertUserProfile,
        addGrowthRecord,
        addComment,
        subscribeToMemories
    }
};
