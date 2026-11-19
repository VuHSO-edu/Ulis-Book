import {
  INITIAL_BOOKS,
  INITIAL_CATEGORIES,
  INITIAL_COMMENTS,
  INITIAL_CONVERSATIONS,
  INITIAL_MESSAGES,
  INITIAL_REPORTS,
  INITIAL_USERS,
  type BookCategoryItem,
  type BookCommentItem,
  type BookPostItem,
  type ChatConversationItem,
  type ChatMessageItem,
  type ReportItem,
  type StudentUserItem,
} from './mock-data';

const KEYS = {
  BOOKS: 'ulis_books_db_v2',
  CATEGORIES: 'ulis_categories_db_v2',
  COMMENTS: 'ulis_comments_db_v2',
  CONVERSATIONS: 'ulis_conversations_db_v2',
  MESSAGES: 'ulis_messages_db_v2',
  REPORTS: 'ulis_reports_db_v2',
  USERS: 'ulis_users_db_v2',
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
};
