import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHeart, FiMessageCircle, FiEdit2, FiTrash2, FiSend } from 'react-icons/fi';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import CommentItem from './CommentItem';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Comment {
  id: string;
  memory_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  profiles: {
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
  like_count: number;
  is_liked_by_current_user: boolean;
  replies?: Comment[];
}

interface CommentSectionProps {
  memoryId: string;
}

const CommentSection = ({ memoryId }: CommentSectionProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 댓글 목록 조회
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', memoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          comment_likes(count)
        `)
        .eq('memory_id', memoryId)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 각 댓글에 대한 답글 조회
      const commentsWithReplies = await Promise.all(
        data.map(async (comment) => {
          const { data: replies } = await supabase
            .from('comments')
            .select(`
              *,
              comment_likes(count)
            `)
            .eq('parent_comment_id', comment.id)
            .order('created_at', { ascending: true });

          // 답글에도 사용자 정보 추가
          const repliesWithUserInfo = (replies || []).map(reply => ({
            ...reply,
            profiles: {
              username: 'User',
              full_name: 'User',
              avatar_url: null
            },
            like_count: reply.comment_likes?.[0]?.count || 0
          }));

          // 좋아요 여부 확인
          const { data: userLike } = await supabase
            .from('comment_likes')
            .select('id')
            .eq('comment_id', comment.id)
            .eq('user_id', user?.id || '')
            .single();

          return {
            ...comment,
            profiles: {
              username: 'User',
              full_name: 'User', 
              avatar_url: null
            },
            like_count: comment.comment_likes?.[0]?.count || 0,
            is_liked_by_current_user: !!userLike,
            replies: repliesWithUserInfo
          };
        })
      );

      return commentsWithReplies;
    },
    enabled: !!memoryId
  });

  // 댓글 작성 mutation
  const createCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          memory_id: memoryId,
          user_id: user?.id,
          content
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', memoryId] });
      setNewComment('');
    }
  });

  // 댓글 제출 핸들러
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setIsSubmitting(true);
    try {
      await createCommentMutation.mutateAsync(newComment);
    } catch (error) {
      console.error('댓글 작성 실패:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 실시간 구독 설정
  useEffect(() => {
    const channel = supabase
      .channel(`comments:${memoryId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `memory_id=eq.${memoryId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['comments', memoryId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [memoryId, queryClient]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
        댓글 {comments.length}개
      </h3>

      {/* 댓글 작성 폼 */}
      {user && (
        <form onSubmit={handleSubmitComment} className="space-y-4">
          <div className="flex space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                {user.email?.[0].toUpperCase()}
              </div>
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 작성해주세요..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                rows={3}
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={!newComment.trim() || isSubmitting}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <FiSend className="w-4 h-4" />
                  <span>등록</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* 댓글 목록 */}
      <div className="space-y-4">
        <AnimatePresence>
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              memoryId={memoryId}
              depth={0}
            />
          ))}
        </AnimatePresence>
      </div>

      {comments.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!
        </div>
      )}
    </div>
  );
};

export default CommentSection;
