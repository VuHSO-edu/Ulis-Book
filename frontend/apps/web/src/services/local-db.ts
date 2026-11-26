import {
  INITIAL_APPEARANCE,
  INITIAL_BOOKS,
  INITIAL_CART,
  INITIAL_CATEGORIES,
  INITIAL_COMMENTS,
  INITIAL_CONVERSATIONS,
  INITIAL_FEEDBACKS,
  INITIAL_INVOICES,
  INITIAL_MESSAGES,
  INITIAL_REPORTS,
  INITIAL_USERS,
  type BookCategoryItem,
  type BookCommentItem,
  type BookPostItem,
  type CartRecordItem,
  type ChatConversationItem,
  type ChatMessageItem,
  type FeedbackRecordItem,
  type InvoiceItem,
  type ReportItem,
  type StudentUserItem,
  type SystemAppearanceConfig,
} from './mock-data';

const KEYS = {
  BOOKS: 'ulis_books_db_v3',
  CATEGORIES: 'ulis_categories_db_v3',
  COMMENTS: 'ulis_comments_db_v3',
  CONVERSATIONS: 'ulis_conversations_db_v3',
  MESSAGES: 'ulis_messages_db_v3',
  REPORTS: 'ulis_reports_db_v3',
  USERS: 'ulis_users_db_v3',
  INVOICES: 'ulis_invoices_db_v3',
  CART: 'ulis_cart_db_v3',
  APPEARANCE: 'ulis_appearance_db_v3',
  FEEDBACKS: 'ulis_feedbacks_db_v3',
  POST_SEQ: 'ulis_post_seq_v3',
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, data: T): T {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }
  return data;
}

export const localDb = {
  getBooks: (): BookPostItem[] => readStorage(KEYS.BOOKS, INITIAL_BOOKS),
  saveBooks: (books: BookPostItem[]): BookPostItem[] => writeStorage(KEYS.BOOKS, books),

  getCategories: (): BookCategoryItem[] => readStorage(KEYS.CATEGORIES, INITIAL_CATEGORIES),
  saveCategories: (cats: BookCategoryItem[]): BookCategoryItem[] =>
    writeStorage(KEYS.CATEGORIES, cats),

  getComments: (): BookCommentItem[] => readStorage(KEYS.COMMENTS, INITIAL_COMMENTS),
  saveComments: (comments: BookCommentItem[]): BookCommentItem[] =>
    writeStorage(KEYS.COMMENTS, comments),

  getConversations: (): ChatConversationItem[] =>
    readStorage(KEYS.CONVERSATIONS, INITIAL_CONVERSATIONS),
  saveConversations: (convs: ChatConversationItem[]): ChatConversationItem[] =>
    writeStorage(KEYS.CONVERSATIONS, convs),

  getMessages: (): Record<number, ChatMessageItem[]> =>
    readStorage(KEYS.MESSAGES, INITIAL_MESSAGES),
  saveMessages: (msgs: Record<number, ChatMessageItem[]>): Record<number, ChatMessageItem[]> =>
    writeStorage(KEYS.MESSAGES, msgs),

  getReports: (): ReportItem[] => readStorage(KEYS.REPORTS, INITIAL_REPORTS),
  saveReports: (reports: ReportItem[]): ReportItem[] => writeStorage(KEYS.REPORTS, reports),

  getUsers: (): StudentUserItem[] => readStorage(KEYS.USERS, INITIAL_USERS),
  saveUsers: (users: StudentUserItem[]): StudentUserItem[] => writeStorage(KEYS.USERS, users),

  getInvoices: (): InvoiceItem[] => readStorage(KEYS.INVOICES, INITIAL_INVOICES),
  saveInvoices: (invoices: InvoiceItem[]): InvoiceItem[] => writeStorage(KEYS.INVOICES, invoices),

  getCart: (): CartRecordItem[] => readStorage(KEYS.CART, INITIAL_CART),
  saveCart: (cart: CartRecordItem[]): CartRecordItem[] => writeStorage(KEYS.CART, cart),

  getAppearance: (): SystemAppearanceConfig => readStorage(KEYS.APPEARANCE, INITIAL_APPEARANCE),
  saveAppearance: (cfg: SystemAppearanceConfig): SystemAppearanceConfig =>
    writeStorage(KEYS.APPEARANCE, cfg),

  getFeedbacks: (): FeedbackRecordItem[] => readStorage(KEYS.FEEDBACKS, INITIAL_FEEDBACKS),
  saveFeedbacks: (items: FeedbackRecordItem[]): FeedbackRecordItem[] =>
    writeStorage(KEYS.FEEDBACKS, items),

  nextBookSequenceCode: (): string => {
    const books = readStorage(KEYS.BOOKS, INITIAL_BOOKS);
    let maxNum = 100000;
    for (const b of books) {
      if (b.code?.toUpperCase().startsWith('NB-')) {
        const num = Number(b.code.slice(3));
        if (Number.isFinite(num) && num > maxNum) maxNum = num;
      }
    }
    const storedSeq = readStorage<number>(KEYS.POST_SEQ, 100008);
    const nextSeq = Math.max(maxNum, storedSeq) + 1;
    writeStorage(KEYS.POST_SEQ, nextSeq);
    return `NB-${String(nextSeq).padStart(6, '0')}`;
  },
};
