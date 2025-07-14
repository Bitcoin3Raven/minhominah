import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiHeart, FiMessageCircle, FiEdit2, FiTrash2, FiSend, FiX } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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

interface CommentItemProps {
  comment: Comment;
  memoryId: string;
  depth: number;
}

const CommentItem = ({ comment, memoryId, depth }: CommentItemProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [replyContent, setReplyContent] = useState('');

  const isAuthor = user?.id === comment.user_id;

  // 좋아요 토글 mutation
  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      if (comment.is_liked_by_current_user) {
        // 좋아요 취소
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', comment.id)
          .eq('user_id', user?.id || '');
        if (error) throw error;
      } else {
        // 좋아요 추가
        const { error } = await supabase
          .from('comment_likes')
          .insert({
            comment_id: comment.id,
            user_id: user?.id
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', memoryId] });
    }
  });

  // 댓글 수정 mutation
  const updateCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase
        .from('comments')
        .update({ content })
        .eq('id', comment.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', memoryId] });
      setIsEditing(false);
    }
  });

  // 댓글 삭제 mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', comment.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', memoryId] });
    }
  });

  // 답글 작성 mutation
  const createReplyMutation = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase
        .from('comments')
        .insert({
          memory_id: memoryId,
          user_id: user?.id,
          parent_comment_id: comment.id,
          content
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', memoryId] });
      setReplyContent('');
      setIsReplying(false);
    }
  });

  const handleEdit = () => {
    updateCommentMutation.mutate(editContent);
  };

  const handleDelete = () => {
    if (window.confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
      deleteCommentMutation.mutate();
    }
  };

  const handleReply = () => {
    if (replyContent.trim()) {
      createReplyMutation.mutate(replyContent);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      style={{ marginLeft: depth * 48 }}
      className="space-y-3"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <div className="flex space-x-3">
          <div className="flex-shrink-0">
            {comment.profiles.avatar_url ? (
              <img
                src={comment.profiles.avatar_url}
                alt={comment.profiles.username}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                {comment.profiles.username[0].toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {comment.profiles.full_name || comment.profiles.username}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                  {formatDistanceToNow(new Date(comment.created_at), {
                    addSuffix: true,
                    locale: ko
                  })}
                </span>
                {comment.is_edited && (
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                    (수정됨)
                  </span>
                )}
              </div>
              {isAuthor && !isEditing && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="mt-2 space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                  rows={3}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(comment.content);
                    }}
                    className="px-3 py-1 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleEdit}
                    className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    <FiSend className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-1 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {comment.content}
              </p>
            )}

            <div className="mt-3 flex items-center space-x-4">
              <button
                onClick={() => toggleLikeMutation.mutate()}
                className={`flex items-center space-x-1 ${
                  comment.is_liked_by_current_user
                    ? 'text-pink-600'
                    : 'text-gray-500 hover:text-pink-600'
                }`}
                disabled={!user}
              >
                <FiHeart
                  className={`w-4 h-4 ${
                    comment.is_liked_by_current_user ? 'fill-current' : ''
                  }`}
                />
                <span className="text-sm">{comment.like_count}</span>
              </button>
              {user && depth < 2 && (
                <button
                  onClick={() => setIsReplying(!isReplying)}
                  className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <FiMessageCircle className="w-4 h-4" />
                  <span className="text-sm">답글</span>
                </button>
              )}
            </div>

            {isReplying && (
              <div className="mt-3 space-y-2">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="답글을 작성해주세요..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                  rows={2}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setIsReplying(false);
                      setReplyContent('');
                    }}
                    className="px-3 py-1 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleReply}
                    disabled={!replyContent.trim()}
                    className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    답글 달기
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 답글 렌더링 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              memoryId={memoryId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default CommentItem;
