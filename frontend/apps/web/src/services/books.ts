import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http, httpBlocking } from '@ulis/apis';
import { normalizeFilterValues } from '@ulis/utils';
import { localDb } from './local-db';
import type { BookCategoryItem, BookPostItem, BookPostStatus } from './mock-data';
import type { SortMode } from '../store/useBookFilterStore';

/**
 * QueryKeys tách riêng theo vuhso-frontend-rules §5.
 */
export const bookQueryKey = {
  all: ['book-posts'] as const,
  search: (filters: Record<string, unknown>) => ['book-posts', 'search', filters] as const,
  detail: (id: number) => ['book-posts', 'detail', id] as const,
  myPosts: () => ['book-posts', 'my'] as const,
  categories: () => ['book-categories', 'public'] as const,
};

export interface BookSearchFilter {
  keyword?: string;
  facultyCode?: string;
  bookTypeCode?: string;
  onlyGiveaway?: boolean;
  minPrice?: number;
  maxPrice?: number;
  campusLocation?: string;
  sortBy?: SortMode;
  pageNumber?: number;
  pageSize?: number;
}

export interface UpsertBookPostPayload {
  id?: number;
  code: string;
  title: string;
  courseCode: string;
  bookTypeCode: string;
  facultyCode: string;
  isGiveaway: boolean;
  price: number;
  originalPrice: number;
  quantity: number;
  condition: string;
  campusLocation: string;
  description: string;
  coverUrl?: string;
  images?: string[];
}

export const useBookCategories = () =>
  useQuery({
    queryKey: bookQueryKey.categories(),
    queryFn: async (): Promise<BookCategoryItem[]> => {
      try {
        const res = await http.get<{ data?: BookCategoryItem[] }>('/book-categories');
        if (Array.isArray(res.data?.data) && res.data.data.length > 0) {
          return res.data.data;
        }
      } catch {
        // Fallback to local seeded ULIS taxonomy
      }
      return localDb.getCategories().filter((c) => c.status === 'ACTIVE');
    },
  });

export const useSearchBooks = (filters: BookSearchFilter) => {
  const cleaned: BookSearchFilter = {
    ...filters,
    facultyCode: filters.facultyCode === 'ALL' ? undefined : filters.facultyCode,
    bookTypeCode: filters.bookTypeCode === 'ALL' ? undefined : filters.bookTypeCode,
    campusLocation: filters.campusLocation === 'ALL' ? undefined : filters.campusLocation,
    onlyGiveaway: filters.onlyGiveaway ? true : undefined,
  };
  const normalized = normalizeFilterValues({ ...cleaned });
  return useQuery({
    queryKey: bookQueryKey.search(normalized),
    queryFn: async (): Promise<{ items: BookPostItem[]; total: number }> => {
      try {
        const res = await http.post<{ data?: { content?: BookPostItem[]; totalElements?: number } }>(
          '/book-posts/search',
          normalized,
        );
        if (Array.isArray(res.data?.data?.content)) {
          return {
            items: res.data.data.content,
            total: res.data.data.totalElements ?? res.data.data.content.length,
          };
        }
      } catch {
        // Fallback to local DB filtering
      }
      let list = localDb.getBooks().filter((b) => b.status === 'SELLING' || b.status === 'SOLD');
      if (filters.keyword && filters.keyword.trim()) {
        const kw = filters.keyword.trim().toLowerCase();
        list = list.filter(
          (b) =>
            b.title.toLowerCase().includes(kw) ||
            b.courseCode.toLowerCase().includes(kw) ||
            b.facultyName.toLowerCase().includes(kw) ||
            b.seller.fullName.toLowerCase().includes(kw),
        );
      }
      if (filters.facultyCode && filters.facultyCode !== 'ALL') {
        list = list.filter((b) => b.facultyCode === filters.facultyCode);
      }
      if (filters.bookTypeCode && filters.bookTypeCode !== 'ALL') {
        list = list.filter((b) => b.bookTypeCode === filters.bookTypeCode);
      }
      if (filters.onlyGiveaway) {
        list = list.filter((b) => b.isGiveaway || b.price === 0);
      }
      if (typeof filters.minPrice === 'number') {
        list = list.filter((b) => b.price >= filters.minPrice!);
      }
      if (typeof filters.maxPrice === 'number') {
        list = list.filter((b) => b.price <= filters.maxPrice!);
      }
      if (filters.campusLocation && filters.campusLocation !== 'ALL') {
        list = list.filter((b) => b.campusLocation === filters.campusLocation);
      }
      if (filters.sortBy === 'cheapest') {
        list = [...list].sort((a, b) => a.price - b.price);
      } else if (filters.sortBy === 'mostViewed') {
        list = [...list].sort((a, b) => b.viewCount - a.viewCount);
      } else {
        list = [...list].sort((a, b) => b.id - a.id);
      }
      return {
        items: list,
        total: list.length,
      };
    },
  });
};

export const useBookDetail = (id: number) =>
  useQuery({
    queryKey: bookQueryKey.detail(id),
    queryFn: async (): Promise<BookPostItem | null> => {
      try {
        const res = await http.get<{ data?: BookPostItem }>(`/book-posts/detail/${id}`);
        if (res.data?.data) return res.data.data;
      } catch {
        // Fallback to local DB
      }
      const books = localDb.getBooks();
      const found = books.find((b) => b.id === id);
      if (!found) return null;
      const updated = books.map((b) => (b.id === id ? { ...b, viewCount: b.viewCount + 1 } : b));
      localDb.saveBooks(updated);
      return { ...found, viewCount: found.viewCount + 1 };
    },
  });

export const useMyBookPosts = () =>
  useQuery({
    queryKey: bookQueryKey.myPosts(),
    queryFn: async (): Promise<BookPostItem[]> => {
      try {
        const res = await http.get<{ data?: BookPostItem[] }>('/book-posts/my');
        if (Array.isArray(res.data?.data)) return res.data.data;
      } catch {
        // Fallback to local DB
      }
      return localDb.getBooks().filter((b) => b.status !== 'BANNED');
    },
  });

export const useSaveBookPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpsertBookPostPayload): Promise<BookPostItem> => {
      try {
        if (payload.id) {
          const res = await httpBlocking.put<{ data?: BookPostItem }>(
            `/book-posts/update/${payload.id}`,
            payload,
          );
          if (res.data?.data) return res.data.data;
        } else {
          const res = await httpBlocking.post<{ data?: BookPostItem }>(
            '/book-posts/create',
            payload,
          );
          if (res.data?.data) return res.data.data;
        }
      } catch {
        // Fallback to local DB
      }

      const books = localDb.getBooks();
      const categories = localDb.getCategories();
      const cleanCode = payload.code.trim().toUpperCase();

      if (!payload.id && books.some((b) => b.code.toUpperCase() === cleanCode)) {
        throw new Error(`DUPLICATE_CODE:${cleanCode}`);
      }

      const facultyCat = categories.find((c) => c.code === payload.facultyCode);
      const typeCat = categories.find((c) => c.code === payload.bookTypeCode);
      const effectivePrice = payload.isGiveaway ? 0 : Number(payload.price || 0);
      const effectiveQty = Number(payload.quantity ?? 1);
      const autoStatus: BookPostStatus = effectiveQty <= 0 ? 'SOLD' : 'SELLING';
      const defaultCover =
        payload.coverUrl?.trim() ||
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80';

      if (payload.id) {
        let savedItem: BookPostItem | null = null;
        const next = books.map((b) => {
          if (b.id !== payload.id) return b;
          savedItem = {
            ...b,
            title: payload.title.trim(),
            courseCode: payload.courseCode.trim().toUpperCase(),
            bookTypeCode: payload.bookTypeCode,
            bookTypeName: typeCat?.name ?? b.bookTypeName,
            facultyCode: payload.facultyCode,
            facultyName: facultyCat?.name ?? b.facultyName,
            isGiveaway: payload.isGiveaway || effectivePrice === 0,
            price: effectivePrice,
            originalPrice: Number(payload.originalPrice || effectivePrice),
            quantity: effectiveQty,
            condition: payload.condition.trim(),
            conditionBadge: payload.condition.trim().slice(0, 28),
            campusLocation: payload.campusLocation,
            description: payload.description.trim(),
            coverUrl: defaultCover,
            images: payload.images?.length ? payload.images : [defaultCover],
            status: autoStatus,
          };
          return savedItem;
        });
        localDb.saveBooks(next);
        return savedItem ?? books[0];
      }

      const newId = Math.max(100, ...books.map((b) => b.id)) + 1;
      const newPost: BookPostItem = {
        id: newId,
        code: cleanCode,
        title: payload.title.trim(),
        courseCode: payload.courseCode.trim().toUpperCase(),
        bookTypeCode: payload.bookTypeCode,
        bookTypeName: typeCat?.name ?? 'Giáo trình bắt buộc',
        facultyCode: payload.facultyCode,
        facultyName: facultyCat?.name ?? 'Khoa Sư phạm Tiếng Anh',
        isGiveaway: payload.isGiveaway || effectivePrice === 0,
        price: effectivePrice,
        originalPrice: Number(payload.originalPrice || effectivePrice),
        quantity: effectiveQty,
        condition: payload.condition.trim(),
        conditionBadge: payload.condition.trim().slice(0, 28),
        campusLocation: payload.campusLocation,
        description: payload.description.trim(),
        coverUrl: defaultCover,
        images: payload.images?.length ? payload.images : [defaultCover],
        status: autoStatus,
        viewCount: 1,
        createdAt: '19/11/2026',
        expiredAt: '19/12/2026',
        seller: {
          id: 1,
          msv: '22040118',
          fullName: 'Nguyễn Văn An',
          email: 'an.nv@ulis.edu.vn',
          faculty: facultyCat?.name ?? 'Khoa Sư phạm Tiếng Anh',
          cohort: 'QH-2022 · ULIS',
          phone: '0987654321',
          avatarInitials: 'NA',
          avatarBg: '#dbe1ff',
        },
      };
      localDb.saveBooks([newPost, ...books]);
      return newPost;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: bookQueryKey.all });
    },
  });
};

export const useMarkBookSold = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number): Promise<number> => {
      try {
        await httpBlocking.post(`/book-posts/sold/${id}`);
      } catch {
        // Fallback to local DB
      }
      const next = localDb
        .getBooks()
        .map((b) => (b.id === id ? { ...b, status: 'SOLD' as BookPostStatus, quantity: 0 } : b));
      localDb.saveBooks(next);
      return id;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: bookQueryKey.all });
    },
  });
};

export const useDeleteBookPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number): Promise<number> => {
      try {
        await httpBlocking.delete(`/book-posts/delete/${id}`);
      } catch {
        // Fallback soft-delete (HIDDEN)
      }
      const next = localDb
        .getBooks()
        .map((b) => (b.id === id ? { ...b, status: 'HIDDEN' as BookPostStatus } : b));
      localDb.saveBooks(next);
      return id;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: bookQueryKey.all });
    },
  });
};
