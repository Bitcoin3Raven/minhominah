// family-system.js - 가족 계정 시스템 관리
class FamilySystem {
    constructor() {
        this.currentFamily = null;
        this.currentRole = null;
        this.currentUser = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        
        try {
            // Supabase 클라이언트 확인
            if (!window.supabaseClient) {
                console.error('Supabase 클라이언트가 초기화되지 않았습니다.');
                this.showError('시스템 초기화 중입니다. 잠시 후 다시 시도해주세요.');
                return;
            }
            
            // 현재 사용자 정보 가져오기
            const { data: { user }, error: userError } = await window.supabaseClient.auth.getUser();
            if (userError || !user) {
                console.error('사용자 정보를 가져올 수 없습니다:', userError);
                // 로그인하지 않은 사용자를 위한 처리
                this.showNoAuthState();
                return;
            }
            
            this.currentUser = user;
            await this.checkFamilyMembership();
            this.setupEventListeners();
            this.initialized = true;
        } catch (error) {
            console.error('가족 시스템 초기화 실패:', error);
            this.showError('시스템 초기화에 실패했습니다.');
        }
    }

    async checkFamilyMembership() {
        try {
            // 로딩 상태 표시
            this.showLoadingState();

            const { data: membership, error } = await window.supabaseClient
                .from('family_members')
                .select(`
                    *,
                    family_id,
                    role,
                    joined_at
                `)
                .eq('user_id', this.currentUser.id)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116: no rows returned
                throw error;
            }

            if (membership) {
                // family_groups 정보를 별도로 조회
                const { data: familyGroup, error: familyError } = await window.supabaseClient
                    .from('family_groups')
                    .select('*')
                    .eq('id', membership.family_id)
                    .single();
                
                if (familyError) {
                    throw familyError;
                }
                
                this.currentFamily = familyGroup;
                this.currentRole = membership.role;
                this.displayFamilyInfo();
                this.showFamilyState();
            } else {
                this.showNoFamilyState();
            }
        } catch (error) {
            console.error('가족 멤버십 확인 실패:', error);
            this.showError('가족 정보를 불러올 수 없습니다.');
        }
    }

    setupEventListeners() {
        // 가족 만들기 폼
        const createForm = document.getElementById('createFamilyForm');
        if (createForm) {
            createForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const familyName = document.getElementById('newFamilyName').value;
                await this.createFamily(familyName);
            });
        }

        // 가족 참여하기 폼
        const joinForm = document.getElementById('joinFamilyForm');
        if (joinForm) {
            joinForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const inviteCode = document.getElementById('joinInviteCode').value.toUpperCase();
                await this.joinFamilyByCode(inviteCode);
            });
        }

        // 초대하기 폼
        const inviteForm = document.getElementById('inviteForm');
        if (inviteForm) {
            inviteForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('inviteEmail').value;
                const role = document.getElementById('inviteRole').value;
                await this.inviteFamilyMember(email, role);
            });
        }

        // URL에서 초대 토큰 확인
        const urlParams = new URLSearchParams(window.location.search);
        const inviteToken = urlParams.get('invite');
        if (inviteToken) {
            this.acceptInvitationByToken(inviteToken);
        }
    }

    async createFamily(familyName) {
        try {
            // 이미 가족이 있는지 확인
            if (this.currentFamily) {
                this.showError('이미 가족에 속해 있습니다.');
                return;
            }

            const { data: family, error } = await window.supabaseClient
                .from('family_groups')
                .insert({
                    name: familyName,
                    created_by: this.currentUser.id
                })
                .select()
                .single();

            if (error) throw error;

            // 생성 성공
            this.showSuccess('가족이 생성되었습니다!');
            closeModal('createFamilyModal');
            
            // 페이지 새로고침으로 상태 업데이트
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            console.error('가족 생성 실패:', error);
            this.showError('가족 생성에 실패했습니다.');
        }
    }

    async joinFamilyByCode(inviteCode) {
        try {
            // 초대 코드로 가족 찾기
            const { data: family, error: familyError } = await supabase
                .from('family_groups')
                .select('id')
                .eq('invitation_code', inviteCode)
                .single();

            if (familyError || !family) {
                this.showError('유효하지 않은 초대 코드입니다.');
                return;
            }

            // 이미 가족 구성원인지 확인
            const { data: existingMember } = await window.supabaseClient
                .from('family_members')
                .select('id')
                .eq('family_id', family.id)
                .eq('user_id', this.currentUser.id)
                .single();

            if (existingMember) {
                this.showError('이미 해당 가족의 구성원입니다.');
                return;
            }

            // 가족에 참여
            const { error: joinError } = await window.supabaseClient
                .from('family_members')
                .insert({
                    family_id: family.id,
                    user_id: this.currentUser.id,
                    role: 'family'
                });

            if (joinError) throw joinError;

            this.showSuccess('가족에 참여했습니다!');
            closeModal('joinFamilyModal');
            
            // 페이지 새로고침
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            console.error('가족 참여 실패:', error);
            this.showError('가족 참여에 실패했습니다.');
        }
    }

    async inviteFamilyMember(email, role) {
        try {
            if (!this.currentFamily) {
                this.showError('가족 정보가 없습니다.');
                return;
            }

            // 이메일 중복 확인
            const { data: existingInvite } = await window.supabaseClient
                .from('family_invitations')
                .select('id')
                .eq('family_id', this.currentFamily.id)
                .eq('email', email)
                .eq('status', 'pending')
                .single();

            if (existingInvite) {
                this.showError('이미 초대된 이메일입니다.');
                return;
            }

            // 초대 생성
            const { data: invitation, error } = await window.supabaseClient
                .from('family_invitations')
                .insert({
                    family_id: this.currentFamily.id,
                    email: email,
                    role: role,
                    invited_by: this.currentUser.id
                })
                .select()
                .single();

            if (error) throw error;

            // 초대 이메일 전송 (실제로는 Supabase Edge Function이나 별도 서비스 필요)
            this.showSuccess(`${email}로 초대 메일이 발송되었습니다.`);
            document.getElementById('inviteForm').reset();
            
            // 대기 중인 초대 목록 새로고침
            await this.loadPendingInvitations();
        } catch (error) {
            console.error('초대 실패:', error);
            this.showError('초대 메일 발송에 실패했습니다.');
        }
    }

    async acceptInvitationByToken(token) {
        try {
            // RPC 함수 호출
            const { data, error } = await window.supabaseClient
                .rpc('accept_family_invitation', { p_token: token });

            if (error) throw error;

            if (data) {
                this.showSuccess('가족에 참여했습니다!');
                // URL에서 토큰 제거
                window.history.replaceState({}, document.title, window.location.pathname);
                // 페이지 새로고침
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                this.showError('유효하지 않거나 만료된 초대입니다.');
            }
        } catch (error) {
            console.error('초대 수락 실패:', error);
            this.showError('초대 수락에 실패했습니다.');
        }
    }

    displayFamilyInfo() {
        if (!this.currentFamily) return;

        // 가족 정보 표시
        document.getElementById('familyName').textContent = this.currentFamily.name;
        document.getElementById('inviteCode').textContent = this.currentFamily.invitation_code;
        
        // 역할 표시
        const roleLabels = {
            'parent': '부모',
            'family': '가족',
            'viewer': '관람객'
        };
        const roleElement = document.getElementById('myRole');
        const roleLabel = roleLabels[this.currentRole] || this.currentRole;
        roleElement.innerHTML = `
            <span class="px-3 py-1 ${this.getRoleColorClass(this.currentRole)} rounded-full text-sm">
                ${roleLabel}
            </span>
        `;

        // 부모 권한 UI 표시
        if (this.currentRole === 'parent') {
            document.getElementById('inviteSection').classList.remove('hidden');
            document.getElementById('pendingInvitesSection').classList.remove('hidden');
            this.loadPendingInvitations();
        }

        // 가족 구성원 목록 로드
        this.loadFamilyMembers();
    }

    async loadFamilyMembers() {
        try {
            const { data: members, error } = await window.supabaseClient
                .from('family_members')
                .select(`
                    *,
                    profiles(*)
                `)
                .eq('family_id', this.currentFamily.id)
                .order('joined_at', { ascending: true });

            if (error) throw error;

            const membersList = document.getElementById('familyMembersList');
            if (!members || members.length === 0) {
                membersList.innerHTML = '<p class="text-gray-500 dark:text-gray-400">구성원이 없습니다.</p>';
                return;
            }

            membersList.innerHTML = members.map(member => {
                const isMe = member.user_id === this.currentUser.id;
                const canRemove = this.currentRole === 'parent' && !isMe && member.role !== 'parent';
                
                return `
                    <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-blue-400 flex items-center justify-center text-white font-bold">
                                ${(member.profiles?.full_name || member.profiles?.username || '?')[0].toUpperCase()}
                            </div>
                            <div>
                                <p class="font-semibold text-gray-800 dark:text-white">
                                    ${member.profiles?.full_name || member.profiles?.username || '알 수 없음'}
                                    ${isMe ? '<span class="text-sm text-gray-500">(나)</span>' : ''}
                                </p>
                                <p class="text-sm text-gray-500 dark:text-gray-400">
                                    ${this.getRoleLabel(member.role)}
                                </p>
                            </div>
                        </div>
                        ${canRemove ? `
                            <button onclick="familySystem.removeMember('${member.id}')" 
                                    class="text-red-500 hover:text-red-700 transition">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('가족 구성원 로드 실패:', error);
            this.showError('가족 구성원 정보를 불러올 수 없습니다.');
        }
    }

    async loadPendingInvitations() {
        try {
            const { data: invitations, error } = await window.supabaseClient
                .from('family_invitations')
                .select('*')
                .eq('family_id', this.currentFamily.id)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const invitesList = document.getElementById('pendingInvitesList');
            if (!invitations || invitations.length === 0) {
                invitesList.innerHTML = '<p class="text-gray-500 dark:text-gray-400">대기 중인 초대가 없습니다.</p>';
                return;
            }

            invitesList.innerHTML = invitations.map(invite => `
                <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                        <p class="font-semibold text-gray-800 dark:text-white">${invite.email}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            ${this.getRoleLabel(invite.role)} · 
                            ${new Date(invite.created_at).toLocaleDateString('ko-KR')}
                        </p>
                    </div>
                    <button onclick="familySystem.cancelInvitation('${invite.id}')" 
                            class="text-red-500 hover:text-red-700 transition">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('');
        } catch (error) {
            console.error('초대 목록 로드 실패:', error);
        }
    }

    async removeMember(memberId) {
        if (!confirm('정말로 이 구성원을 제거하시겠습니까?')) return;

        try {
            const { error } = await window.supabaseClient
                .from('family_members')
                .delete()
                .eq('id', memberId);

            if (error) throw error;

            this.showSuccess('구성원이 제거되었습니다.');
            await this.loadFamilyMembers();
        } catch (error) {
            console.error('구성원 제거 실패:', error);
            this.showError('구성원 제거에 실패했습니다.');
        }
    }

    async cancelInvitation(invitationId) {
        if (!confirm('이 초대를 취소하시겠습니까?')) return;

        try {
            const { error } = await window.supabaseClient
                .from('family_invitations')
                .update({ status: 'rejected' })
                .eq('id', invitationId);

            if (error) throw error;

            this.showSuccess('초대가 취소되었습니다.');
            await this.loadPendingInvitations();
        } catch (error) {
            console.error('초대 취소 실패:', error);
            this.showError('초대 취소에 실패했습니다.');
        }
    }

    getRoleLabel(role) {
        const labels = {
            'parent': '부모',
            'family': '가족',
            'viewer': '관람객'
        };
        return labels[role] || role;
    }

    getRoleColorClass(role) {
        const colors = {
            'parent': 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
            'family': 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
            'viewer': 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
        };
        return colors[role] || colors.viewer;
    }

    showLoadingState() {
        const loadingState = document.getElementById('loadingState');
        const noFamilyState = document.getElementById('noFamilyState');
        const familyState = document.getElementById('familyState');
        
        if (loadingState) loadingState.classList.remove('hidden');
        if (noFamilyState) noFamilyState.classList.add('hidden');
        if (familyState) familyState.classList.add('hidden');
    }

    showNoFamilyState() {
        const loadingState = document.getElementById('loadingState');
        const noFamilyState = document.getElementById('noFamilyState');
        const familyState = document.getElementById('familyState');
        
        if (loadingState) loadingState.classList.add('hidden');
        if (noFamilyState) noFamilyState.classList.remove('hidden');
        if (familyState) familyState.classList.add('hidden');
    }

    showFamilyState() {
        const loadingState = document.getElementById('loadingState');
        const noFamilyState = document.getElementById('noFamilyState');
        const familyState = document.getElementById('familyState');
        
        if (loadingState) loadingState.classList.add('hidden');
        if (noFamilyState) noFamilyState.classList.add('hidden');
        if (familyState) familyState.classList.remove('hidden');
    }

    showSuccess(message) {
        // 임시 알림 표시 (나중에 더 나은 토스트 메시지로 교체 가능)
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in';
        toast.innerHTML = `<i class="fas fa-check-circle mr-2"></i>${message}`;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('animate-slide-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    showError(message) {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in';
        toast.innerHTML = `<i class="fas fa-exclamation-circle mr-2"></i>${message}`;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('animate-slide-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    showNoAuthState() {
        // 로딩 상태 숨기기
        const loadingState = document.getElementById('loadingState');
        if (loadingState) {
            loadingState.classList.add('hidden');
        }
        
        // 로그인 필요 메시지 표시
        const familySettings = document.getElementById('familySettings');
        if (familySettings) {
            familySettings.innerHTML = `
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center" data-aos="fade-up">
                    <i class="fas fa-lock text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
                    <h2 class="text-2xl font-bold mb-4 text-gray-800 dark:text-white">로그인이 필요합니다</h2>
                    <p class="text-gray-600 dark:text-gray-400 mb-6">
                        가족 설정을 이용하려면 먼저 로그인해주세요.
                    </p>
                    <button onclick="showLoginForm()" 
                            class="px-6 py-3 bg-gradient-to-r from-pink-500 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg transition">
                        <i class="fas fa-sign-in-alt mr-2"></i>로그인하기
                    </button>
                </div>
            `;
        }
    }
}

// 전역 인스턴스 생성
const familySystem = new FamilySystem();

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', async () => {
    // Supabase 클라이언트가 초기화될 때까지 대기
    if (!window.supabaseClient) {
        await new Promise(resolve => {
            const checkInterval = setInterval(() => {
                if (window.supabaseClient) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        });
    }
    
    // 가족 시스템 초기화 (인증 확인은 init 메서드 내에서 처리)
    await familySystem.init();
});

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes slide-in {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slide-out {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .animate-slide-in {
        animation: slide-in 0.3s ease-out;
    }
    
    .animate-slide-out {
        animation: slide-out 0.3s ease-in;
    }
`;
document.head.appendChild(style);
