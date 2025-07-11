// tag-system.js의 supabase 관련 오류 수정

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
    // tag-system.js의 supabase를 supabaseClient로 변경
    if (typeof SmartTagSystem !== 'undefined') {
        const originalAddCustomTag = SmartTagSystem.prototype.addCustomTag;
        SmartTagSystem.prototype.addCustomTag = async function(tagName) {
            if (!window.supabaseClient) {
                console.error('Supabase 클라이언트가 초기화되지 않았습니다.');
                return;
            }
            
            // 기존 태그 확인
            const existing = this.allTags.find(
                tag => tag.name.toLowerCase() === tagName.toLowerCase()
            );
            
            if (existing) {
                this.toggleTag(existing.name);
                return;
            }
            
            // 새 태그 생성
            try {
                const { data, error } = await window.supabaseClient
                    .from('tags')
                    .insert({
                        name: tagName,
                        color: this.generateTagColor()
                    })
                    .select()
                    .single();
                    
                if (error) throw error;
                
                this.allTags.push(data);
                this.toggleTag(tagName);
                
            } catch (error) {
                console.error('태그 생성 실패:', error);
                alert('태그 생성에 실패했습니다.');
            }
        };
        
        // loadTags 메서드도 수정
        const originalLoadTags = SmartTagSystem.prototype.loadTags;
        SmartTagSystem.prototype.loadTags = async function() {
            if (!window.supabaseClient) {
                console.error('Supabase 클라이언트가 초기화되지 않았습니다.');
                return;
            }
            
            try {
                const { data, error } = await window.supabaseClient
                    .from('tags')
                    .select('*')
                    .order('name');
                    
                if (error) throw error;
                
                this.allTags = data || [];
                this.renderAllTags();
                
            } catch (error) {
                console.error('태그 로드 실패:', error);
            }
        };
    }
});

console.log('tag-system-fix.js loaded');