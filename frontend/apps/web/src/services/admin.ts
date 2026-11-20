import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http, httpBlocking } from '@ulis/apis';
import type {
  BookCategoryItem,
  BookPostItem,
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

const formatIsoDate = (raw?: string): string => {
  if (!raw) return '—';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return raw;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const formatIsoTime = (raw?: string): string => {
  if (!raw) return '';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '';
  return d.toTimeString().slice(0, 8);
};

export const useAdminReports = () =>
  useQuery({
    queryKey: adminQueryKey.reports(),
    queryFn: async (): Promise<ReportItem[]> => {
      const res = await http.post<{ data?: { content?: Partial<ReportItem>[] } }>(
        '/admin/reports/search',
        { pageNumber: 1, pageSize: 50 },
      );
      const content = res.data?.data?.content;
      if (!Array.isArray(content)) return [];
      return content.map((r, idx) => ({
        id: r.id ?? idx + 1,
        reportCode: r.reportCode ?? `#RP-${8845 + (r.id ?? idx + 1)}`,
        sourceType: r.sourceType ?? 'POST',
        targetId: r.targetId ?? 0,
        targetTitle: r.targetTitle || '—',
        targetSubtitle: r.targetSubtitle || '',
        targetBadge: r.sourceType ?? 'POST',
        reasonType: r.reasonType ?? 'OTHER',
        reasonLabel: r.reasonLabel || (r.reasonType ?? ''),
        description: r.description || '',
        severity: r.severity ?? (r.reasonType === 'SCAM' ? 'HIGH' : 'MEDIUM'),
        reporterName: r.reporterName || '—',
        reporterEmail: r.reporterEmail || '',
        reporterMsv: r.reporterMsv || '',
        createdAt: formatIsoDate(r.createdAt),
        createdTime: r.createdTime || formatIsoTime(r.createdAt),
        status: r.status ?? 'PENDING',
      }));
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
      await httpBlocking.put(`/admin/reports/${id}/resolve`, { status });
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
      const res = await http.post<{ data?: { content?: Partial<BookPostItem>[] } }>(
        '/admin/book-posts/search',
        { pageNumber: 1, pageSize: 50 },
      );
      const content = res.data?.data?.content;
      if (!Array.isArray(content)) return [];
      return content.map((b, idx) => ({
        id: b.id ?? idx + 1,
        code: b.code || `BOOK_${String(b.id ?? idx + 1).padStart(4, '0')}`,
        courseCode: b.courseCode || '—',
        title: b.title || '—',
        facultyCode: b.facultyCode || '',
        facultyName: b.facultyName || '—',
        bookTypeCode: b.bookTypeCode || '',
        bookTypeName: b.bookTypeName || '',
        price: typeof b.price === 'number' ? b.price : 0,
        originalPrice: typeof b.originalPrice === 'number' ? b.originalPrice : 0,
        quantity: typeof b.quantity === 'number' ? b.quantity : 1,
        isGiveaway: Boolean(b.isGiveaway || b.price === 0),
        condition: b.condition ?? 'LIKE_NEW',
        conditionBadge: b.conditionBadge || 'Tốt',
        description: b.description || '',
        campusLocation: b.campusLocation || '—',
        coverUrl: b.coverUrl || '',
        images: b.images || [],
        viewCount: typeof b.viewCount === 'number' ? b.viewCount : 0,
        createdAt: formatIsoDate(b.createdAt),
        expiredAt: b.expiredAt || '—',
        status: b.status ?? 'SELLING',
        seller: b.seller ?? {
          id: 0,
          fullName: '—',
          msv: '—',
          email: '',
          phone: '',
          faculty: '',
          cohort: '',
          avatarInitials: 'U',
          avatarBg: '#eef2ff',
          rating: 5,
          completedTrades: 0,
          responseTime: '',
        },
      }));
    },
  });

export const useAdminToggleBanPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number): Promise<number> => {
      await httpBlocking.put(`/admin/book-posts/${id}/ban`);
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
      const res = await http.post<{
        data?: {
          content?: Array<
            Partial<StudentUserItem> & {
              role?: string;
              studentId?: string;
              facultyName?: string;
            }
          >;
        };
      }>('/admin/users/search', { pageNumber: 1, pageSize: 50 });
      const content = res.data?.data?.content;
      if (!Array.isArray(content)) return [];
      return content.map((u, idx) => {
        const isAdminAcc =
          u.role === 'ADMIN' || (u.email ?? '').toLowerCase().startsWith('admin');
        return {
          id: u.id ?? idx + 1,
          msv: u.msv || u.studentId || (isAdminAcc ? 'ADMIN' : '—'),
          fullName: u.fullName || '—',
          email: u.email || '—',
          phone: u.phone || '',
          faculty: u.faculty || u.facultyName || (isAdminAcc ? 'Quản trị hệ thống' : '—'),
          className: u.className || '',
          postCount: typeof u.postCount === 'number' ? u.postCount : 0,
          createdAt: formatIsoDate(u.createdAt),
          role: isAdminAcc ? 'ADMIN' : 'USER',
          status: (u.status as StudentUserItem['status']) || 'ACTIVE',
        };
      });
    },
  });

export const useAdminToggleBanUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number): Promise<number> => {
      await httpBlocking.put(`/admin/users/${id}/ban`);
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
      const res = await http.get<{ data?: Partial<BookCategoryItem>[] }>('/admin/book-categories');
      const data = res.data?.data;
      if (!Array.isArray(data)) return [];
      return data
        .filter((c) => c.status !== 'DELETED')
        .map((c, idx) => ({
          id: c.id ?? idx + 1,
          code: c.code ?? '',
          name: c.name ?? '',
          subtitle: c.subtitle ?? '',
          parentAxis: (c.parentAxis as CategoryAxis) ?? 'FACULTY',
          bookCount: typeof c.bookCount === 'number' ? c.bookCount : 0,
          sortOrder: typeof c.sortOrder === 'number' ? c.sortOrder : idx + 1,
          updatedAt: formatIsoDate(c.updatedAt),
          status: (c.status as BookCategoryItem['status']) ?? 'ACTIVE',
        }));
    },
  });

export const useAdminSaveCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpsertCategoryPayload): Promise<BookCategoryItem> => {
      if (payload.id) {
        const res = await httpBlocking.put<{ data?: BookCategoryItem }>(
          `/admin/book-categories/update/${payload.id}`,
          payload,
        );
        return res.data.data as BookCategoryItem;
      }
      const res = await httpBlocking.post<{ data?: BookCategoryItem }>(
        '/admin/book-categories/create',
        payload,
      );
      return res.data.data as BookCategoryItem;
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
      await httpBlocking.delete(`/admin/book-categories/delete/${id}`);
      return id;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKey.categories() });
      queryClient.invalidateQueries({ queryKey: bookQueryKey.categories() });
    },
  });
};
