'use client';

import { useEffect, useState, useCallback } from 'react';
import { MessageSquare, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
} from '@/lib/api';
import { useSession } from '@/lib/session-context';
import { getAvatarInitial } from '@/lib/utils';
import type { CommentDto } from '@hew/shared';

interface CommentsSectionProps {
  postId: string;
}

export function CommentsSection({ postId }: CommentsSectionProps) {
  const { sessionId } = useSession();
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      const res = await getComments(postId, { page: 1, limit: 50 });
      setComments(res.data);
      setTotal(res.total);
    } catch {
      setComments([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      const newComment = await createComment(postId, { content: content.trim() });
      setComments((prev) => [newComment, ...prev]);
      setTotal((prev) => prev + 1);
      setContent('');
    } catch {
      // error
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (comment: CommentDto) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
    setMenuOpenId(null);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editContent.trim()) return;
    setSubmitting(true);
    try {
      const updated = await updateComment(postId, editingId, {
        content: editContent.trim(),
      });
      setComments((prev) =>
        prev.map((c) => (c.id === editingId ? updated : c))
      );
      setEditingId(null);
      setEditContent('');
    } catch {
      // error
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleDelete = async (commentId: string) => {
    setMenuOpenId(null);
    if (!confirm('ลบความคิดเห็น?')) return;
    try {
      await deleteComment(postId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch {
      // error
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
        <MessageSquare size={20} className="text-primary-600" />
        ความคิดเห็น ({total})
      </h2>

      {/* Comment form */}
      {sessionId && (
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="เขียนความคิดเห็น..."
            rows={3}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary-400"
            maxLength={2000}
          />
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              ส่งความคิดเห็น
            </button>
          </div>
        </form>
      )}

      {/* Comment list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl bg-gray-100"
            />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">
          ยังไม่มีความคิดเห็น
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="flex gap-3 rounded-xl bg-gray-50/50 p-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-sm font-bold text-white">
                {getAvatarInitial(comment.session?.displayName, comment.session?.avatarSeed)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">
                    {comment.session?.displayName || 'Anonymous'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(comment.createdAt).toLocaleDateString('th-TH', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {sessionId === comment.sessionId && (
                    <div className="relative ml-auto">
                      <button
                        type="button"
                        onClick={() =>
                          setMenuOpenId(menuOpenId === comment.id ? null : comment.id)
                        }
                        className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                      >
                        <MoreVertical size={16} />
                      </button>
                      {menuOpenId === comment.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setMenuOpenId(null)}
                          />
                          <div className="absolute right-0 top-full z-20 mt-1 w-32 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(comment)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Pencil size={14} />
                              แก้ไข
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(comment.id)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={14} />
                              ลบ
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
                {editingId === comment.id ? (
                  <div className="mt-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary-400"
                      maxLength={2000}
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        disabled={submitting}
                        className="rounded bg-primary-600 px-3 py-1 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                      >
                        บันทึก
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="rounded bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                    {comment.content}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
