import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Breadcrumb,
  Button,
  CustomModalForm,
  Input,
  InputNumber,
  MaterialIcon,
  Select,
  Tag,
  Tooltip,
  message,
} from '@ulis/components';
import { translate } from '@ulis/locale';
import { formatCurrencyVnd } from '@ulis/utils';
import { useChatStore, type ChatTabFilter } from '../../store/useChatStore';
import {
  useConversationMessages,
  useConversations,
  useMarkConversationRead,
  useOpenConversation,
  useSendMessage,
} from '../../services/chat';
import {
  useCompleteInvoice,
  useConversationInvoices,
  useCreateInvoice,
  useFailInvoice,
  useRemindInvoice,
} from '../../services/v2';
import { useReportModalStore } from '../../store/useReportModalStore';
import { useAuth } from '../../store/useAuth';
import { useBookCategories, useSearchBooks } from '../../services/books';
import type { BookPostItem, InvoiceItem } from '../../services/mock-data';

const DEFAULT_MEET_LOCATIONS = [
  'Sảnh A1 ULIS',
  'Sân C1 ULIS',
  'Thư viện Sunwah',
  'Giảng đường B2',
  'Cổng chính Phạm Văn Đồng',
];

/**
 * Trang Chat P2P tích hợp Luồng Tạo Hóa Đơn 4 Bước (TASK-01) & Cảnh báo Uy tín < 3 (TASK-02):
 * - B1: Chọn sách trong khung chat
 * - B2: Xác nhận đơn (số lượng, giá bán, điểm hẹn, giờ hẹn)
 * - B3: Kiểm tra lại giao dịch & Gửi mail xác nhận tự động cho người mua + Xuất Invoice Card vào Chat
 * - B4: Nhắc nhở người mua bấm xác nhận tối đa 3 lần + Cộng/Trừ điểm uy tín (+1 / -1)
 */
export default function ChatPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuth((s) => s.user);
  const openReportModal = useReportModalStore((s) => s.openReportModal);

  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const searchKeyword = useChatStore((s) => s.searchKeyword);
  const activeTab = useChatStore((s) => s.activeTab);
  const dealModalOpen = useChatStore((s) => s.dealModalOpen);
  const setActiveConversationId = useChatStore((s) => s.setActiveConversationId);
  const setActiveTab = useChatStore((s) => s.setActiveTab);
  const setDealModalOpen = useChatStore((s) => s.setDealModalOpen);

  const { data: conversations = [] } = useConversations();
  const activeConv =
    conversations.find((c) => c.id === activeConversationId) ?? conversations[0];
  const { data: categories = [] } = useBookCategories();
  const { data: allBooksRes } = useSearchBooks({ pageNumber: 1, pageSize: 50 });
  const allSellingBooks = useMemo(
    () => (allBooksRes?.items ?? []).filter((b) => b.status === 'SELLING' && b.quantity > 0),
    [allBooksRes],
  );

  const campusLocationItems = useMemo(
    () =>
      categories.filter(
        (c) => c.parentAxis === 'CAMPUS_LOCATION' && c.status === 'ACTIVE',
      ),
    [categories],
  );

  const { data: messages = [] } = useConversationMessages(activeConv?.id ?? 0);
  const { data: convInvoices = [] } = useConversationInvoices(activeConv?.id ?? 0);
  const openConversation = useOpenConversation();
  const sendMessage = useSendMessage();
  const markRead = useMarkConversationRead();

  const createInvoice = useCreateInvoice();
  const remindInvoice = useRemindInvoice();
  const completeInvoice = useCompleteInvoice();
  const failInvoice = useFailInvoice();

  // State cho Luồng Tạo Hóa Đơn 4 Bước (TASK-01)
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceStep, setInvoiceStep] = useState<1 | 2 | 3>(1);
  const [selectedBookIds, setSelectedBookIds] = useState<number[]>([]);
  const [customPrices, setCustomPrices] = useState<Record<number, number>>({});
  const [customQtys, setCustomQtys] = useState<Record<number, number>>({});
  const [invMeetLocation, setInvMeetLocation] = useState(DEFAULT_MEET_LOCATIONS[0]);
  const [invMeetTime, setInvMeetTime] = useState('14:30 - Chiều nay tại sân trường');
  const [invNote, setInvNote] = useState('Tặng kèm đề cương ôn thi học phần');

  useEffect(() => {
    const postIdParam = searchParams.get('postId');
    const peerIdParam = searchParams.get('peerId');
    const invoiceBooksParam = searchParams.get('invoiceBooks');
    if (!postIdParam || !peerIdParam) return;
    const bookPostId = Number(postIdParam);
    const peerId = Number(peerIdParam);
    if (!Number.isFinite(bookPostId) || bookPostId <= 0 || !Number.isFinite(peerId) || peerId <= 0) {
      return;
    }

    if (invoiceBooksParam) {
      const parsedIds = invoiceBooksParam
        .split(',')
        .map((s) => Number(s))
        .filter((n) => Number.isFinite(n) && n > 0);
      if (parsedIds.length > 0) {
        setSelectedBookIds(parsedIds);
        setInvoiceStep(1);
        setInvoiceModalOpen(true);
      }
    }

    openConversation.mutate(
      { bookPostId, peerId },
      {
        onSuccess: (conv) => {
          if (conv?.id) {
            setActiveConversationId(conv.id);
          }
          setSearchParams({}, { replace: true });
        },
        onError: () => {
          setSearchParams({}, { replace: true });
        },
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const [inputText, setInputText] = useState('');
  const [olderLoaded, setOlderLoaded] = useState(false);
  const [dealLocation, setDealLocation] = useState(translate('chat:dealLoc1Title'));
  const [dealTime, setDealTime] = useState('14:30 - Chiều nay (26/11/2026)');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [localSearch, setLocalSearch] = useState(searchKeyword);

  useEffect(() => {
    if (activeConv && activeConv.unreadCount > 0) {
      markRead.mutate(activeConv.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId]);

  const handleSearchInput = (val: string) => {
    setLocalSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      useChatStore.getState().setSearchKeyword(val.trim());
    }, 500);
  };

  const filteredConversations = useMemo(
    () =>
      conversations.filter((c) => {
        if (activeTab === 'UNREAD' && c.unreadCount === 0) return false;
        if (searchKeyword) {
          const kw = searchKeyword.toLowerCase();
          return (
            (c.peerName ?? '').toLowerCase().includes(kw) ||
            (c.contextBook?.courseCode ?? '').toLowerCase().includes(kw) ||
            (c.contextBook?.title ?? '').toLowerCase().includes(kw)
          );
        }
        return true;
      }),
    [conversations, activeTab, searchKeyword],
  );

  const unreadThreadsCount = useMemo(
    () => conversations.filter((c) => c.unreadCount > 0).length,
    [conversations],
  );

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, activeConversationId, convInvoices.length]);

  const handleSendText = (contentToSend?: string, isAppointment?: boolean) => {
    const raw = (contentToSend ?? inputText).trim();
    if (!raw || !activeConv) return;
    if (!contentToSend) setInputText('');
    sendMessage.mutate({
      conversationId: activeConv.id,
      content: raw,
      senderId: user?.id ?? 1,
      senderName: user?.fullName ?? 'Nguyễn Văn An',
      isAppointment,
    });
  };

  const handleConfirmDeal = () => {
    const msg = translate('chat:dealSentMessage', {
      location: dealLocation,
      time: dealTime,
    });
    handleSendText(msg, true);
    setDealModalOpen(false);
    message.success(translate('chat:dealConfirmBtn'));
  };

  // Mở modal tạo hóa đơn 4 bước (TASK-01)
  const openInvoiceBuilder = () => {
    const defaultBookId = activeConv?.contextBook?.postId || allSellingBooks[0]?.id;
    const initIds =
      selectedBookIds.length > 0
        ? selectedBookIds
        : defaultBookId
          ? [defaultBookId]
          : [];
    setSelectedBookIds(initIds);
    const pricesMap: Record<number, number> = {};
    const qtysMap: Record<number, number> = {};
    for (const b of allSellingBooks) {
      pricesMap[b.id] = b.isGiveaway ? 0 : b.price;
      qtysMap[b.id] = 1;
    }
    setCustomPrices(pricesMap);
    setCustomQtys(qtysMap);
    setInvoiceStep(1);
    setInvoiceModalOpen(true);
  };

  const toggleSelectBookForInvoice = (book: BookPostItem) => {
    setSelectedBookIds((prev) =>
      prev.includes(book.id) ? prev.filter((id) => id !== book.id) : [...prev, book.id],
    );
    if (customPrices[book.id] === undefined) {
      setCustomPrices((p) => ({ ...p, [book.id]: book.isGiveaway ? 0 : book.price }));
    }
    if (customQtys[book.id] === undefined) {
      setCustomQtys((q) => ({ ...q, [book.id]: 1 }));
    }
  };

  const selectedInvoiceBooks = useMemo(
    () => allSellingBooks.filter((b) => selectedBookIds.includes(b.id)),
    [allSellingBooks, selectedBookIds],
  );

  const invoiceDraftTotal = useMemo(
    () =>
      selectedInvoiceBooks.reduce((sum, b) => {
        const unit = customPrices[b.id] ?? (b.isGiveaway ? 0 : b.price);
        const qty = customQtys[b.id] ?? 1;
        return sum + unit * qty;
      }, 0),
    [selectedInvoiceBooks, customPrices, customQtys],
  );

  const handleCreateInvoiceConfirm = () => {
    if (!activeConv) return;
    if (selectedInvoiceBooks.length === 0) {
      message.warning(translate('v2:invoice.selectBookRequired'));
      return;
    }

    createInvoice.mutate(
      {
        conversationId: activeConv.id,
        sellerId: user?.id ?? 1,
        sellerName: user?.fullName ?? 'Nguyễn Văn An',
        sellerEmail: user?.email ?? 'an.nv@ulis.edu.vn',
        buyerId: activeConv.peerId,
        buyerName: activeConv.peerName,
        buyerEmail: activeConv.peerEmail,
        meetLocation: invMeetLocation,
        meetTime: invMeetTime,
        note: invNote,
        items: selectedInvoiceBooks.map((b) => ({
          bookPostId: b.id,
          bookCode: b.code,
          bookTitle: b.title,
          courseCode: b.courseCode,
          coverUrl: b.coverUrl,
          quantity: customQtys[b.id] ?? 1,
          agreedPrice: customPrices[b.id] ?? (b.isGiveaway ? 0 : b.price),
        })),
      },
      {
        onSuccess: (created) => {
          setInvoiceModalOpen(false);
          message.success(
            `${translate('v2:invoice.cardHeader')} #${created.invoiceCode} — Đã gửi mail xác nhận tới ${created.buyerEmail}!`,
          );
        },
      },
    );
  };

  const handleRemindBuyer = (inv: InvoiceItem) => {
    if (inv.reminderCount >= 3) {
      message.warning(translate('v2:invoice.remindLimitReached'));
      return;
    }
    remindInvoice.mutate(inv, {
      onSuccess: (updated) => {
        message.success(
          `Đã gửi nhắc nhở lần ${updated.reminderCount}/3 qua Chat & Email cho ${updated.buyerName}!`,
        );
      },
    });
  };

  const handleCompleteInvoice = (inv: InvoiceItem) => {
    completeInvoice.mutate(inv, {
      onSuccess: () => {
        message.success(translate('v2:invoice.statusCompleted'));
      },
    });
  };

  const handleFailInvoice = (inv: InvoiceItem) => {
    failInvoice.mutate(inv, {
      onSuccess: () => {
        message.warning(translate('v2:invoice.statusFailed'));
      },
    });
  };

  const peerReputation = activeConv?.peerReputationScore ?? 4;
  const isPeerLowReputation = peerReputation < 3;

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '12px 20px 24px' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 10,
        }}
      >
        <Breadcrumb
          items={[
            {
              title: (
                <span onClick={() => navigate('/')} style={{ cursor: 'pointer', fontWeight: 600 }}>
                  {translate('nav:breadcrumbHome')}
                </span>
              ),
            },
            {
              title: (
                <strong style={{ color: 'var(--ulis-french-blue)' }}>
                  {translate('chat:topBadge')}
                </strong>
              ),
            },
          ]}
        />
      </div>

      {/* 2-Panel Chat Workspace */}
      <div className="ulis-chat-workspace" style={{ margin: 0, padding: 0 }}>
        {/* Left Sidebar (360px): Conversations List */}
        <aside className="ulis-chat-sidebar">
          <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid #eef1f8' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ margin: 0, fontSize: 17 }}>
                  {translate('chat:inboxTitle')}
                </h1>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: 'var(--ulis-wheat)',
                    color: 'var(--ulis-midnight-violet)',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {translate('chat:peersCount', { count: conversations.length })}
                </span>
              </div>
            </div>

            <Input
              value={localSearch}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder={translate('chat:searchPlaceholder')}
              prefix={<MaterialIcon name="search" size={17} style={{ color: '#737686' }} />}
              allowClear
            />

            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              {(
                [
                  {
                    key: 'ALL',
                    label: translate('chat:tabAll', { count: conversations.length }),
                  },
                  {
                    key: 'UNREAD',
                    label: translate('chat:tabUnread', { count: unreadThreadsCount }),
                  },
                  {
                    key: 'TRADING',
                    label: translate('chat:tabTrading'),
                  },
                ] as Array<{ key: ChatTabFilter; label: string }>
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 4,
                    border: 'none',
                    background:
                      activeTab === tab.key ? 'var(--ulis-french-blue)' : 'var(--ulis-seashell)',
                    color:
                      activeTab === tab.key ? '#ffffff' : 'var(--ulis-midnight-violet)',
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <Input
              style={{ marginTop: 8 }}
              value={dealLocation}
              onChange={(e) => setDealLocation(e.target.value)}
              placeholder="Hoặc tự nhập địa điểm khác (VD: Cổng trường, Quán cafe...)"
            />
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredConversations.map((conv) => {
              const isActive = conv.id === activeConv?.id;
              const rep = conv.peerReputationScore ?? 4;
              const lowRep = rep < 3;
              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={`ulis-chat-thread-item ${isActive ? 'active' : ''}`}
                >
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <span
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: '50%',
                        background: conv.peerAvatarBg,
                        color: '#131b2e',
                        fontSize: 13,
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {conv.peerInitials}
                    </span>
                    {conv.isOnline && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: 11,
                          height: 11,
                          borderRadius: '50%',
                          background: '#10b981',
                          border: '2px solid #ffffff',
                        }}
                      />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 2,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: isActive ? 'var(--ulis-french-blue)' : '#131b2e',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                        }}
                      >
                        <span>{conv.peerName}</span>
                        <span
                          style={{
                            fontSize: 10.5,
                            padding: '0 5px',
                            borderRadius: 3,
                            background: lowRep ? '#f9dadd' : '#dceee9',
                            color: lowRep ? '#9e2a2b' : '#2e6f5e',
                          }}
                        >
                          {lowRep ? `⚠️ ${rep}★` : `${rep}★`}
                        </span>
                      </span>
                      <span style={{ fontSize: 11, color: '#737686' }}>
                        {conv.lastMessageTime}
                      </span>
                    </div>

                    {(conv.contextBook?.courseCode || conv.contextBook?.title) && (
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#2e6f5e',
                          marginBottom: 3,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {conv.contextBook?.courseCode ? `[${conv.contextBook.courseCode}] ` : ''}
                        {conv.contextBook?.title}
                      </div>
                    )}

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          color: conv.unreadCount > 0 ? '#131b2e' : '#596377',
                          fontWeight: conv.unreadCount > 0 ? 700 : 400,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {conv.isLastFromMe ? translate('chat:youPrefix') : ''}
                        {conv.lastMessage}
                      </span>
                      {conv.unreadCount > 0 && (
                        <span
                          style={{
                            minWidth: 18,
                            height: 18,
                            padding: '0 5px',
                            borderRadius: 999,
                            background: '#ba1a1a',
                            color: '#ffffff',
                            fontSize: 10.5,
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Right Main Chat Window */}
        {activeConv && (
          <section className="ulis-chat-main">
            {/* 1. Peer Info Header + Nút Tạo Hóa Đơn 4 Bước (TASK-01) */}
            <div
              style={{
                padding: '10px 18px',
                borderBottom: '1px solid #eef1f8',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: activeConv.peerAvatarBg,
                    color: '#131b2e',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {activeConv.peerInitials}
                </span>
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: '#131b2e',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span>{activeConv.peerName}</span>
                    <span
                      style={{
                        fontSize: 11,
                        padding: '1px 7px',
                        borderRadius: 4,
                        background: '#e6f9f1',
                        color: '#006c49',
                      }}
                    >
                      ✓ {activeConv.peerEmail}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        padding: '1px 8px',
                        borderRadius: 4,
                        background: isPeerLowReputation ? '#f9dadd' : '#dceee9',
                        color: isPeerLowReputation ? '#9e2a2b' : '#2e6f5e',
                        fontWeight: 700,
                      }}
                    >
                      {isPeerLowReputation
                        ? translate('v2:reputation.lowWarningBadge', { score: peerReputation })
                        : translate('v2:reputation.scoreDisplay', { score: peerReputation })}
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: '#596377' }}>
                    {activeConv.peerFaculty} ·{' '}
                    <span style={{ color: activeConv.isOnline ? '#006c49' : '#737686' }}>
                      {activeConv.isOnline
                        ? translate('chat:onlineStatus')
                        : translate('chat:offlineStatus')}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Button
                  type="primary"
                  className="ulis-primary-btn"
                  onClick={openInvoiceBuilder}
                >
                  <MaterialIcon name="receipt_long" size={16} style={{ marginRight: 5 }} />
                  {translate('v2:invoice.openBuilderBtn')}
                </Button>

                <Button
                  className="ulis-secondary-btn-wheat"
                  onClick={() => setDealModalOpen(true)}
                >
                  <MaterialIcon name="event_available" size={16} style={{ marginRight: 5 }} />
                  {translate('chat:contextBannerConfirmDeal')}
                </Button>

                <Tooltip title={translate('button:report')}>
                  <button
                    type="button"
                    className="ulis-action-icon-btn danger"
                    onClick={() =>
                      openReportModal({
                        sourceType: 'USER',
                        targetId: activeConv.peerId,
                        targetTitle: `${activeConv.peerName} (MSV: ${activeConv.peerMsv})`,
                        targetSubtitle: activeConv.peerEmail,
                      })
                    }
                  >
                    <MaterialIcon name="flag" size={18} />
                  </button>
                </Tooltip>
              </div>
            </div>

            {/* Banner Cảnh báo nếu điểm uy tín đối phương dưới 3 (TASK-02) */}
            {isPeerLowReputation && (
              <div
                style={{
                  padding: '8px 18px',
                  background: '#fff1f0',
                  borderBottom: '1px solid #ffa39e',
                  color: '#9e2a2b',
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <MaterialIcon name="warning" size={17} />
                <span>
                  {translate('v2:reputation.lowWarningDetail', { score: peerReputation })}
                </span>
              </div>
            )}

            {/* 2. Thẻ Hóa Đơn Giao Dịch Trong Hội Thoại (TASK-01: Bước 2, 3, 4) */}
            {convInvoices.length > 0 && (
              <div
                style={{
                  padding: '10px 18px',
                  background: 'var(--ulis-seashell)',
                  borderBottom: '1px solid var(--ulis-border)',
                  maxHeight: 225,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {convInvoices.map((inv) => {
                  const isCompleted = inv.status === 'COMPLETED';
                  const isFailed = inv.status === 'FAILED';
                  const isPending = inv.status === 'CONFIRMED_BY_SELLER';
                  const maxRemindReached = inv.reminderCount >= 3;
                  return (
                    <div
                      key={inv.id}
                      style={{
                        background: '#ffffff',
                        borderRadius: 6,
                        padding: '12px 16px',
                        border: isCompleted
                          ? '2px solid #2e6f5e'
                          : isFailed
                            ? '2px solid #c83e3b'
                            : '2px solid var(--ulis-french-blue)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8,
                          marginBottom: 8,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: 13.5, color: 'var(--ulis-french-blue)' }}>
                            🧾 {translate('v2:invoice.cardHeader')} #{inv.invoiceCode}
                          </strong>
                          <Tag color="green">
                            {translate('v2:invoice.emailSentBadge', { email: inv.buyerEmail })}
                          </Tag>
                        </div>

                        <Tag
                          color={
                            isCompleted ? 'success' : isFailed ? 'error' : 'processing'
                          }
                          style={{ fontWeight: 700, margin: 0 }}
                        >
                          {isCompleted
                            ? translate('v2:invoice.statusCompleted')
                            : isFailed
                              ? translate('v2:invoice.statusFailed')
                              : translate('v2:invoice.statusConfirmed')}
                        </Tag>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                          fontSize: 12.5,
                        }}
                      >
                        <div>
                          {inv.items.map((item) => (
                            <div key={item.bookPostId}>
                              • <strong>[{item.bookCode || item.courseCode}]</strong>{' '}
                              {item.bookTitle} (SL: {item.quantity} ×{' '}
                              {formatCurrencyVnd(item.unitPrice)})
                            </div>
                          ))}
                          <div style={{ color: 'var(--ulis-midnight-muted)', marginTop: 3 }}>
                            📍 {inv.meetLocation} · 🕒 {inv.meetTime}
                            {inv.note ? ` · 💬 ${inv.note}` : ''}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ulis-french-blue)' }}>
                            Tổng: {formatCurrencyVnd(inv.totalAmount)}
                          </div>
                          <div style={{ fontSize: 11.5, color: 'var(--ulis-midnight-muted)' }}>
                            Nhắc nhở: <strong>{inv.reminderCount}/3 lần</strong>
                          </div>
                        </div>
                      </div>

                      {/* Bước 4: Nút Nhắc nhở xác nhận (Tối đa 3 lần) & Nút Hoàn tất (+1) / Không hoàn thành (-1) */}
                      {isPending && (
                        <div
                          style={{
                            marginTop: 10,
                            paddingTop: 8,
                            borderTop: '1px dashed var(--ulis-border)',
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 8,
                          }}
                        >
                          <button
                            type="button"
                            disabled={maxRemindReached || remindInvoice.isPending}
                            onClick={() => handleRemindBuyer(inv)}
                            style={{
                              height: 30,
                              padding: '0 12px',
                              borderRadius: 4,
                              border: 'none',
                              background: maxRemindReached
                                ? '#e2e8f0'
                                : 'var(--ulis-wheat)',
                              color: maxRemindReached
                                ? '#64748b'
                                : 'var(--ulis-midnight-violet)',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: maxRemindReached ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {maxRemindReached
                              ? translate('v2:invoice.remindLimitReached')
                              : translate('v2:invoice.remindBuyerBtn', {
                                  count: inv.reminderCount,
                                })}
                          </button>

                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              type="button"
                              onClick={() => handleCompleteInvoice(inv)}
                              style={{
                                height: 30,
                                padding: '0 14px',
                                borderRadius: 4,
                                border: 'none',
                                background: '#2e6f5e',
                                color: '#ffffff',
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              {inv.sellerId === user?.id
                                ? 'Xác nhận đã giao sách'
                                : translate('v2:invoice.buyerConfirmBtn')}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleFailInvoice(inv)}
                              style={{
                                height: 30,
                                padding: '0 12px',
                                borderRadius: 4,
                                border: 'none',
                                background: '#f9dadd',
                                color: '#9e2a2b',
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              {translate('v2:invoice.markFailedBtn')}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 3. Message Stream */}
            <div className="ulis-chat-messages">
              <div style={{ textAlign: 'center' }}>
                {!olderLoaded && (
                  <button
                    type="button"
                    onClick={() => setOlderLoaded(true)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 999,
                      border: '1px solid #d5dcff',
                      background: '#ffffff',
                      color: 'var(--ulis-french-blue)',
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      marginBottom: 8,
                    }}
                  >
                    {translate('chat:loadOlderBtn')}
                  </button>
                )}
                <div style={{ fontSize: 11, color: '#737686', fontWeight: 600 }}>
                  {translate('chat:todayDivider')}
                </div>
              </div>

              {messages.map((msg) => {
                const isMine = user?.id != null ? msg.senderId === user.id : msg.senderId === 1;
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMine ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div className={isMine ? 'ulis-chat-bubble-out' : 'ulis-chat-bubble-in'}>
                      {msg.content}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: '#596377',
                        marginTop: 4,
                        display: 'flex',
                        gap: 6,
                      }}
                    >
                      <span>{msg.createdAt}</span>
                      {isMine && (
                        <span style={{ color: 'var(--ulis-french-blue)', fontWeight: 700 }}>
                          {msg.isRead
                            ? translate('chat:seenStatus')
                            : translate('chat:deliveredStatus')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* 4. Input Composer */}
            <div style={{ padding: '10px 16px 12px', borderTop: '1px solid #eef1f8' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onPressEnter={() => handleSendText()}
                  placeholder={translate('chat:inputPlaceholder')}
                />
                <Button
                  type="primary"
                  className="ulis-primary-btn"
                  onClick={() => handleSendText()}
                >
                  <MaterialIcon name="send" size={16} />
                </Button>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* ===================================================================== */}
      {/* MODAL TẠO HÓA ĐƠN 4 BƯỚC TRONG CHAT (TASK-01)                         */}
      {/* ===================================================================== */}
      <CustomModalForm
        open={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        onSubmit={() => {
          if (invoiceStep === 1) {
            if (selectedInvoiceBooks.length === 0) {
              message.warning(translate('v2:invoice.selectBookRequired'));
              return;
            }
            setInvoiceStep(2);
          } else if (invoiceStep === 2) {
            setInvoiceStep(3);
          } else {
            handleCreateInvoiceConfirm();
          }
        }}
        confirmLoading={createInvoice.isPending}
        title={translate('v2:invoice.modalTitle')}
        width={680}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Thanh tiến trình 4 bước */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 8,
            }}
          >
            {[
              { step: 1, title: translate('v2:invoice.step1Title') },
              { step: 2, title: translate('v2:invoice.step2Title') },
              { step: 3, title: translate('v2:invoice.step3Title') },
              { step: 4, title: translate('v2:invoice.step4Title') },
            ].map((s) => {
              const active = invoiceStep === s.step;
              const done = invoiceStep > s.step;
              return (
                <div
                  key={s.step}
                  onClick={() => {
                    if (s.step <= 3 && selectedInvoiceBooks.length > 0) {
                      setInvoiceStep(s.step as 1 | 2 | 3);
                    }
                  }}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 4,
                    background: active
                      ? 'var(--ulis-french-blue)'
                      : done
                        ? '#dceee9'
                        : 'var(--ulis-wheat)',
                    color: active
                      ? '#ffffff'
                      : done
                        ? '#2e6f5e'
                        : 'var(--ulis-midnight-violet)',
                    fontSize: 12,
                    fontWeight: 700,
                    textAlign: 'center',
                    cursor: s.step <= 3 ? 'pointer' : 'default',
                  }}
                >
                  {done ? '✓ ' : ''}
                  {s.title}
                </div>
              );
            })}
          </div>

          {/* BƯỚC 1: CHỌN SÁCH TRONG TAB CHAT */}
          {invoiceStep === 1 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                {translate('v2:invoice.step1Desc')}
              </div>
              <div
                style={{
                  maxHeight: 300,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {allSellingBooks.map((book) => {
                  const checked = selectedBookIds.includes(book.id);
                  return (
                    <div
                      key={book.id}
                      onClick={() => toggleSelectBookForInvoice(book)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 4,
                        background: checked ? 'var(--ulis-wheat)' : '#ffffff',
                        border: checked
                          ? '2px solid var(--ulis-french-blue)'
                          : '1px solid var(--ulis-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {}}
                          style={{ width: 16, height: 16 }}
                        />
                        <img
                          src={book.coverUrl}
                          alt={book.title}
                          style={{ width: 38, height: 48, borderRadius: 4, objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{book.title}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--ulis-midnight-muted)' }}>
                            Mã: <strong>{book.code}</strong> · Môn: {book.courseCode} · Tồn:{' '}
                            {book.quantity} cuốn
                          </div>
                        </div>
                      </div>
                      <strong style={{ color: 'var(--ulis-french-blue)' }}>
                        {book.isGiveaway
                          ? translate('home:freeTag')
                          : formatCurrencyVnd(book.price)}
                      </strong>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* BƯỚC 2: XÁC NHẬN ĐƠN (SỐ LƯỢNG, ĐƠN GIÁ CHỐT, ĐỊA ĐIỂM & GIỜ HẸN) */}
          {invoiceStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                {translate('v2:invoice.step2Desc')}
              </div>

              {selectedInvoiceBooks.map((b) => (
                <div
                  key={b.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 4,
                    background: '#ffffff',
                    display: 'grid',
                    gridTemplateColumns: '1fr 90px 135px',
                    gap: 10,
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{b.title}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ulis-midnight-muted)' }}>
                      {b.code} · {b.courseCode}
                    </div>
                  </div>
                  <InputNumber
                    min={1}
                    max={Math.max(1, b.quantity)}
                    value={customQtys[b.id] ?? 1}
                    onChange={(v) =>
                      setCustomQtys((prev) => ({
                        ...prev,
                        [b.id]: typeof v === 'number' ? v : 1,
                      }))
                    }
                    addonBefore="SL"
                  />
                  <InputNumber
                    min={0}
                    step={5000}
                    style={{ width: '100%' }}
                    value={customPrices[b.id] ?? (b.isGiveaway ? 0 : b.price)}
                    onChange={(v) =>
                      setCustomPrices((prev) => ({
                        ...prev,
                        [b.id]: typeof v === 'number' ? v : 0,
                      }))
                    }
                  />
                </div>
              ))}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>
                    {translate('v2:invoice.fieldMeetLocation')}
                  </div>
                  <Select
                    style={{ width: '100%' }}
                    value={invMeetLocation}
                    onChange={(v) => setInvMeetLocation(v)}
                    options={DEFAULT_MEET_LOCATIONS.map((loc) => ({ value: loc, label: loc }))}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>
                    {translate('v2:invoice.fieldMeetTime')}
                  </div>
                  <Input
                    value={invMeetTime}
                    onChange={(e) => setInvMeetTime(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>
                  {translate('v2:invoice.fieldNote')}
                </div>
                <Input
                  value={invNote}
                  onChange={(e) => setInvNote(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={() => setInvoiceStep(1)}>
                  {translate('v2:invoice.prevStepBtn')}
                </Button>
                <Button
                  type="primary"
                  className="ulis-primary-btn"
                  onClick={() => setInvoiceStep(3)}
                >
                  {translate('v2:invoice.nextStepBtn')}
                </Button>
              </div>
            </div>
          )}

          {/* BƯỚC 3: KIỂM TRA LẠI GIAO DỊCH & GỬI MAIL XÁC NHẬN CHO NGƯỜI MUA */}
          {invoiceStep === 3 && activeConv && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 4,
                  background: '#dceee9',
                  color: '#2e6f5e',
                  fontSize: 12.5,
                  fontWeight: 700,
                }}
              >
                ✉️ {translate('v2:invoice.step3Desc')}
              </div>

              <div
                style={{
                  padding: 14,
                  borderRadius: 4,
                  background: '#ffffff',
                  fontSize: 13,
                }}
              >
                <div style={{ marginBottom: 6 }}>
                  <strong>Người mua nhận Email xác nhận:</strong> {activeConv.peerName} (
                  <strong style={{ color: 'var(--ulis-french-blue)' }}>
                    {activeConv.peerEmail}
                  </strong>
                  )
                </div>
                <div style={{ marginBottom: 6 }}>
                  <strong>Điểm hẹn &amp; Thời gian:</strong> {invMeetLocation} · {invMeetTime}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <strong>Danh sách sách chốt đơn ({selectedInvoiceBooks.length} cuốn):</strong>
                  {selectedInvoiceBooks.map((b) => (
                    <div key={b.id} style={{ paddingLeft: 10, marginTop: 4 }}>
                      • [{b.code}] {b.title} — SL: {customQtys[b.id] ?? 1} ×{' '}
                      {formatCurrencyVnd(customPrices[b.id] ?? b.price)}
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    paddingTop: 8,
                    borderTop: '1px solid var(--ulis-border)',
                    fontSize: 16,
                    fontWeight: 800,
                    color: 'var(--ulis-french-blue)',
                    textAlign: 'right',
                  }}
                >
                  Tổng thanh toán: {formatCurrencyVnd(invoiceDraftTotal)}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={() => setInvoiceStep(2)}>
                  {translate('v2:invoice.prevStepBtn')}
                </Button>
                <Button
                  type="primary"
                  loading={createInvoice.isPending}
                  className="ulis-primary-btn"
                  onClick={handleCreateInvoiceConfirm}
                >
                  {translate('v2:invoice.confirmCreateBtn')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </CustomModalForm>

      {/* Campus Pickup Appointment Modal */}
      <CustomModalForm
        open={dealModalOpen}
        onClose={() => setDealModalOpen(false)}
        onSubmit={handleConfirmDeal}
        title={translate('chat:dealModalTitle')}
        width={520}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              background: '#e6f9f1',
              color: '#006c49',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            ✓ {translate('chat:dealModalBadge')}
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#000000', marginBottom: 6 }}>
              {translate('chat:dealLocationLabel')}
            </div>
            <Input
              value={dealLocation}
              onChange={(e) => setDealLocation(e.target.value)}
              placeholder="Nhập địa điểm hẹn gặp (VD: Sảnh A1, Sunwah, Cổng trường...)"
            />
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#000000', marginBottom: 6 }}>
              {translate('chat:dealTimeLabel')}
            </div>
            <Input
              value={dealTime}
              onChange={(e) => setDealTime(e.target.value)}
              placeholder="VD: 14:30 - Chiều nay (26/11/2026)"
            />
          </div>

          <div
            style={{
              padding: 10,
              borderRadius: 8,
              background: '#fff8eb',
              border: '1px solid #fcd34d',
              fontSize: 12,
              color: '#784b00',
            }}
          >
            {translate('chat:dealSafetyNote')}
          </div>
        </div>
      </CustomModalForm>
    </div>
  );
}
