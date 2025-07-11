// Storage 디버깅 스크립트
// 콘솔에서 실행하여 문제를 파악하세요

async function debugStorage() {
    console.log('=== Storage 디버깅 시작 ===');
    
    // 1. 현재 사용자 확인
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    console.log('현재 사용자:', user?.email, user?.id);
    
    // 2. 버킷 정보 확인
    try {
        const { data: buckets, error } = await window.supabaseClient.storage.listBuckets();
        console.log('버킷 목록:', buckets);
        if (error) console.error('버킷 목록 에러:', error);
    } catch (e) {
        console.error('버킷 확인 실패:', e);
    }
    
    // 3. 테스트 파일 업로드
    const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    const testPath = `memories/${user?.id}/test-${Date.now()}.txt`;
    
    console.log('테스트 파일 경로:', testPath);
    
    try {
        const { data, error } = await window.supabaseClient.storage
            .from('media')
            .upload(testPath, testFile);
            
        if (error) {
            console.error('업로드 에러:', error);
        } else {
            console.log('업로드 성공:', data);
            
            // 업로드된 파일 삭제
            const { error: deleteError } = await window.supabaseClient.storage
                .from('media')
                .remove([testPath]);
                
            if (deleteError) {
                console.error('삭제 에러:', deleteError);
            } else {
                console.log('테스트 파일 삭제 완료');
            }
        }
    } catch (e) {
        console.error('테스트 업로드 실패:', e);
    }
    
    console.log('=== 디버깅 완료 ===');
}

// 페이지 로드 시 자동 실행 (선택사항)
if (window.supabaseClient) {
    debugStorage();
} else {
    console.log('Supabase 클라이언트가 준비되지 않았습니다. 나중에 debugStorage()를 실행하세요.');
}