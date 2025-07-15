// 민호민아 성장앨범: 댓글 시스템
// 생성 날짜: 2025-07-10
// 설명: 추억에 댓글을 남기고 실시간으로 업데이트하는 기능

// 전역 변수 (중복 선언 방지)
if (typeof currentMemoryId === 'undefined') {
    var currentMemoryId = null;
}
if (typeof commentSubscription === 'undefined') {
    var commentSubscription = null;
}

// 댓글 시스템 초기화
class CommentSystem {
    constructor() {
        this.currentUser = null;
        this.initializeEvents();
    }

    // 이벤트 리스너 초기화
    initializeEvents() {
        // 댓글 폼 제출 이벤트
        document.addEventListener('submit', async (e) => {
            if (e.target.id === 'commentForm') {
                e.preventDefault();
                await this.submitComment();
            }
        });

        // 댓글 좋아요 버튼 이벤트 (이벤트 위임)
        document.addEventListener('click', async (e) => {
            if (e.target.closest('.comment-like-btn')) {
                const btn = e.target.closest('.comment-like-btn');
                const commentId = btn.dataset.commentId;
                await this.toggleLike(commentId);
            }

            // 댓글 삭제 버튼
            if (e.target.closest('.comment-delete-btn')) {
                const btn = e.target.closest('.comment-delete-btn');
                const commentId = btn.dataset.commentId;
                await this.deleteComment(commentId);
            }

            // 댓글 수정 버튼
            if (e.target.closest('.comment-edit-btn')) {
                const btn = e.target.closest('.comment-edit-btn');
                const commentId = btn.dataset.commentId;
                this.enableCommentEdit(commentId);
            }

            // 대댓글 버튼
            if (e.target.closest('.comment-reply-btn')) {
                const btn = e.target.closest('.comment-reply-btn');
                const commentId = btn.dataset.commentId;
                this.showReplyForm(commentId);
            }
        });
    }

    // 현재 사용자 정보 가져오기
    async getCurrentUser() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            this.currentUser = profile;
        }
        return this.currentUser;
    }

    // 추억에 대한 댓글 로드
    async loadComments(memoryId) {
        try {
            currentMemoryId = memoryId;
            
            // 현재 사용자 정보 확인
            await this.getCurrentUser();

            // 댓글 트리 구조로 가져오기
            const { data, error } = await supabase
                .rpc('get_comments_tree', { p_memory_id: memoryId });

            if (error) throw error;

            const comments = data || [];
            this.renderComments(comments);

            // 실시간 구독 설정
            this.subscribeToComments(memoryId);

            return comments;
        } catch (error) {
            console.error('댓글 로드 오류:', error);
            this.showError('댓글을 불러오는 중 오류가 발생했습니다.');
            return [];
        }
    }

    // 댓글 렌더링
    renderComments(comments) {
        const container = document.getElementById('commentsContainer');
        if (!container) return;

        if (comments.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-comments text-4xl mb-2"></i>
                    <p>아직 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!</p>
                </div>
            `;
            return;
        }

        // 댓글을 트리 구조로 정렬
        const commentTree = this.buildCommentTree(comments);
        container.innerHTML = commentTree.map(comment => 
            this.renderComment(comment, comments)
        ).join('');
    }

    // 댓글 트리 구조 생성
    buildCommentTree(comments) {
        const rootComments = comments.filter(c => !c.parent_comment_id);
        return rootComments.sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
        );
    }

    // 개별 댓글 렌더링
    renderComment(comment, allComments, depth = 0) {
        const isOwner = this.currentUser && comment.user_id === this.currentUser.id;
        const replies = allComments.filter(c => c.parent_comment_id === comment.id);
        const createdAt = new Date(comment.created_at);
        const timeAgo = this.getTimeAgo(createdAt);

        return `
            <div class="comment-item ${depth > 0 ? 'ml-12' : ''} mb-4" data-comment-id="${comment.id}">
                <div class="flex gap-3">
                    <!-- 아바타 -->
                    <div class="flex-shrink-0">
                        ${comment.avatar_url ? 
                            `<img src="${comment.avatar_url}" alt="${comment.full_name}" class="w-10 h-10 rounded-full">` :
                            `<div class="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                                ${comment.full_name ? comment.full_name.charAt(0).toUpperCase() : 'U'}
                            </div>`
                        }
                    </div>
                    
                    <!-- 댓글 내용 -->
                    <div class="flex-1">
                        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <div class="flex items-center justify-between mb-2">
                                <div class="flex items-center gap-2">
                                    <span class="font-semibold text-gray-900 dark:text-white">
                                        ${comment.full_name || comment.username || '익명'}
                                    </span>
                                    <span class="text-sm text-gray-500 dark:text-gray-400">
                                        ${timeAgo}
                                        ${comment.is_edited ? '<i class="fas fa-pen text-xs ml-1"></i>' : ''}
                                    </span>
                                </div>
                                
                                <!-- 액션 버튼들 -->
                                <div class="flex items-center gap-2">
                                    ${isOwner ? `
                                        <button class="comment-edit-btn text-gray-500 hover:text-blue-600 transition"
                                                data-comment-id="${comment.id}">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="comment-delete-btn text-gray-500 hover:text-red-600 transition"
                                                data-comment-id="${comment.id}">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                            
                            <div class="comment-content text-gray-700 dark:text-gray-300">
                                ${comment.content}
                            </div>
                            
                            <!-- 좋아요 및 답글 버튼 -->
                            <div class="flex items-center gap-4 mt-3">
                                <button class="comment-like-btn flex items-center gap-1 text-sm ${comment.is_liked_by_current_user ? 'text-red-500' : 'text-gray-500'} hover:text-red-500 transition"
                                        data-comment-id="${comment.id}">
                                    <i class="fas fa-heart ${comment.is_liked_by_current_user ? '' : 'far'}"></i>
                                    <span>${comment.like_count || 0}</span>
                                </button>
                                
                                <button class="comment-reply-btn text-sm text-gray-500 hover:text-blue-600 transition"
                                        data-comment-id="${comment.id}">
                                    <i class="fas fa-reply mr-1"></i>
                                    답글
                                </button>
                            </div>
                        </div>
                        
                        <!-- 답글 폼 (숨김) -->
                        <div id="reply-form-${comment.id}" class="reply-form hidden mt-2"></div>
                        
                        <!-- 대댓글들 -->
                        ${replies.length > 0 ? 
                            `<div class="mt-4">
                                ${replies.map(reply => this.renderComment(reply, allComments, depth + 1)).join('')}
                            </div>` : ''
                        }
                    </div>
                </div>
            </div>
        `;
    }

    // 시간 표시 함수
    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        const intervals = {
            년: 31536000,
            개월: 2592000,
            일: 86400,
            시간: 3600,
            분: 60
        };
        
        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return `${interval}${unit} 전`;
            }
        }
        
        return '방금 전';
    }

    // 댓글 제출
    async submitComment(parentCommentId = null) {
        try {
            const content = parentCommentId ? 
                document.querySelector(`#reply-form-${parentCommentId} textarea`).value :
                document.getElementById('commentContent').value;

            if (!content.trim()) {
                this.showError('댓글 내용을 입력해주세요.');
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                this.showError('로그인이 필요합니다.');
                return;
            }

            const { data, error } = await supabase
                .from('comments')
                .insert({
                    memory_id: currentMemoryId,
                    user_id: user.id,
                    content: content.trim(),
                    parent_comment_id: parentCommentId
                })
                .select()
                .single();

            if (error) throw error;

            // 폼 초기화
            if (parentCommentId) {
                document.getElementById(`reply-form-${parentCommentId}`).classList.add('hidden');
            } else {
                document.getElementById('commentContent').value = '';
            }

            // 성공 메시지
            this.showSuccess('댓글이 등록되었습니다.');

            // 추억 소유자에게 알림 생성
            try {
                // 추억 정보 가져오기
                const { data: memory } = await supabase
                    .from('memories')
                    .select('created_by, title')
                    .eq('id', currentMemoryId)
                    .single();

                // 작성자가 추억 소유자가 아닌 경우에만 알림 생성
                if (memory && memory.created_by !== user.id) {
                    // 사용자 정보 가져오기
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('full_name')
                        .eq('id', user.id)
                        .single();

                    const commenterName = profile?.full_name || '누군가';
                    const memoryTitle = memory.title || '추억';

                    // 알림 생성 (Edge Function이 없으므로 직접 삽입)
                    await supabase
                        .from('notifications')
                        .insert({
                            user_id: memory.created_by,
                            type: 'comment',
                            title: `${commenterName}님이 댓글을 남겼습니다`,
                            message: `"${memoryTitle}"에 새로운 댓글이 있습니다.`,
                            related_item_id: data.id,
                            related_item_type: 'comment',
                            icon: 'comment'
                        });
                }

                // 대댓글인 경우 원댓글 작성자에게도 알림
                if (parentCommentId) {
                    const { data: parentComment } = await supabase
                        .from('comments')
                        .select('user_id')
                        .eq('id', parentCommentId)
                        .single();

                    if (parentComment && parentComment.user_id !== user.id) {
                        await supabase
                            .from('notifications')
                            .insert({
                                user_id: parentComment.user_id,
                                type: 'comment',
                                title: `${commenterName}님이 답글을 남겼습니다`,
                                message: `회원님의 댓글에 답글이 달렸습니다.`,
                                related_item_id: data.id,
                                related_item_type: 'comment',
                                icon: 'reply'
                            });
                    }
                }
            } catch (notifError) {
                console.error('알림 생성 실패:', notifError);
                // 알림 생성 실패는 무시하고 계속 진행
            }

        } catch (error) {
            console.error('댓글 등록 오류:', error);
            this.showError('댓글 등록 중 오류가 발생했습니다.');
        }
    }

    // 댓글 좋아요 토글
    async toggleLike(commentId) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                this.showError('로그인이 필요합니다.');
                return;
            }

            // 기존 좋아요 확인
            const { data: existingLike } = await supabase
                .from('comment_likes')
                .select('id')
                .eq('comment_id', commentId)
                .eq('user_id', user.id)
                .single();

            if (existingLike) {
                // 좋아요 취소
                const { error } = await supabase
                    .from('comment_likes')
                    .delete()
                    .eq('id', existingLike.id);
                
                if (error) throw error;
            } else {
                // 좋아요 추가
                const { error } = await supabase
                    .from('comment_likes')
                    .insert({
                        comment_id: commentId,
                        user_id: user.id
                    });
                
                if (error) throw error;
            }

        } catch (error) {
            console.error('좋아요 처리 오류:', error);
            this.showError('좋아요 처리 중 오류가 발생했습니다.');
        }
    }

    // 댓글 삭제
    async deleteComment(commentId) {
        if (!confirm('정말로 이 댓글을 삭제하시겠습니까?')) return;

        try {
            const { error } = await supabase
                .from('comments')
                .delete()
                .eq('id', commentId);

            if (error) throw error;

            this.showSuccess('댓글이 삭제되었습니다.');

        } catch (error) {
            console.error('댓글 삭제 오류:', error);
            this.showError('댓글 삭제 중 오류가 발생했습니다.');
        }
    }

    // 댓글 수정 활성화
    enableCommentEdit(commentId) {
        const commentItem = document.querySelector(`[data-comment-id="${commentId}"]`);
        const contentDiv = commentItem.querySelector('.comment-content');
        const currentContent = contentDiv.textContent.trim();

        contentDiv.innerHTML = `
            <textarea class="w-full p-2 border rounded-lg resize-none" rows="3">${currentContent}</textarea>
            <div class="flex gap-2 mt-2">
                <button onclick="commentSystem.saveCommentEdit('${commentId}')" 
                        class="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">
                    저장
                </button>
                <button onclick="commentSystem.cancelCommentEdit('${commentId}', '${currentContent.replace(/'/g, "\\'")}')" 
                        class="px-3 py-1 bg-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-400">
                    취소
                </button>
            </div>
        `;

        contentDiv.querySelector('textarea').focus();
    }

    // 댓글 수정 저장
    async saveCommentEdit(commentId) {
        const commentItem = document.querySelector(`[data-comment-id="${commentId}"]`);
        const textarea = commentItem.querySelector('textarea');
        const newContent = textarea.value.trim();

        if (!newContent) {
            this.showError('댓글 내용을 입력해주세요.');
            return;
        }

        try {
            const { error } = await supabase
                .from('comments')
                .update({ content: newContent })
                .eq('id', commentId);

            if (error) throw error;

            this.showSuccess('댓글이 수정되었습니다.');

        } catch (error) {
            console.error('댓글 수정 오류:', error);
            this.showError('댓글 수정 중 오류가 발생했습니다.');
        }
    }

    // 댓글 수정 취소
    cancelCommentEdit(commentId, originalContent) {
        const commentItem = document.querySelector(`[data-comment-id="${commentId}"]`);
        const contentDiv = commentItem.querySelector('.comment-content');
        contentDiv.textContent = originalContent;
    }

    // 답글 폼 표시
    showReplyForm(commentId) {
        const replyForm = document.getElementById(`reply-form-${commentId}`);
        
        if (replyForm.classList.contains('hidden')) {
            replyForm.classList.remove('hidden');
            replyForm.innerHTML = `
                <div class="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                    <textarea class="w-full p-2 border rounded-lg resize-none text-sm" 
                              rows="2" placeholder="답글을 입력하세요..."></textarea>
                    <div class="flex gap-2 mt-2">
                        <button onclick="commentSystem.submitComment('${commentId}')" 
                                class="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">
                            답글 달기
                        </button>
                        <button onclick="document.getElementById('reply-form-${commentId}').classList.add('hidden')" 
                                class="px-3 py-1 bg-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-400">
                            취소
                        </button>
                    </div>
                </div>
            `;
            replyForm.querySelector('textarea').focus();
        } else {
            replyForm.classList.add('hidden');
        }
    }

    // 실시간 댓글 구독
    subscribeToComments(memoryId) {
        // 기존 구독 해제
        if (commentSubscription) {
            commentSubscription.unsubscribe();
        }

        // 새 구독 설정
        commentSubscription = supabase
            .channel(`comments:${memoryId}`)
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'comments',
                    filter: `memory_id=eq.${memoryId}`
                },
                (payload) => {
                    console.log('댓글 변경 감지:', payload);
                    // 댓글 다시 로드
                    this.loadComments(memoryId);
                }
            )
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'comment_likes'
                },
                (payload) => {
                    console.log('좋아요 변경 감지:', payload);
                    // 댓글 다시 로드
                    this.loadComments(memoryId);
                }
            )
            .subscribe();
    }

    // 구독 해제
    unsubscribe() {
        if (commentSubscription) {
            commentSubscription.unsubscribe();
            commentSubscription = null;
        }
    }

    // 성공 메시지 표시
    showSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-up';
        toast.innerHTML = `
            <div class="flex items-center gap-2">
                <i class="fas fa-check-circle"></i>
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('animate-fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // 오류 메시지 표시
    showError(message) {
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-up';
        toast.innerHTML = `
            <div class="flex items-center gap-2">
                <i class="fas fa-exclamation-circle"></i>
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('animate-fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// 전역 인스턴스 생성
const commentSystem = new CommentSystem();

// 윈도우 언로드 시 구독 해제
window.addEventListener('beforeunload', () => {
    commentSystem.unsubscribe();
});

// Export for use in other modules
window.commentSystem = commentSystem;
