import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http, httpBlocking } from '@ulis/apis';
import { localDb } from './local-db';
import type {
  BookCategoryItem,
  BookPostItem,
  BookPostStatus,
  CategoryAxis,
  ReportItem,
  ReportStatusType,
  StudentUserItem,
} from './mock-data';
import { bookQueryKey } from './books';

export const adminQueryKey = {
  reports: () => ['admin', 'reports'] as const,
  posts: () => ['admin', 'book-posts'] as const,
  users: () => ['admin', 'users'] as const,
  categories: () => ['admin', 'book-categories'] as const,
};

export interface UpsertCategoryPayload {
  id?: number;
  code: string;
  name: string;
  subtitle: string;
  parentAxis: CategoryAxis;
  sortOrder: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export const useAdminReports = () =>
  useQuery({
    queryKey: adminQueryKey.reports(),
    queryFn: async (): Promise<ReportItem[]> => {
      try {
        const res = await http.post<{ data?: { content?: ReportItem[] } }>(
          '/admin/reports/search',
          { pageNumber: 1, pageSize: 50 },
        );
        if (Array.isArray(res.data?.data?.content)) return res.data.data.content;
      } catch {
        // Fallback local DB
      }
      return localDb.getReports();
    },
  });

export const useResolveReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: number;
      status: ReportStatusType;
    }): Promise<number> => {
      try {
        await httpBlocking.put(`/admin/reports/${id}/resolve`, { status });
      } catch {
        // Fallback local DB
      }
      const reports = localDb.getReports();
      const targetReport = reports.find((r) => r.id === id);
      const nextReports = reports.map((r) => (r.id === id ? { ...r, status } : r));
      localDb.saveReports(nextReports);

      // Nếu xử lý & khoá đối tượng (RESOLVED), khoá bài đăng hoặc tài khoản tương ứng
      if (status === 'RESOLVED' && targetReport) {
        if (targetReport.sourceType === 'POST') {
          const nextBooks = localDb
            .getBooks()
            .map((b) =>
              b.id === targetReport.targetId ? { ...b, status: 'BANNED' as BookPostStatus } : b,
            );
          localDb.saveBooks(nextBooks);
        } else if (targetReport.sourceType === 'USER') {
          const nextUsers = localDb
            .getUsers()
            .map((u) =>
              u.id === targetReport.targetId ? { ...u, status: 'BANNED' as const } : u,
            );
          localDb.saveUsers(nextUsers);
        }
      }
      return id;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKey.reports() });
      queryClient.invalidateQueries({ queryKey: adminQueryKey.posts() });
      queryClient.invalidateQueries({ queryKey: adminQueryKey.users() });
    },
  });
};

export const useAdminBookPosts = () =>
  useQuery({
    queryKey: adminQueryKey.posts(),
    queryFn: async (): Promise<BookPostItem[]> => {
      try {
        const res = await http.post<{ data?: { content?: BookPostItem[] } }>(
          '/admin/book-posts/search',
          { pageNumber: 1, pageSize: 50 },
        );
        if (Array.isArray(res.data?.data?.content)) return res.data.data.content;
      } catch {
        // Fallback local DB
      }
      return localDb.getBooks();
    },
  });

export const useAdminToggleBanPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number): Promise<number> => {
      try {
        await httpBlocking.put(`/admin/book-posts/${id}/ban`);
      } catch {
        // Fallback local DB
      }
      const next = localDb.getBooks().map((b) => {
        if (b.id !== id) return b;
        const nextStatus: BookPostStatus = b.status === 'BANNED' ? 'SELLING' : 'BANNED';
        return { ...b, status: nextStatus };
      });
      localDb.saveBooks(next);
      return id;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKey.posts() });
      queryClient.invalidateQueries({ queryKey: bookQueryKey.all });
    },
  });
};

export const useAdminUsers = () =>
  useQuery({
    queryKey: adminQueryKey.users(),
    queryFn: async (): Promise<StudentUserItem[]> => {
      try {
        const res = await http.post<{ data?: { content?: StudentUserItem[] } }>(
          '/admin/users/search',
          { pageNumber: 1, pageSize: 50 },
        );
        if (Array.isArray(res.data?.data?.content)) return res.data.data.content;
      } catch {
        // Fallback local DB
      }
      return localDb.getUsers();
    },
  });

export const useAdminToggleBanUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number): Promise<number> => {
      try {
        await httpBlocking.put(`/admin/users/${id}/ban`);
      } catch {
        // Fallback local DB
      }
      const next = localDb.getUsers().map((u) => {
        if (u.id !== id) return u;
        const nextStatus: StudentUserItem['status'] =
          u.status === 'BANNED' ? 'ACTIVE' : 'BANNED';
        return { ...u, status: nextStatus };
      });
      localDb.saveUsers(next);
      return id;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKey.users() });
    },
  });
};

export const useAdminCategories = () =>
  useQuery({
    queryKey: adminQueryKey.categories(),
    queryFn: async (): Promise<BookCategoryItem[]> => {
      try {
        const res = await http.get<{ data?: BookCategoryItem[] }>('/admin/book-categories');
        if (Array.isArray(res.data?.data)) return res.data.data;
      } catch {
        // Fallback local DB
      }
      return localDb.getCategories().filter((c) => c.status !== 'DELETED');
    },
  });

export const useAdminSaveCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpsertCategoryPayload): Promise<BookCategoryItem> => {
      try {
        if (payload.id) {
          const res = await httpBlocking.put<{ data?: BookCategoryItem }>(
            `/admin/book-categories/update/${payload.id}`,
            payload,
          );
          if (res.data?.data) return res.data.data;
        } else {
          const res = await httpBlocking.post<{ data?: BookCategoryItem }>(
            '/admin/book-categories/create',
            payload,
          );
          if (res.data?.data) return res.data.data;
        }
      } catch {
        // Fallback local DB
      }

      const list = localDb.getCategories();
      const cleanCode = payload.code.trim().toUpperCase();

      if (
        !payload.id &&
        list.some((c) => c.status !== 'DELETED' && c.code.toUpperCase() === cleanCode)
      ) {
        throw new Error(`DUPLICATE_CODE:${cleanCode}`);
      }

      if (payload.id) {
        let updatedItem: BookCategoryItem | null = null;
        const next = list.map((c) => {
          if (c.id !== payload.id) return c;
          updatedItem = {
            ...c,
            name: payload.name.trim(),
            subtitle: payload.subtitle.trim(),
            parentAxis: payload.parentAxis,
            sortOrder: Number(payload.sortOrder),
            status: payload.status,
            updatedAt: '19/11/2026',
          };
          return updatedItem;
        });
        localDb.saveCategories(next);
        return updatedItem ?? list[0];
      }

      const newId = Math.max(10, ...list.map((c) => c.id)) + 1;
      const newCat: BookCategoryItem = {
        id: newId,
        code: cleanCode,
        name: payload.name.trim(),
        subtitle: payload.subtitle.trim(),
        parentAxis: payload.parentAxis,
        bookCount: 0,
        sortOrder: Number(payload.sortOrder),
        status: payload.status,
        updatedAt: '19/11/2026',
      };
      localDb.saveCategories([...list, newCat]);
      return newCat;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKey.categories() });
      queryClient.invalidateQueries({ queryKey: bookQueryKey.categories() });
    },
  });
};

export const useAdminDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number): Promise<number> => {
      const list = localDb.getCategories();
      const target = list.find((c) => c.id === id);
      if (target && target.bookCount > 0) {
        throw new Error(`BOUND_BOOKS:${target.bookCount}`);
      }
      try {
        await httpBlocking.delete(`/admin/book-categories/delete/${id}`);
      } catch {
        // Fallback soft-delete (status = 'DELETED')
      }
      const next = list.map((c) => (c.id === id ? { ...c, status: 'DELETED' as const } : c));
      localDb.saveCategories(next);
      return id;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKey.categories() });
      queryClient.invalidateQueries({ queryKey: bookQueryKey.categories() });
    },
  });
};
