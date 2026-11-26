/**
 * Dữ liệu mẫu chuẩn theo 8 màn hình Stitch "ULIS Books UI Prompts" (Project ID: 9978930103143929470).
 * Được sử dụng làm nguồn dữ liệu fallback khi backend API chưa bật các endpoint tương ứng,
 * đảm bảo toàn bộ tính năng CRUD / Search / Filter / Chat / Report / Admin hoạt động đầy đủ.
 */

export type BookPostStatus = 'SELLING' | 'SOLD' | 'HIDDEN' | 'EXPIRED' | 'BANNED';
export type CategoryAxis = 'BOOK_TYPE' | 'FACULTY' | 'CAMPUS_LOCATION';

export interface BookCategoryItem {
  id: number;
  code: string;
  name: string;
  subtitle: string;
  parentAxis: CategoryAxis;
  bookCount: number;
  sortOrder: number;
  status: 'ACTIVE' | 'INACTIVE' | 'DELETED';
  updatedAt: string;
}

export interface BookPostItem {
  id: number;
  code: string;
  title: string;
  courseCode: string;
  bookTypeCode: string;
  bookTypeName: string;
  facultyCode: string;
  facultyName: string;
  isGiveaway: boolean;
  price: number;
  originalPrice: number;
  quantity: number;
  condition: string;
  conditionBadge: string;
  campusLocation: string;
  description: string;
  coverUrl: string;
  images: string[];
  status: BookPostStatus;
  viewCount: number;
  createdAt: string;
  expiredAt: string;
  seller: {
    id: number;
    msv: string;
    fullName: string;
    email: string;
    faculty: string;
    cohort: string;
    phone: string;
    avatarInitials: string;
    avatarBg: string;
    reputationScore?: number;
  };
}

export interface BookCommentItem {
  id: number;
  postId: number;
  userId: number;
  authorName: string;
  authorEmail: string;
  authorCohort: string;
  authorInitials: string;
  isSeller: boolean;
  content: string;
  createdAt: string;
}

export interface ChatMessageItem {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  isAppointment?: boolean;
  messageType?: 'TEXT' | 'INVOICE_CARD' | 'INVOICE_REMINDER';
  invoiceId?: number;
  invoicePayload?: string;
}

export interface ChatConversationItem {
  id: number;
  peerId: number;
  peerName: string;
  peerEmail: string;
  peerMsv: string;
  peerFaculty: string;
  peerInitials: string;
  peerAvatarBg: string;
  peerReputationScore?: number;
  isOnline: boolean;
  unreadCount: number;
  lastMessage: string;
  lastMessageTime: string;
  isLastFromMe: boolean;
  contextBook: {
    postId: number;
    courseCode: string;
    title: string;
    price: number;
    isGiveaway: boolean;
    condition: string;
    campusLocation: string;
    coverUrl: string;
  };
}

export type ReportSourceType = 'POST' | 'USER' | 'COMMENT';
export type ReportStatusType = 'PENDING' | 'RESOLVED' | 'DISMISSED';
export type ReportReasonType = 'SPAM' | 'SCAM' | 'OFFENSIVE' | 'OTHER';

export interface ReportItem {
  id: number;
  reportCode: string;
  sourceType: ReportSourceType;
  targetId: number;
  targetTitle: string;
  targetSubtitle: string;
  targetBadge: string;
  reasonType: ReportReasonType;
  reasonLabel: string;
  description: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  reporterName: string;
  reporterEmail: string;
  reporterMsv: string;
  createdAt: string;
  createdTime: string;
  status: ReportStatusType;
}

export interface StudentUserItem {
  id: number;
  msv: string;
  fullName: string;
  email: string;
  faculty: string;
  className: string;
  phone: string;
  postCount: number;
  reputationScore?: number;
  createdAt: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
  role: 'USER' | 'ADMIN';
}

export type InvoiceStatusType = 'CONFIRMED_BY_SELLER' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface InvoiceLineItem {
  bookPostId: number;
  bookCode: string;
  bookTitle: string;
  courseCode: string;
  coverUrl: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceItem {
  id: number;
  invoiceCode: string;
  conversationId: number;
  sellerId: number;
  sellerName: string;
  sellerEmail: string;
  sellerReputation: number;
  buyerId: number;
  buyerName: string;
  buyerEmail: string;
  buyerReputation: number;
  totalAmount: number;
  meetLocation: string;
  meetTime: string;
  note: string;
  status: InvoiceStatusType;
  reminderCount: number;
  maxReminders: number;
  lastReminderAt?: string | null;
  createdAt: string;
  completedAt?: string | null;
  items: InvoiceLineItem[];
}

export interface CartRecordItem {
  id: number;
  quantity: number;
  book: BookPostItem;
}

export interface HeroLoopBannerItem {
  id: number;
  title: string;
  imageUrl: string;
  badgeText: string;
  sortOrder: number;
  active: boolean;
}

export interface SystemAppearanceConfig {
  bgColor: string;
  surfaceColor: string;
  primaryColor: string;
  presetName: string;
  domain: string;
  heroBanners: HeroLoopBannerItem[];
}

export interface FeedbackRecordItem {
  id: number;
  senderName: string;
  senderEmail: string;
  category: string;
  content: string;
  createdAt: string;
}

export const INITIAL_CATEGORIES: BookCategoryItem[] = [
  {
    id: 1,
    code: 'ENG_FACULTY',
    name: 'Khoa Sư phạm Tiếng Anh',
    subtitle: 'Faculty of English Language Teacher Education (FELTE)',
    parentAxis: 'FACULTY',
    bookCount: 412,
    sortOrder: 1,
    status: 'ACTIVE',
    updatedAt: '19/11/2026',
  },
  {
    id: 2,
    code: 'CHN_FACULTY',
    name: 'Khoa NN & VH Trung Quốc',
    subtitle: 'Faculty of Chinese Language and Culture',
    parentAxis: 'FACULTY',
    bookCount: 286,
    sortOrder: 2,
    status: 'ACTIVE',
    updatedAt: '18/11/2026',
  },
  {
    id: 3,
    code: 'JPN_FACULTY',
    name: 'Khoa NN & VH Nhật Bản',
    subtitle: 'Faculty of Japanese Language and Culture',
    parentAxis: 'FACULTY',
    bookCount: 245,
    sortOrder: 3,
    status: 'ACTIVE',
    updatedAt: '18/11/2026',
  },
  {
    id: 4,
    code: 'KOR_FACULTY',
    name: 'Khoa NN & VH Hàn Quốc',
    subtitle: 'Faculty of Korean Language and Culture',
    parentAxis: 'FACULTY',
    bookCount: 198,
    sortOrder: 4,
    status: 'ACTIVE',
    updatedAt: '17/11/2026',
  },
  {
    id: 5,
    code: 'FRA_FACULTY',
    name: 'Khoa NN & VH Pháp',
    subtitle: 'Faculty of French Language and Culture',
    parentAxis: 'FACULTY',
    bookCount: 84,
    sortOrder: 5,
    status: 'ACTIVE',
    updatedAt: '16/11/2026',
  },
  {
    id: 6,
    code: 'GER_FACULTY',
    name: 'Khoa NN & VH Đức',
    subtitle: 'Faculty of German Language and Culture',
    parentAxis: 'FACULTY',
    bookCount: 62,
    sortOrder: 6,
    status: 'ACTIVE',
    updatedAt: '15/11/2026',
  },
  {
    id: 7,
    code: 'TYPE_GIAOTRINH',
    name: 'Giáo trình bắt buộc',
    subtitle: 'Core Mandatory University Textbooks',
    parentAxis: 'BOOK_TYPE',
    bookCount: 620,
    sortOrder: 1,
    status: 'ACTIVE',
    updatedAt: '19/11/2026',
  },
  {
    id: 8,
    code: 'TYPE_BAITAP',
    name: 'Sách bài tập & Ngữ pháp',
    subtitle: 'Workbooks & Grammar Practice',
    parentAxis: 'BOOK_TYPE',
    bookCount: 280,
    sortOrder: 2,
    status: 'ACTIVE',
    updatedAt: '18/11/2026',
  },
  {
    id: 9,
    code: 'TYPE_LUYENTHI',
    name: 'Tài liệu ôn thi chứng chỉ',
    subtitle: 'IELTS, HSK, JLPT, TOPIK, DELF Exam Prep',
    parentAxis: 'BOOK_TYPE',
    bookCount: 235,
    sortOrder: 3,
    status: 'ACTIVE',
    updatedAt: '17/11/2026',
  },
  {
    id: 10,
    code: 'TYPE_TUDIEN',
    name: 'Từ điển & Sách tham khảo',
    subtitle: 'Dictionaries & Reference Materials',
    parentAxis: 'BOOK_TYPE',
    bookCount: 113,
    sortOrder: 4,
    status: 'ACTIVE',
    updatedAt: '14/11/2026',
  },
];

export const INITIAL_BOOKS: BookPostItem[] = [
  {
    id: 101,
    code: 'NB-100001',
    title: 'Academic Writing for Graduate Students B2 (3rd Edition)',
    courseCode: 'ENG2014',
    bookTypeCode: 'TYPE_GIAOTRINH',
    bookTypeName: 'Giáo trình bắt buộc',
    facultyCode: 'ENG_FACULTY',
    facultyName: 'Khoa Sư phạm Tiếng Anh',
    isGiveaway: false,
    price: 45000,
    originalPrice: 120000,
    quantity: 1,
    condition: 'Mới 95% - Bìa bọc plastic cẩn thận, không rách gáy',
    conditionBadge: 'Mới 95% · Đã bọc bìa',
    campusLocation: 'Toà A1 ULIS',
    description:
      'Giáo trình học phần Viết học thuật B2 của Khoa Sư phạm Tiếng Anh. Sách bản in màu rõ nét, mình mới học xong kỳ vừa rồi, đã bọc bìa kính cẩn thận và tặng kèm bộ đề cương ôn tập cuối kỳ đạt điểm A.',
    coverUrl:
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
    ],
    status: 'SELLING',
    viewCount: 342,
    createdAt: '19/11/2026',
    expiredAt: '19/12/2026',
    seller: {
      id: 1,
      msv: '22040118',
      fullName: 'Nguyễn Văn An',
      email: 'an.nv@ulis.edu.vn',
      faculty: 'Khoa Sư phạm Tiếng Anh',
      cohort: 'QH-2022 · Khoa Anh',
      phone: '0987654321',
      avatarInitials: 'NA',
      avatarBg: '#dbe1ff',
      reputationScore: 5,
    },
  },
  {
    id: 102,
    code: 'NB-100002',
    title: 'Tặng: Tuyển tập Đề thi Ngữ pháp B2 ULIS 2024 + Sổ tay từ vựng',
    courseCode: 'ENG1052',
    bookTypeCode: 'TYPE_LUYENTHI',
    bookTypeName: 'Tài liệu ôn thi chứng chỉ',
    facultyCode: 'ENG_FACULTY',
    facultyName: 'Khoa Sư phạm Tiếng Anh',
    isGiveaway: true,
    price: 0,
    originalPrice: 65000,
    quantity: 2,
    condition: 'Tặng miễn phí · Đầy đủ đáp án giải thích chi tiết',
    conditionBadge: 'Tặng miễn phí · Đủ trang',
    campusLocation: 'Sân C1',
    description:
      'Mình đã qua môn Ngữ pháp B2 nên muốn tặng lại bộ tuyển tập đề thi các năm của ULIS kèm sổ tay ghi chú cấu trúc ăn điểm cho các bạn khoá dưới. Hẹn nhận trực tiếp tại ghế đá sân C1 nhé!',
    coverUrl:
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
    ],
    status: 'SELLING',
    viewCount: 518,
    createdAt: '19/11/2026',
    expiredAt: '19/12/2026',
    seller: {
      id: 2,
      msv: '21040512',
      fullName: 'Trần Minh Hương',
      email: 'huong.tm@ulis.edu.vn',
      faculty: 'Khoa Sư phạm Tiếng Anh',
      cohort: 'QH-2021 · Sư phạm Anh',
      phone: '0912345678',
      avatarInitials: 'TH',
      avatarBg: '#ffddb8',
      reputationScore: 4,
    },
  },
  {
    id: 103,
    code: 'NB-100003',
    title: 'Combo Minna no Nihongo Sơ cấp 1 & 2 (Bản dịch + Giải thích Ngữ pháp)',
    courseCode: 'JPN1011',
    bookTypeCode: 'TYPE_GIAOTRINH',
    bookTypeName: 'Giáo trình bắt buộc',
    facultyCode: 'JPN_FACULTY',
    facultyName: 'Khoa NN & VH Nhật Bản',
    isGiveaway: false,
    price: 70000,
    originalPrice: 185000,
    quantity: 1,
    condition: 'Mới 90% · Kèm link Google Drive trọn bộ File Nghe MP3',
    conditionBadge: 'Mới 90% · Kèm CD File nghe',
    campusLocation: 'Thư viện ULIS',
    description:
      'Trọn bộ 2 cuốn Bản chính và Bản dịch Giải thích ngữ pháp tiếng Việt dùng cho năm 1 Khoa Nhật ULIS. Giấy trắng đẹp, không viết bút bi vào bài tập.',
    coverUrl:
      'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=800&q=80',
    ],
    status: 'SELLING',
    viewCount: 289,
    createdAt: '18/11/2026',
    expiredAt: '18/12/2026',
    seller: {
      id: 3,
      msv: '23040891',
      fullName: 'Lê Hoàng Đức',
      email: 'duc.lh@ulis.edu.vn',
      faculty: 'Khoa NN & VH Nhật Bản',
      cohort: 'QH-2023 · Khoa Nhật',
      phone: '0978112233',
      avatarInitials: 'LĐ',
      avatarBg: '#6cf8bb',
      reputationScore: 4,
    },
  },
  {
    id: 104,
    code: 'NB-100004',
    title: 'Giáo trình Tiếng Hàn Tổng hợp dành cho người Việt Nam - Tập 3 (Trung cấp)',
    courseCode: 'KOR2012',
    bookTypeCode: 'TYPE_GIAOTRINH',
    bookTypeName: 'Giáo trình bắt buộc',
    facultyCode: 'KOR_FACULTY',
    facultyName: 'Khoa NN & VH Hàn Quốc',
    isGiveaway: false,
    price: 55000,
    originalPrice: 145000,
    quantity: 1,
    condition: 'Mới 92% · Sách chính hãng NXB ĐHQGHN',
    conditionBadge: 'Mới 92% · Sách gốc',
    campusLocation: 'Toà B2',
    description:
      'Sách Tiếng Hàn Tổng hợp Quyển 3 bản in màu chuẩn kèm sách bài tập. Đã tổng hợp sẵn từ vựng TOPIK II theo từng bài.',
    coverUrl:
      'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
    ],
    status: 'SELLING',
    viewCount: 194,
    createdAt: '18/11/2026',
    expiredAt: '18/12/2026',
    seller: {
      id: 4,
      msv: '22041045',
      fullName: 'Phạm Khánh Linh',
      email: 'linh.pk@ulis.edu.vn',
      faculty: 'Khoa NN & VH Hàn Quốc',
      cohort: 'QH-2022 · Khoa Hàn',
      phone: '0965443322',
      avatarInitials: 'PL',
      avatarBg: '#e5deff',
      reputationScore: 3,
    },
  },
  {
    id: 105,
    code: 'NB-100005',
    title: 'Giáo trình Chuẩn HSK 4 - Tập 1 + Sách Bài Tập (Ấn bản ĐHQG)',
    courseCode: 'CHN3005',
    bookTypeCode: 'TYPE_LUYENTHI',
    bookTypeName: 'Tài liệu ôn thi chứng chỉ',
    facultyCode: 'CHN_FACULTY',
    facultyName: 'Khoa NN & VH Trung Quốc',
    isGiveaway: false,
    price: 60000,
    originalPrice: 168000,
    quantity: 1,
    condition: 'Mới 98% · Chưa viết chì vào sách bài tập',
    conditionBadge: 'Mới 98% · Chưa viết chì',
    campusLocation: 'Cổng chính Phạm Văn Đồng',
    description:
      'Combo 2 cuốn Giáo trình Chuẩn HSK 4 Thượng và Sách bài tập. Sách mới 98% chưa làm bài tập trực tiếp vào trang sách.',
    coverUrl:
      'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=800&q=80',
    ],
    status: 'SELLING',
    viewCount: 412,
    createdAt: '17/11/2026',
    expiredAt: '17/12/2026',
    seller: {
      id: 5,
      msv: '23041209',
      fullName: 'Vũ Quốc Tuấn',
      email: 'tuan.vq@ulis.edu.vn',
      faculty: 'Khoa NN & VH Trung Quốc',
      cohort: 'QH-2023 · Khoa Trung',
      phone: '0934556677',
      avatarInitials: 'VT',
      avatarBg: '#ffdad6',
      reputationScore: 2,
    },
  },
  {
    id: 106,
    code: 'NB-100006',
    title: 'Tặng: Giáo trình Le Nouveau Taxi! 1 + Tập thẻ Flashcard Động từ tiếng Pháp',
    courseCode: 'FRA1002',
    bookTypeCode: 'TYPE_GIAOTRINH',
    bookTypeName: 'Giáo trình bắt buộc',
    facultyCode: 'FRA_FACULTY',
    facultyName: 'Khoa NN & VH Pháp',
    isGiveaway: true,
    price: 0,
    originalPrice: 95000,
    quantity: 1,
    condition: 'Tặng miễn phí · Kèm 150 thẻ Flashcard chia động từ',
    conditionBadge: 'Tặng miễn phí · Kèm Flashcard',
    campusLocation: 'Toà Pháp A3',
    description:
      'Tặng lại cho các em K60 Khoa Pháp cuốn Le Nouveau Taxi 1 và hộp Flashcard chia động từ nhóm 3 do chính mình tự làm.',
    coverUrl:
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
    ],
    status: 'SELLING',
    viewCount: 175,
    createdAt: '16/11/2026',
    expiredAt: '16/12/2026',
    seller: {
      id: 6,
      msv: '21040998',
      fullName: 'Đặng Ngọc Ánh',
      email: 'anh.dn@ulis.edu.vn',
      faculty: 'Khoa NN & VH Pháp',
      cohort: 'QH-2021 · Khoa Pháp',
      phone: '0944778899',
      avatarInitials: 'ĐÁ',
      avatarBg: '#d8e2ff',
      reputationScore: 5,
    },
  },
  {
    id: 107,
    code: 'NB-100007',
    title: 'English Phonetics and Phonology: A Practical Course (Peter Roach)',
    courseCode: 'ENG3021',
    bookTypeCode: 'TYPE_GIAOTRINH',
    bookTypeName: 'Giáo trình bắt buộc',
    facultyCode: 'ENG_FACULTY',
    facultyName: 'Khoa Sư phạm Tiếng Anh',
    isGiveaway: false,
    price: 38000,
    originalPrice: 110000,
    quantity: 1,
    condition: 'Mới 90% · Có highlight trọng tâm đề thi Ngữ âm học',
    conditionBadge: 'Mới 90% · Có highlight',
    campusLocation: 'Toà Sunwah',
    description:
      'Giáo trình Ngữ âm & Âm vị học tiếng Anh kinh điển của Peter Roach. Đã đánh dấu sẵn các câu hỏi thường ra trong bài thi giữa kỳ và cuối kỳ.',
    coverUrl:
      'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=800&q=80',
    ],
    status: 'SELLING',
    viewCount: 263,
    createdAt: '15/11/2026',
    expiredAt: '15/12/2026',
    seller: {
      id: 1,
      msv: '22040118',
      fullName: 'Nguyễn Văn An',
      email: 'an.nv@ulis.edu.vn',
      faculty: 'Khoa Sư phạm Tiếng Anh',
      cohort: 'QH-2022 · Khoa Anh',
      phone: '0987654321',
      avatarInitials: 'NA',
      avatarBg: '#dbe1ff',
      reputationScore: 5,
    },
  },
  {
    id: 108,
    code: 'NB-100008',
    title: 'Studio d A1 - Deutsch als Fremdsprache (Kurs- und Übungsbuch)',
    courseCode: 'GER1008',
    bookTypeCode: 'TYPE_BAITAP',
    bookTypeName: 'Sách bài tập & Ngữ pháp',
    facultyCode: 'GER_FACULTY',
    facultyName: 'Khoa NN & VH Đức',
    isGiveaway: false,
    price: 50000,
    originalPrice: 135000,
    quantity: 1,
    condition: 'Mới 94% · In màu sắc nét, đủ 12 chương',
    conditionBadge: 'Mới 94% · Bản in màu',
    campusLocation: 'Khoa Đức B3',
    description:
      'Giáo trình tiếng Đức A1 dùng cho sinh viên năm nhất Khoa Đức và ngoại ngữ 2 tiếng Đức tại ULIS.',
    coverUrl:
      'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80',
    ],
    status: 'SELLING',
    viewCount: 148,
    createdAt: '14/11/2026',
    expiredAt: '14/12/2026',
    seller: {
      id: 7,
      msv: '23041566',
      fullName: 'Hoàng Gia Bảo',
      email: 'bao.hg@ulis.edu.vn',
      faculty: 'Khoa NN & VH Đức',
      cohort: 'QH-2023 · Khoa Đức',
      phone: '0909887766',
      avatarInitials: 'HB',
      avatarBg: '#d0f8e8',
      reputationScore: 3,
    },
  },
];

export const INITIAL_COMMENTS: BookCommentItem[] = [
  {
    id: 1,
    postId: 101,
    userId: 3,
    authorName: 'Lê Thu Hà',
    authorEmail: 'ha.lt@ulis.edu.vn',
    authorCohort: 'QH-2023.F1 · Khoa Sư phạm Tiếng Anh',
    authorInitials: 'LH',
    isSeller: false,
    content:
      'Bạn ơi sách này còn không ạ? Bản 3rd Edition có kèm phần đáp án Commentary ở cuối sách không bạn?',
    createdAt: '19/11/2026 10:15',
  },
  {
    id: 2,
    postId: 101,
    userId: 1,
    authorName: 'Nguyễn Văn An',
    authorEmail: 'an.nv@ulis.edu.vn',
    authorCohort: 'QH-2022 · Khoa Sư phạm Tiếng Anh',
    authorInitials: 'NA',
    isSeller: true,
    content:
      'Sách vẫn còn nhé Hà ơi! Bản này có đầy đủ phần Answer Key và mình kẹp sẵn tờ tổng hợp cấu trúc Hedging trong Academic Writing của cô dạy môn ENG2014 luôn nha.',
    createdAt: '19/11/2026 10:22',
  },
  {
    id: 3,
    postId: 101,
    userId: 4,
    authorName: 'Phạm Khánh Linh',
    authorEmail: 'linh.pk@ulis.edu.vn',
    authorCohort: 'QH-2022 · Khoa NN & VH Hàn Quốc',
    authorInitials: 'PL',
    isSeller: false,
    content: 'Chiều nay tầm 15h30 bạn có học ở khu giảng đường A1 hoặc Sunwah không ạ?',
    createdAt: '19/11/2026 11:05',
  },
];

export const INITIAL_CONVERSATIONS: ChatConversationItem[] = [
  {
    id: 501,
    peerId: 301,
    peerName: 'Lê Thu Hà',
    peerEmail: 'ha.lt2204@ulis.edu.vn',
    peerMsv: '22040319',
    peerFaculty: 'QH-2022.F1 · Khoa Sư phạm Tiếng Anh',
    peerInitials: 'LH',
    peerAvatarBg: '#dbe1ff',
    peerReputationScore: 4,
    isOnline: true,
    unreadCount: 2,
    lastMessage: 'Vâng thế chốt 14h30 chiều nay ở ghế đá sảnh A1 bạn nhé!',
    lastMessageTime: '10:42',
    isLastFromMe: false,
    contextBook: {
      postId: 101,
      courseCode: 'ENG2014',
      title: 'Academic Writing for Graduate Students B2 (3rd Edition)',
      price: 45000,
      isGiveaway: false,
      condition: 'Mới 95% · Đã bọc bìa',
      campusLocation: 'Sảnh A1 ULIS',
      coverUrl:
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
    },
  },
  {
    id: 502,
    peerId: 302,
    peerName: 'Trần Quốc Bảo',
    peerEmail: 'bao.tq2304@ulis.edu.vn',
    peerMsv: '23040812',
    peerFaculty: 'QH-2023.F1 · Khoa NN & VH Nhật Bản',
    peerInitials: 'TB',
    peerAvatarBg: '#6cf8bb',
    isOnline: true,
    unreadCount: 1,
    lastMessage: 'Bạn gửi giúp mình link file nghe Minna no Nihongo qua mail VNU với ạ.',
    lastMessageTime: '09:18',
    isLastFromMe: false,
    contextBook: {
      postId: 103,
      courseCode: 'JPN1011',
      title: 'Combo Minna no Nihongo Sơ cấp 1 & 2',
      price: 70000,
      isGiveaway: false,
      condition: 'Mới 90% · Kèm CD File nghe',
      campusLocation: 'Thư viện ULIS',
      coverUrl:
        'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=400&q=80',
    },
  },
  {
    id: 503,
    peerId: 303,
    peerName: 'Phạm Hương Giang',
    peerEmail: 'giang.ph2404@ulis.edu.vn',
    peerMsv: '24040115',
    peerFaculty: 'QH-2024.F1 · Khoa Sư phạm Tiếng Anh',
    peerInitials: 'PG',
    peerAvatarBg: '#ffddb8',
    isOnline: false,
    unreadCount: 0,
    lastMessage: 'Cảm ơn tiền bối nhiều lắm ạ! Em nhận được bộ đề 0đ rồi ạ.',
    lastMessageTime: 'Hôm qua',
    isLastFromMe: true,
    contextBook: {
      postId: 102,
      courseCode: 'ENG1052',
      title: 'Tặng: Tuyển tập Đề thi Ngữ pháp B2 ULIS 2024',
      price: 0,
      isGiveaway: true,
      condition: 'Cho tặng 0đ',
      campusLocation: 'Sân C1',
      coverUrl:
        'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=400&q=80',
    },
  },
  {
    id: 504,
    peerId: 304,
    peerName: 'Hoàng Minh Đức',
    peerEmail: 'duc.hm2304@ulis.edu.vn',
    peerMsv: '23041205',
    peerFaculty: 'QH-2023.F1 · Khoa NN & VH Trung Quốc',
    peerInitials: 'HĐ',
    peerAvatarBg: '#e5deff',
    peerReputationScore: 2,
    isOnline: false,
    unreadCount: 0,
    lastMessage: 'Mai sau ca học tiết 3 mình qua cổng Phạm Văn Đồng lấy sách HSK 4 nhé.',
    lastMessageTime: '17/11/2026',
    isLastFromMe: false,
    contextBook: {
      postId: 105,
      courseCode: 'CHN3005',
      title: 'Giáo trình Chuẩn HSK 4 - Tập 1 + Sách Bài Tập',
      price: 60000,
      isGiveaway: false,
      condition: 'Mới 98% · Chưa viết chì',
      campusLocation: 'Cổng chính Phạm Văn Đồng',
      coverUrl:
        'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=400&q=80',
    },
  },
];

export const INITIAL_MESSAGES: Record<number, ChatMessageItem[]> = {
  501: [
    {
      id: 1,
      conversationId: 501,
      senderId: 301,
      senderName: 'Lê Thu Hà',
      content:
        'Chào bạn An! Mình là Hà K57 Khoa Sư phạm Anh. Mình thấy bạn đăng cuốn Academic Writing B2 (ENG2014) giá 45.000đ, sách còn không bạn?',
      createdAt: '10:30',
      isRead: true,
    },
    {
      id: 2,
      conversationId: 501,
      senderId: 1,
      senderName: 'Nguyễn Văn An',
      content:
        'Chào Hà nhé! Sách mình vẫn còn nha. Sách mình bọc plastic từ đầu kỳ nên còn mới 95%, tặng kèm cả đề cương ôn tập của bộ môn luôn.',
      createdAt: '10:34',
      isRead: true,
    },
    {
      id: 3,
      conversationId: 501,
      senderId: 301,
      senderName: 'Lê Thu Hà',
      content:
        'Tuyệt quá ạ! Chiều nay mình có ca học ở giảng đường A1 đến 14h20, mình hẹn nhận sách trực tiếp ở sảnh A1 được không bạn?',
      createdAt: '10:38',
      isRead: true,
    },
    {
      id: 4,
      conversationId: 501,
      senderId: 1,
      senderName: 'Nguyễn Văn An',
      content: 'Được luôn nhé! Tầm 14h30 mình cũng học ở tầng 3 toà A1 xuống.',
      createdAt: '10:40',
      isRead: true,
    },
    {
      id: 5,
      conversationId: 501,
      senderId: 301,
      senderName: 'Lê Thu Hà',
      content: 'Vâng thế chốt 14h30 chiều nay ở ghế đá sảnh A1 bạn nhé!',
      createdAt: '10:42',
      isRead: false,
    },
  ],
  502: [
    {
      id: 10,
      conversationId: 502,
      senderId: 302,
      senderName: 'Trần Quốc Bảo',
      content: 'Chào bạn, bộ Minna no Nihongo Sơ cấp 1 & 2 còn đủ 2 quyển không ạ?',
      createdAt: '09:10',
      isRead: true,
    },
    {
      id: 11,
      conversationId: 502,
      senderId: 1,
      senderName: 'Nguyễn Văn An',
      content: 'Còn đủ cả quyển chính lẫn quyển giải thích ngữ pháp tiếng Việt nhé Bảo ơi.',
      createdAt: '09:15',
      isRead: true,
    },
    {
      id: 12,
      conversationId: 502,
      senderId: 302,
      senderName: 'Trần Quốc Bảo',
      content: 'Bạn gửi giúp mình link file nghe Minna no Nihongo qua mail VNU với ạ.',
      createdAt: '09:18',
      isRead: false,
    },
  ],
  503: [
    {
      id: 20,
      conversationId: 503,
      senderId: 303,
      senderName: 'Phạm Hương Giang',
      content: 'Cảm ơn tiền bối nhiều lắm ạ! Em nhận được bộ đề 0đ rồi ạ.',
      createdAt: '16:20',
      isRead: true,
    },
  ],
  504: [
    {
      id: 30,
      conversationId: 504,
      senderId: 304,
      senderName: 'Hoàng Minh Đức',
      content: 'Mai sau ca học tiết 3 mình qua cổng Phạm Văn Đồng lấy sách HSK 4 nhé.',
      createdAt: '18:05',
      isRead: true,
    },
  ],
};

export const INITIAL_REPORTS: ReportItem[] = [
  {
    id: 1,
    reportCode: '#RP-8842',
    sourceType: 'POST',
    targetId: 105,
    targetTitle: 'Giáo trình Chuẩn HSK 4 - Tập 1 (Bản Photo)',
    targetSubtitle: 'Mã bài: #BK-9021 · Khoa NN & VH Trung Quốc',
    targetBadge: 'POST',
    reasonType: 'SCAM',
    reasonLabel: 'Sai lệch / Lừa đảo cọc',
    description:
      'Người bán yêu cầu chuyển khoản đặt cọc 50% trước khi gặp tại sảnh A2, có dấu hiệu mạo danh sinh viên khoá QH-2023.',
    severity: 'HIGH',
    reporterName: 'Nguyễn Minh Anh',
    reporterEmail: '21040112@vnu.edu.vn',
    reporterMsv: '21040112',
    createdAt: '19/11/2026',
    createdTime: '14:35:10',
    status: 'PENDING',
  },
  {
    id: 2,
    reportCode: '#RP-8839',
    sourceType: 'USER',
    targetId: 8,
    targetTitle: 'Trần Hoàng Nam (MSV: 22041580)',
    targetSubtitle: '22041580@ulis.edu.vn · Khoa Sư phạm Tiếng Anh',
    targetBadge: 'USER',
    reasonType: 'SPAM',
    reasonLabel: 'Spam hàng loạt',
    description:
      'Tài khoản đăng liên tiếp 18 bài quảng cáo khoá học trung tâm bên ngoài không phải giáo trình trao đổi sinh viên.',
    severity: 'HIGH',
    reporterName: 'Lê Thu Hà',
    reporterEmail: 'ha.lt2204@ulis.edu.vn',
    reporterMsv: '22040319',
    createdAt: '19/11/2026',
    createdTime: '11:20:45',
    status: 'PENDING',
  },
  {
    id: 3,
    reportCode: '#RP-8820',
    sourceType: 'COMMENT',
    targetId: 2,
    targetTitle: 'Bình luận tại bài #POST_ENG2014',
    targetSubtitle: 'Tác giả bình luận: hoang.vk@ulis.edu.vn',
    targetBadge: 'COMMENT',
    reasonType: 'OFFENSIVE',
    reasonLabel: 'Ngôn từ phản cảm',
    description:
      'Sử dụng ngôn từ thiếu chuẩn mực công kích người bán trong mục hỏi đáp công khai của bài đăng giáo trình.',
    severity: 'MEDIUM',
    reporterName: 'Phạm Khánh Linh',
    reporterEmail: 'linh.pk@ulis.edu.vn',
    reporterMsv: '22041045',
    createdAt: '18/11/2026',
    createdTime: '16:08:12',
    status: 'PENDING',
  },
  {
    id: 4,
    reportCode: '#RP-8815',
    sourceType: 'POST',
    targetId: 103,
    targetTitle: 'Combo Minna no Nihongo Sơ cấp 1 & 2',
    targetSubtitle: 'Mã bài: #POST_JPN1011 · Khoa NN & VH Nhật Bản',
    targetBadge: 'POST',
    reasonType: 'SPAM',
    reasonLabel: 'Đăng trùng danh mục',
    description: 'Bài đăng giáo trình tiếng Nhật nhưng chọn nhầm sang phân mục Khoa Pháp.',
    severity: 'LOW',
    reporterName: 'Trần Quốc Bảo',
    reporterEmail: 'bao.tq2304@ulis.edu.vn',
    reporterMsv: '23040812',
    createdAt: '17/11/2026',
    createdTime: '09:45:00',
    status: 'RESOLVED',
  },
  {
    id: 5,
    reportCode: '#RP-8802',
    sourceType: 'POST',
    targetId: 101,
    targetTitle: 'Academic Writing for Graduate Students B2',
    targetSubtitle: 'Mã bài: #POST_ENG2014 · Khoa Sư phạm Tiếng Anh',
    targetBadge: 'POST',
    reasonType: 'OTHER',
    reasonLabel: 'Nghi ngờ giá niêm yết',
    description: 'Đã kiểm tra thực tế sách gốc chính hãng, báo cáo không có cơ sở vi phạm.',
    severity: 'LOW',
    reporterName: 'Đặng Ngọc Ánh',
    reporterEmail: 'anh.dn@ulis.edu.vn',
    reporterMsv: '21040998',
    createdAt: '15/11/2026',
    createdTime: '15:12:30',
    status: 'DISMISSED',
  },
];

export const INITIAL_USERS: StudentUserItem[] = [
  {
    id: 1,
    msv: '22040118',
    fullName: 'Nguyễn Văn An',
    email: 'an.nv@ulis.edu.vn',
    faculty: 'Khoa Sư phạm Tiếng Anh (FELTE)',
    className: 'QH-2022.F1',
    phone: '0987654321',
    postCount: 5,
    createdAt: '01/09/2026',
    status: 'ACTIVE',
    role: 'USER',
  },
  {
    id: 2,
    msv: '21040512',
    fullName: 'Trần Minh Hương',
    email: 'huong.tm@ulis.edu.vn',
    faculty: 'Khoa Sư phạm Tiếng Anh (FELTE)',
    className: 'QH-2021.F1',
    phone: '0912345678',
    postCount: 8,
    createdAt: '15/09/2026',
    status: 'ACTIVE',
    role: 'USER',
  },
  {
    id: 3,
    msv: '23040891',
    fullName: 'Lê Hoàng Đức',
    email: 'duc.lh@ulis.edu.vn',
    faculty: 'Khoa NN & VH Nhật Bản',
    className: 'QH-2023.F1.J2',
    phone: '0978112233',
    postCount: 3,
    createdAt: '20/09/2026',
    status: 'ACTIVE',
    role: 'USER',
  },
  {
    id: 4,
    msv: '22041045',
    fullName: 'Phạm Khánh Linh',
    email: 'linh.pk@ulis.edu.vn',
    faculty: 'Khoa NN & VH Hàn Quốc',
    className: 'QH-2022.F1.K1',
    phone: '0965443322',
    postCount: 4,
    createdAt: '02/10/2026',
    status: 'ACTIVE',
    role: 'USER',
  },
  {
    id: 5,
    msv: '23041209',
    fullName: 'Vũ Quốc Tuấn',
    email: 'tuan.vq@ulis.edu.vn',
    faculty: 'Khoa NN & VH Trung Quốc',
    className: 'QH-2023.F1.C3',
    phone: '0934556677',
    postCount: 2,
    createdAt: '12/10/2026',
    status: 'ACTIVE',
    role: 'USER',
  },
  {
    id: 6,
    msv: '21040998',
    fullName: 'Đặng Ngọc Ánh',
    email: 'anh.dn@ulis.edu.vn',
    faculty: 'Khoa NN & VH Pháp',
    className: 'QH-2021.F1.F1',
    phone: '0944778899',
    postCount: 6,
    createdAt: '18/10/2026',
    status: 'ACTIVE',
    role: 'USER',
  },
  {
    id: 7,
    msv: '23041566',
    fullName: 'Hoàng Gia Bảo',
    email: 'bao.hg@ulis.edu.vn',
    faculty: 'Khoa NN & VH Đức',
    className: 'QH-2023.F1.G1',
    phone: '0909887766',
    postCount: 1,
    createdAt: '05/11/2026',
    status: 'ACTIVE',
    role: 'USER',
  },
  {
    id: 8,
    msv: '22041580',
    fullName: 'Trần Hoàng Nam',
    email: '22041580@ulis.edu.vn',
    faculty: 'Khoa Sư phạm Tiếng Anh (FELTE)',
    className: 'QH-2022.F1.E8',
    phone: '0911223344',
    postCount: 18,
    createdAt: '10/11/2026',
    status: 'BANNED',
    role: 'USER',
  },
  {
    id: 9,
    msv: '24040229',
    fullName: 'Nguyễn Trà My',
    email: 'my.nt2404@vnu.edu.vn',
    faculty: 'Khoa NN & VH Trung Quốc',
    className: 'QH-2024.F1.C1',
    phone: '0988776655',
    postCount: 0,
    createdAt: '18/11/2026',
    status: 'INACTIVE',
    role: 'USER',
  },
  {
    id: 99,
    msv: 'ADMIN_ULIS',
    fullName: 'Ban Quản Trị ULIS Books',
    email: 'admin@ulis.edu.vn',
    faculty: 'Trung tâm CNTT & Học liệu ULIS',
    className: 'STAFF-VNU',
    phone: '02437547269',
    postCount: 0,
    createdAt: '01/01/2026',
    status: 'ACTIVE',
    role: 'ADMIN',
    reputationScore: 5,
  },
];

export const INITIAL_HERO_BANNERS: HeroLoopBannerItem[] = [
  {
    id: 1,
    title: 'Academic Writing B2 - Khoa Anh ULIS',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=500&q=80',
    badgeText: 'ENG2014 · Tiết kiệm 70%',
    sortOrder: 1,
    active: true,
  },
  {
    id: 2,
    title: 'Minna no Nihongo Sơ cấp 1 & 2 - Khoa Nhật',
    imageUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=500&q=80',
    badgeText: 'JPN1011 · Bản chuẩn',
    sortOrder: 2,
    active: true,
  },
  {
    id: 3,
    title: 'Giáo trình Chuẩn HSK 4 - Khoa Trung',
    imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=500&q=80',
    badgeText: 'CHN3005 · Kèm bài tập',
    sortOrder: 3,
    active: true,
  },
  {
    id: 4,
    title: 'Tủ sách 0đ Cho Tặng Sinh Viên ULIS',
    imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=500&q=80',
    badgeText: 'Góc 0đ · Lan tỏa tri thức',
    sortOrder: 4,
    active: true,
  },
];

export const INITIAL_APPEARANCE: SystemAppearanceConfig = {
  bgColor: '#fff4eb',
  surfaceColor: '#f6e0b6',
  primaryColor: '#3e4b8e',
  presetName: 'Seashell & French Blue (Mặc định NextBook)',
  domain: 'nextbooks.online',
  heroBanners: INITIAL_HERO_BANNERS,
};

export const INITIAL_INVOICES: InvoiceItem[] = [
  {
    id: 901,
    invoiceCode: 'INV-01001',
    conversationId: 501,
    sellerId: 1,
    sellerName: 'Nguyễn Văn An',
    sellerEmail: 'an.nv@ulis.edu.vn',
    sellerReputation: 5,
    buyerId: 301,
    buyerName: 'Lê Thu Hà',
    buyerEmail: 'ha.lt2204@ulis.edu.vn',
    buyerReputation: 4,
    totalAmount: 45000,
    meetLocation: 'Sảnh A1 ULIS',
    meetTime: '14:30 - 19/11/2026',
    note: 'Tặng kèm đề cương ôn tập môn ENG2014',
    status: 'CONFIRMED_BY_SELLER',
    reminderCount: 1,
    maxReminders: 3,
    lastReminderAt: '19/11/2026 11:15',
    createdAt: '19/11/2026 10:45',
    completedAt: null,
    items: [
      {
        bookPostId: 101,
        bookCode: 'NB-100001',
        bookTitle: 'Academic Writing for Graduate Students B2 (3rd Edition)',
        courseCode: 'ENG2014',
        coverUrl:
          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
        quantity: 1,
        unitPrice: 45000,
      },
    ],
  },
  {
    id: 902,
    invoiceCode: 'INV-01002',
    conversationId: 503,
    sellerId: 2,
    sellerName: 'Trần Minh Hương',
    sellerEmail: 'huong.tm@ulis.edu.vn',
    sellerReputation: 4,
    buyerId: 303,
    buyerName: 'Phạm Hương Giang',
    buyerEmail: 'giang.ph2404@ulis.edu.vn',
    buyerReputation: 4,
    totalAmount: 0,
    meetLocation: 'Sân C1 ULIS',
    meetTime: '16:00 - 18/11/2026',
    note: 'Sách tặng 0đ cho khóa dưới',
    status: 'COMPLETED',
    reminderCount: 0,
    maxReminders: 3,
    lastReminderAt: null,
    createdAt: '18/11/2026 15:20',
    completedAt: '18/11/2026 16:25',
    items: [
      {
        bookPostId: 102,
        bookCode: 'NB-100002',
        bookTitle: 'Tặng: Tuyển tập Đề thi Ngữ pháp B2 ULIS 2024 + Sổ tay từ vựng',
        courseCode: 'ENG1052',
        coverUrl:
          'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=400&q=80',
        quantity: 1,
        unitPrice: 0,
      },
    ],
  },
  {
    id: 903,
    invoiceCode: 'INV-01003',
    conversationId: 504,
    sellerId: 5,
    sellerName: 'Vũ Quốc Tuấn',
    sellerEmail: 'tuan.vq@ulis.edu.vn',
    sellerReputation: 2,
    buyerId: 304,
    buyerName: 'Hoàng Minh Đức',
    buyerEmail: 'duc.hm2304@ulis.edu.vn',
    buyerReputation: 2,
    totalAmount: 60000,
    meetLocation: 'Cổng chính Phạm Văn Đồng',
    meetTime: '09:30 - 17/11/2026',
    note: 'Không liên lạc được tại điểm hẹn',
    status: 'FAILED',
    reminderCount: 3,
    maxReminders: 3,
    lastReminderAt: '17/11/2026 18:00',
    createdAt: '17/11/2026 08:30',
    completedAt: '17/11/2026 20:00',
    items: [
      {
        bookPostId: 105,
        bookCode: 'NB-100005',
        bookTitle: 'Giáo trình Chuẩn HSK 4 - Tập 1 + Sách Bài Tập (Ấn bản ĐHQG)',
        courseCode: 'CHN3005',
        coverUrl:
          'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=400&q=80',
        quantity: 1,
        unitPrice: 60000,
      },
    ],
  },
];

export const INITIAL_CART: CartRecordItem[] = [
  {
    id: 1,
    quantity: 1,
    book: INITIAL_BOOKS[0],
  },
  {
    id: 2,
    quantity: 1,
    book: INITIAL_BOOKS[6],
  },
  {
    id: 3,
    quantity: 1,
    book: INITIAL_BOOKS[2],
  },
];

export const INITIAL_FEEDBACKS: FeedbackRecordItem[] = [
  {
    id: 1,
    senderName: 'Nguyễn Phương Linh',
    senderEmail: 'linh.np2204@ulis.edu.vn',
    category: 'Đề xuất tính năng',
    content: 'Mong NextBook bổ sung thêm mục tài liệu luyện thi VSTEP B2-C1 của trường ULIS ạ!',
    createdAt: '24/11/2026 15:20',
  },
];
