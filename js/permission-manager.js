// 사용자 권한 관리 시스템
class PermissionManager {
    constructor() {
        this.currentUserRole = null;
        this.currentUserId = null;
    }

    // 현재 사용자의 권한 정보 로드
    async loadUserPermissions() {
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (!user) return null;

            // profiles 테이블에서 역할 가져오기
            const { data: profile, error } = await supabaseClient
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (error || !profile) {
                console.error('프로필 로드 실패:', error);
                return null;
            }

            this.currentUserId = user.id;
            this.currentUserRole = profile.role;

            return {
                userId: user.id,
                role: profile.role
            };
        } catch (error) {
            console.error('권한 로드 실패:', error);
            return null;
        }
    }

    // 수정 권한 확인
    canEdit(memory) {
        if (!this.currentUserRole) return false;
        
        // parent는 모든 추억 수정 가능
        if (this.currentUserRole === 'parent') return true;
        
        // family는 모든 추억 수정 가능
        if (this.currentUserRole === 'family') return true;
        
        // viewer는 수정 불가
        return false;
    }

    // 삭제 권한 확인
    canDelete(memory) {
        if (!this.currentUserRole) return false;
        
        // parent는 모든 추억 삭제 가능
        if (this.currentUserRole === 'parent') return true;
        
        // family는 자신이 만든 추억만 삭제 가능
        if (this.currentUserRole === 'family') {
            return memory.created_by === this.currentUserId;
        }
        
        // viewer는 삭제 불가
        return false;
    }

    // 역할별 표시 이름
    getRoleDisplayName(role) {
        const roleNames = {
            'parent': '부모',
            'family': '가족',
            'viewer': '관람객'
        };
        return roleNames[role] || role;
    }

    // 권한에 따른 UI 업데이트
    updateUIByPermission() {
        // 추가 버튼 표시/숨기기
        const addButton = document.querySelector('a[href="add-memory.html"]');
        if (addButton) {
            if (this.currentUserRole === 'viewer') {
                addButton.style.display = 'none';
            } else {
                addButton.style.display = '';
            }
        }

        // 기타 권한 기반 UI 업데이트
        document.body.setAttribute('data-user-role', this.currentUserRole || 'guest');
    }
}

// 전역 인스턴스 생성
const permissionManager = new PermissionManager();

// 페이지 로드 시 권한 체크
document.addEventListener('DOMContentLoaded', async () => {
    await permissionManager.loadUserPermissions();
    permissionManager.updateUIByPermission();
});
