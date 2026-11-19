import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http, httpBlocking } from '@ulis/apis';
import { localDb } from './local-db';
import type { BookCommentItem } from './mock-data';

export const commentQueryKey = {
  byPost: (postId: number) => ['comments', 'by-post', postId] as const,
};

export interface CreateCommentPayload {
  postId: number;
  content: string;
  authorName: string;
  authorEmail: string;
  userId: number;
  isSeller: boolean;
}

export interface UpdateCommentPayload {
  id: number;
  postId: number;
  content: string;
}

export const useCommentsByPost = (postId: number) =>
  useQuery({
    queryKey: commentQueryKey.byPost(postId),
    queryFn: async (): Promise<BookCommentItem[]> => {
      try {
        const res = await http.post<{ data?: { content?: BookCommentItem[] } }>(
          '/comments/by-post',
          { postId, pageNumber: 1, pageSize: 20 },
        );
        if (Array.isArray(res.data?.data?.content)) {
          return res.data.data.content;
        }
      } catch {
        // Fallback local DB
      }
      return localDb
        .getComments()
        .filter((c) => c.postId === postId)
        .sort((a, b) => b.id - a.id);
    },
  });

export const useCreateComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateCommentPayload): Promise<BookCommentItem> => {
      try {
        const res = await httpBlocking.post<{ data?: BookCommentItem }>('/comments/create', {
          postId: payload.postId,
          content: payload.content.trim(),
        });
        if (res.data?.data) return res.data.data;
      } catch {
        // Fallback local DB
      }
      const list = localDb.getComments();
      const newId = Math.max(10, ...list.map((c) => c.id)) + 1;
      const initials = payload.authorName
        .split(' ')
        .filter(Boolean)
        .slice(-2)
        .map((w) => w.charAt(0).toUpperCase())
        .join('');
      const item: BookCommentItem = {
        id: newId,
        postId: payload.postId,
        userId: payload.userId,
        authorName: payload.authorName,
        authorEmail: payload.authorEmail,
        authorCohort: 'Sinh viên ULIS - ĐHQGHN',
        authorInitials: initials || 'SV',
        isSeller: payload.isSeller,
        content: payload.content.trim(),
        createdAt: '19/11/2026 Vừa xong',
      };
      localDb.saveComments([item, ...list]);
      return item;
    },
    onSettled: (_d, _e, vars) => {
      queryClient.invalidateQueries({ queryKey: commentQueryKey.byPost(vars.postId) });
    },
  });
};

export const useUpdateComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateCommentPayload): Promise<number> => {
      try {
        await httpBlocking.put(`/comments/update/${payload.id}`, {
          content: payload.content.trim(),
        });
      } catch {
        // Fallback local DB
      }
      const next = localDb
        .getComments()
        .map((c) => (c.id === payload.id ? { ...c, content: payload.content.trim() } : c));
      localDb.saveComments(next);
      return payload.id;
    },
    onSettled: (_d, _e, vars) => {
      queryClient.invalidateQueries({ queryKey: commentQueryKey.byPost(vars.postId) });
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: number; postId: number }): Promise<number> => {
      try {
        await httpBlocking.delete(`/comments/delete/${id}`);
      } catch {
        // Fallback local DB
      }
      const next = localDb.getComments().filter((c) => c.id !== id);
      localDb.saveComments(next);
      return id;
    },
    onSettled: (_d, _e, vars) => {
      queryClient.invalidateQueries({ queryKey: commentQueryKey.byPost(vars.postId) });
    },
  });
};
