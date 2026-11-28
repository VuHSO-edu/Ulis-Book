import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http, httpBlocking } from '@ulis/apis';
import { localDb } from './local-db';
import { useAuth } from '../store/useAuth';
import { bookQueryKey } from './books';
import { chatQueryKey } from './chat';
import type {
  BookPostItem,
  CartRecordItem,
  ChatMessageItem,
  FeedbackRecordItem,
  HeroLoopBannerItem,
  InvoiceItem,
  SystemAppearanceConfig,
} from './mock-data';

export const v2QueryKey = {
  cart: () => ['v2', 'cart'] as const,
  invoicesByConv: (conversationId: number) => ['v2', 'invoices', 'conv', conversationId] as const,
  myInvoices: () => ['v2', 'invoices', 'my'] as const,
  adminTransactions: () => ['v2', 'admin', 'transactions'] as const,
  appearance: () => ['v2', 'appearance'] as const,
};

// =============================================================================
// 1. GIỎ HÀNG GOM NHÓM THEO NGƯỜI BÁN (TASK-08)
// =============================================================================

export const useCartItems = () => {
  const isAuthenticated = useAuth((s) => s.isAuthenticated);
  return useQuery({
    queryKey: v2QueryKey.cart(),
    enabled: isAuthenticated,
    queryFn: async (): Promise<CartRecordItem[]> => {
      try {
        const res = await http.get<{ data?: CartRecordItem[] }>('/cart');
        if (Array.isArray(res.data?.data)) {
          return res.data.data;
        }
      } catch {
        // Fallback local DB
      }
      return localDb.getCart();
    },
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      book: BookPostItem;
      quantity?: number;
    }): Promise<CartRecordItem> => {
      const qty = payload.quantity ?? 1;
      try {
        const res = await httpBlocking.post<{ data?: CartRecordItem }>('/cart/add', {
          bookPostId: payload.book.id,
          quantity: qty,
        });
        if (res.data?.data) return res.data.data;
      } catch {
        // Fallback local DB
      }
      const cart = localDb.getCart();
      const existing = cart.find((c) => c.book.id === payload.book.id);
      if (existing) {
        const updated = cart.map((c) =>
          c.book.id === payload.book.id
            ? { ...c, quantity: Math.min(payload.book.quantity || 1, c.quantity + qty) }
            : c,
        );
        localDb.saveCart(updated);
        return updated.find((c) => c.book.id === payload.book.id)!;
      }
      const newItem: CartRecordItem = {
        id: Date.now(),
        quantity: qty,
        book: payload.book,
      };
      localDb.saveCart([newItem, ...cart]);
      return newItem;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: v2QueryKey.cart() });
    },
  });
};

export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bookPostId: number): Promise<number> => {
      try {
        await httpBlocking.delete(`/cart/${bookPostId}`);
      } catch {
        // Fallback local DB
      }
      const next = localDb.getCart().filter((c) => c.book.id !== bookPostId);
      localDb.saveCart(next);
      return bookPostId;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: v2QueryKey.cart() });
    },
  });
};

// =============================================================================
// 2. HÓA ĐƠN 4 BƯỚC TRONG CHAT, GỬI MAIL & NHẮC NHỞ TỐI ĐA 3 LẦN (TASK-01, TASK-02, TASK-03)
// =============================================================================

export interface CreateInvoicePayload {
  conversationId: number;
  sellerId: number;
  sellerName: string;
  sellerEmail: string;
  buyerId: number;
  buyerName: string;
  buyerEmail: string;
  meetLocation: string;
  meetTime: string;
  note: string;
  items: Array<{
    bookPostId: number;
    bookCode: string;
    bookTitle: string;
    courseCode: string;
    coverUrl: string;
    quantity: number;
    agreedPrice: number;
  }>;
}

export const useConversationInvoices = (conversationId: number) =>
  useQuery({
    queryKey: v2QueryKey.invoicesByConv(conversationId),
    enabled: conversationId > 0,
    queryFn: async (): Promise<InvoiceItem[]> => {
      try {
        const res = await http.get<{ data?: InvoiceItem[] }>(
          `/invoices/conversation/${conversationId}`,
        );
        if (Array.isArray(res.data?.data)) return res.data.data;
      } catch {
        // Fallback local DB
      }
      return localDb.getInvoices().filter((inv) => inv.conversationId === conversationId);
    },
  });

export const useMyInvoices = () =>
  useQuery({
    queryKey: v2QueryKey.myInvoices(),
    queryFn: async (): Promise<InvoiceItem[]> => {
      try {
        const res = await http.get<{ data?: InvoiceItem[] }>('/invoices/my');
        if (Array.isArray(res.data?.data)) return res.data.data;
      } catch {
        // Fallback local DB
      }
      return localDb.getInvoices();
    },
  });

export const useAdminTransactions = () =>
  useQuery({
    queryKey: v2QueryKey.adminTransactions(),
    queryFn: async (): Promise<InvoiceItem[]> => {
      try {
        const res = await http.post<{ data?: InvoiceItem[] }>('/admin/transactions/search', {
          pageNumber: 1,
          pageSize: 100,
        });
        if (Array.isArray(res.data?.data) && res.data.data.length > 0) {
          return res.data.data;
        }
      } catch {
        // Fallback local DB
      }
      return localDb.getInvoices();
    },
  });

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateInvoicePayload): Promise<InvoiceItem> => {
      try {
        const res = await httpBlocking.post<{ data?: InvoiceItem }>('/invoices/create', {
          conversationId: payload.conversationId,
          buyerId: payload.buyerId,
          meetLocation: payload.meetLocation,
          meetTime: payload.meetTime,
          note: payload.note,
          items: payload.items.map((i) => ({
            bookPostId: i.bookPostId,
            quantity: i.quantity,
            agreedPrice: i.agreedPrice,
          })),
        });
        if (res.data?.data) return res.data.data;
      } catch {
        // Fallback local DB
      }

      const allInvoices = localDb.getInvoices();
      const nextId = Math.max(900, ...allInvoices.map((i) => i.id)) + 1;
      const code = `INV-${String(nextId + 100).padStart(5, '0')}`;
      const totalAmount = payload.items.reduce(
        (sum, item) => sum + item.agreedPrice * item.quantity,
        0,
      );

      const newInvoice: InvoiceItem = {
        id: nextId,
        invoiceCode: code,
        conversationId: payload.conversationId,
        sellerId: payload.sellerId,
        sellerName: payload.sellerName,
        sellerEmail: payload.sellerEmail,
        sellerReputation: 5,
        buyerId: payload.buyerId,
        buyerName: payload.buyerName,
        buyerEmail: payload.buyerEmail,
        buyerReputation: 4,
        totalAmount,
        meetLocation: payload.meetLocation,
        meetTime: payload.meetTime,
        note: payload.note,
        status: 'CONFIRMED_BY_SELLER',
        reminderCount: 0,
        maxReminders: 3,
        lastReminderAt: null,
        createdAt: 'Vừa xong',
        completedAt: null,
        items: payload.items.map((i) => ({
          bookPostId: i.bookPostId,
          bookCode: i.bookCode,
          bookTitle: i.bookTitle,
          courseCode: i.courseCode,
          coverUrl: i.coverUrl,
          quantity: i.quantity,
          unitPrice: i.agreedPrice,
        })),
      };

      localDb.saveInvoices([newInvoice, ...allInvoices]);

      // Remove purchased books from cart
      const purchasedIds = new Set(payload.items.map((i) => i.bookPostId));
      localDb.saveCart(localDb.getCart().filter((c) => !purchasedIds.has(c.book.id)));

      // Append INVOICE_CARD message to chat stream
      const allMsgs = localDb.getMessages();
      const currentMsgs = allMsgs[payload.conversationId] ?? [];
      const summaryText = `🧾 [HÓA ĐƠN #${code}] Đã chốt ${payload.items.length} cuốn sách · Tổng: ${totalAmount.toLocaleString('vi-VN')} đ · Điểm hẹn: ${payload.meetLocation} (${payload.meetTime}). Đã gửi email xác nhận tới ${payload.buyerEmail}.`;
      const newMsg: ChatMessageItem = {
        id: Date.now(),
        conversationId: payload.conversationId,
        senderId: payload.sellerId,
        senderName: payload.sellerName,
        content: summaryText,
        createdAt: 'Vừa xong',
        isRead: true,
        messageType: 'INVOICE_CARD',
        invoiceId: newInvoice.id,
        invoicePayload: JSON.stringify(newInvoice),
      };
      allMsgs[payload.conversationId] = [...currentMsgs, newMsg];
      localDb.saveMessages(allMsgs);

      return newInvoice;
    },
    onSettled: (_d, _e, vars) => {
      queryClient.invalidateQueries({ queryKey: v2QueryKey.invoicesByConv(vars.conversationId) });
      queryClient.invalidateQueries({ queryKey: v2QueryKey.myInvoices() });
      queryClient.invalidateQueries({ queryKey: v2QueryKey.adminTransactions() });
      queryClient.invalidateQueries({ queryKey: v2QueryKey.cart() });
      queryClient.invalidateQueries({ queryKey: chatQueryKey.messages(vars.conversationId) });
      queryClient.invalidateQueries({ queryKey: chatQueryKey.conversations() });
    },
  });
};

export const useRemindInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invoice: InvoiceItem): Promise<InvoiceItem> => {
      if (invoice.reminderCount >= 3) {
        throw new Error('REMINDER_LIMIT_REACHED');
      }
      try {
        const res = await httpBlocking.post<{ data?: InvoiceItem }>(
          `/invoices/${invoice.id}/remind`,
        );
        if (res.data?.data) return res.data.data;
      } catch {
        // Fallback local DB
      }

      const nextCount = Math.min(3, invoice.reminderCount + 1);
      const updatedInv: InvoiceItem = {
        ...invoice,
        reminderCount: nextCount,
        lastReminderAt: 'Vừa xong',
      };
      const all = localDb
        .getInvoices()
        .map((inv) => (inv.id === invoice.id ? updatedInv : inv));
      localDb.saveInvoices(all);

      const allMsgs = localDb.getMessages();
      const current = allMsgs[invoice.conversationId] ?? [];
      const remindMsg: ChatMessageItem = {
        id: Date.now(),
        conversationId: invoice.conversationId,
        senderId: invoice.sellerId,
        senderName: invoice.sellerName,
        content: `🔔 [Nhắc nhở lần ${nextCount}/3] Bạn ${invoice.buyerName} ơi, vui lòng kiểm tra và bấm xác nhận hoàn tất cho Hóa đơn #${invoice.invoiceCode} nhé! (Đã gửi email nhắc nhở tới ${invoice.buyerEmail})`,
        createdAt: 'Vừa xong',
        isRead: false,
        messageType: 'INVOICE_REMINDER',
        invoiceId: invoice.id,
      };
      allMsgs[invoice.conversationId] = [...current, remindMsg];
      localDb.saveMessages(allMsgs);

      return updatedInv;
    },
    onSettled: (_d, _e, inv) => {
      queryClient.invalidateQueries({ queryKey: v2QueryKey.invoicesByConv(inv.conversationId) });
      queryClient.invalidateQueries({ queryKey: v2QueryKey.myInvoices() });
      queryClient.invalidateQueries({ queryKey: v2QueryKey.adminTransactions() });
      queryClient.invalidateQueries({ queryKey: chatQueryKey.messages(inv.conversationId) });
    },
  });
};

const adjustLocalReputation = (sellerId: number, buyerId: number, delta: number) => {
  const clamp = (s: number) => Math.max(1, Math.min(5, s));
  const users = localDb.getUsers().map((u) => {
    if (u.id === sellerId || u.id === buyerId) {
      return { ...u, reputationScore: clamp((u.reputationScore ?? 3) + delta) };
    }
    return u;
  });
  localDb.saveUsers(users);

  const books = localDb.getBooks().map((b) => {
    if (b.seller.id === sellerId || b.seller.id === buyerId) {
      return {
        ...b,
        seller: {
          ...b.seller,
          reputationScore: clamp((b.seller.reputationScore ?? 3) + delta),
        },
      };
    }
    return b;
  });
  localDb.saveBooks(books);

  const convs = localDb.getConversations().map((c) => {
    if (c.peerId === sellerId || c.peerId === buyerId) {
      return {
        ...c,
        peerReputationScore: clamp((c.peerReputationScore ?? 3) + delta),
      };
    }
    return c;
  });
  localDb.saveConversations(convs);
};

export const useCompleteInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invoice: InvoiceItem): Promise<InvoiceItem> => {
      try {
        const res = await httpBlocking.put<{ data?: InvoiceItem }>(
          `/invoices/${invoice.id}/complete`,
        );
        if (res.data?.data) return res.data.data;
      } catch {
        // Fallback local DB
      }

      const updated: InvoiceItem = {
        ...invoice,
        status: 'COMPLETED',
        completedAt: 'Vừa xong',
        sellerReputation: Math.min(5, (invoice.sellerReputation || 3) + 1),
        buyerReputation: Math.min(5, (invoice.buyerReputation || 3) + 1),
      };
      localDb.saveInvoices(
        localDb.getInvoices().map((inv) => (inv.id === invoice.id ? updated : inv)),
      );

      // Cộng +1 điểm uy tín (TASK-02)
      adjustLocalReputation(invoice.sellerId, invoice.buyerId, +1);

      // Trừ tồn kho sách, về 0 -> SOLD
      const books = localDb.getBooks().map((b) => {
        const traded = invoice.items.find((i) => i.bookPostId === b.id);
        if (!traded) return b;
        const remain = Math.max(0, b.quantity - traded.quantity);
        return {
          ...b,
          quantity: remain,
          status: remain === 0 ? ('SOLD' as const) : b.status,
        };
      });
      localDb.saveBooks(books);

      return updated;
    },
    onSettled: (_d, _e, inv) => {
      queryClient.invalidateQueries({ queryKey: v2QueryKey.invoicesByConv(inv.conversationId) });
      queryClient.invalidateQueries({ queryKey: v2QueryKey.myInvoices() });
      queryClient.invalidateQueries({ queryKey: v2QueryKey.adminTransactions() });
      queryClient.invalidateQueries({ queryKey: bookQueryKey.all });
      queryClient.invalidateQueries({ queryKey: chatQueryKey.conversations() });
    },
  });
};

export const useFailInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invoice: InvoiceItem): Promise<InvoiceItem> => {
      try {
        const res = await httpBlocking.put<{ data?: InvoiceItem }>(
          `/invoices/${invoice.id}/fail`,
        );
        if (res.data?.data) return res.data.data;
      } catch {
        // Fallback local DB
      }

      const updated: InvoiceItem = {
        ...invoice,
        status: 'FAILED',
        completedAt: 'Vừa xong',
        sellerReputation: Math.max(1, (invoice.sellerReputation || 3) - 1),
        buyerReputation: Math.max(1, (invoice.buyerReputation || 3) - 1),
      };
      localDb.saveInvoices(
        localDb.getInvoices().map((inv) => (inv.id === invoice.id ? updated : inv)),
      );

      // Trừ -1 điểm uy tín (TASK-02)
      adjustLocalReputation(invoice.sellerId, invoice.buyerId, -1);

      return updated;
    },
    onSettled: (_d, _e, inv) => {
      queryClient.invalidateQueries({ queryKey: v2QueryKey.invoicesByConv(inv.conversationId) });
      queryClient.invalidateQueries({ queryKey: v2QueryKey.myInvoices() });
      queryClient.invalidateQueries({ queryKey: v2QueryKey.adminTransactions() });
      queryClient.invalidateQueries({ queryKey: bookQueryKey.all });
      queryClient.invalidateQueries({ queryKey: chatQueryKey.conversations() });
    },
  });
};

// =============================================================================
// 3. ĐỔI MÀU NỀN HỆ THỐNG (TASK-04) & LOOP ẢNH HERO BANNER (TASK-05)
// =============================================================================

export const applyThemeCssVariables = (cfg: SystemAppearanceConfig) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (cfg.bgColor) {
    root.style.setProperty('--ulis-seashell', cfg.bgColor);
    root.style.setProperty('--ulis-bg', cfg.bgColor);
  }
  if (cfg.surfaceColor) {
    root.style.setProperty('--ulis-wheat', cfg.surfaceColor);
    root.style.setProperty('--ulis-surface-low', cfg.surfaceColor);
  }
  if (cfg.primaryColor) {
    root.style.setProperty('--ulis-french-blue', cfg.primaryColor);
    root.style.setProperty('--ulis-primary', cfg.primaryColor);
  }
};

export const useSystemAppearance = () =>
  useQuery({
    queryKey: v2QueryKey.appearance(),
    queryFn: async (): Promise<SystemAppearanceConfig> => {
      const localCfg = localDb.getAppearance();
      try {
        const res = await http.get<{ data?: Record<string, string> }>('/system-settings/public');
        const map = res.data?.data;
        if (map) {
          let banners: HeroLoopBannerItem[] = localCfg.heroBanners;
          if (map.HERO_LOOP_BANNERS_JSON) {
            try {
              const parsed = JSON.parse(map.HERO_LOOP_BANNERS_JSON);
              if (Array.isArray(parsed) && parsed.length > 0) {
                banners = parsed;
              }
            } catch {
              // ignore JSON parse error
            }
          }
          const merged: SystemAppearanceConfig = {
            ...localCfg,
            bgColor: map.APPEARANCE_BG_COLOR || localCfg.bgColor,
            surfaceColor: map.APPEARANCE_SURFACE_COLOR || localCfg.surfaceColor,
            primaryColor: map.APPEARANCE_PRIMARY_COLOR || localCfg.primaryColor,
            heroBanners: banners,
          };
          localDb.saveAppearance(merged);
          applyThemeCssVariables(merged);
          return merged;
        }
      } catch {
        // Fallback local DB
      }
      applyThemeCssVariables(localCfg);
      return localCfg;
    },
  });

export const useSaveSystemAppearance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cfg: SystemAppearanceConfig): Promise<SystemAppearanceConfig> => {
      localDb.saveAppearance(cfg);
      applyThemeCssVariables(cfg);
      try {
        await httpBlocking.post('/admin/system-settings/save', {
          APPEARANCE_BG_COLOR: cfg.bgColor,
          APPEARANCE_SURFACE_COLOR: cfg.surfaceColor,
          APPEARANCE_PRIMARY_COLOR: cfg.primaryColor,
          HERO_LOOP_BANNERS_JSON: JSON.stringify(cfg.heroBanners),
        });
      } catch {
        // Saved in localDb already
      }
      return cfg;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: v2QueryKey.appearance() });
    },
  });
};

// =============================================================================
// 4. FORM GÓP Ý CUỐI TRANG GỬI VỀ MAIL NEXTBOOK (TASK-09)
// =============================================================================

export const useSubmitFeedback = () =>
  useMutation({
    mutationFn: async (payload: {
      senderName: string;
      senderEmail: string;
      category: string;
      content: string;
    }): Promise<FeedbackRecordItem> => {
      try {
        const res = await httpBlocking.post<{ data?: FeedbackRecordItem }>(
          '/feedbacks/submit',
          payload,
        );
        if (res.data?.data) return res.data.data;
      } catch {
        // Fallback local DB
      }
      const list = localDb.getFeedbacks();
      const newRecord: FeedbackRecordItem = {
        id: Date.now(),
        senderName: payload.senderName.trim(),
        senderEmail: payload.senderEmail.trim(),
        category: payload.category,
        content: payload.content.trim(),
        createdAt: 'Vừa xong',
      };
      localDb.saveFeedbacks([newRecord, ...list]);
      return newRecord;
    },
  });
