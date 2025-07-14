import { supabase } from './supabase';

export const testSupabaseConnection = async () => {
  console.log('Testing Supabase connection...');
  
  try {
    // 1. 연결 테스트
    const { data: testData, error: testError } = await supabase
      .from('memories')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('Connection test failed:', testError);
      console.error('Error details:', {
        message: testError.message,
        details: testError.details,
        hint: testError.hint,
        code: testError.code
      });
    } else {
      console.log('Connection test successful');
    }
    
    // profiles 테이블 구조 확인을 위한 특별한 테스트
    console.log('Testing profiles table...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profileError) {
      console.error('Profiles table error:', profileError);
      console.error('Full error object:', JSON.stringify(profileError, null, 2));
    } else {
      console.log('Profiles table columns:', profileData && profileData.length > 0 ? Object.keys(profileData[0]) : 'No data');
    }
    
    // 2. 현재 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Auth error:', userError);
    } else if (!user) {
      console.log('No authenticated user');
    } else {
      console.log('Current user:', user.email);
    }
    
    // 3. RLS 정책 테스트
    const tables = ['memories', 'media_files', 'people', 'tags', 'profiles'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.error(`Error accessing ${table}:`, error.message);
      } else {
        console.log(`✓ ${table} accessible (${data?.length || 0} records)`);
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
};

// 자동 실행
testSupabaseConnection();