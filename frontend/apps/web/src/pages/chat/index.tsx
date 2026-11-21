import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Breadcrumb,
  Button,
  CustomModalForm,
  Input,
  MaterialIcon,
  Select,
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
import { useReportModalStore } from '../../store/useReportModalStore';
import { useAuth } from '../../store/useAuth';
import { useBookCategories } from '../../services/books';

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
  const setSearchKeyword = useChatStore((s) => s.setSearchKeyword);
  const setActiveTab = useChatStore((s) => s.setActiveTab);
  const setDealModalOpen = useChatStore((s) => s.setDealModalOpen);

  const { data: conversations = [] } = useConversations();
  const { data: categories = [] } = useBookCategories();
  const campusLocationItems = categories.filter(
    (c) => c.parentAxis === 'CAMPUS_LOCATION' && c.status === 'ACTIVE',
  );
  const { data: messages = [] } = useConversationMessages(activeConversationId);
  const openConversation = useOpenConversation();
  const sendMessage = useSendMessage();
  const markRead = useMarkConversationRead();

  useEffect(() => {
    const postIdParam = searchParams.get('postId');
    const peerIdParam = searchParams.get('peerId');
    if (!postIdParam || !peerIdParam) return;
    const bookPostId = Number(postIdParam);
    const peerId = Number(peerIdParam);
    if (!Number.isFinite(bookPostId) || bookPostId <= 0 || !Number.isFinite(peerId) || peerId <= 0) {
      return;
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
          message.error(translate('common:unknownError'));
          setSearchParams({}, { replace: true });
        },
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const [inputText, setInputText] = useState('');
  const [olderLoaded, setOlderLoaded] = useState(false);
  const [dealLocation, setDealLocation] = useState(translate('chat:dealLoc1Title'));
  const [dealTime, setDealTime] = useState('14:30 - Chiều nay (19/11/2026)');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [localSearch, setLocalSearch] = useState(searchKeyword);

  const activeConv =
    conversations.find((c) => c.id === activeConversationId) ?? conversations[0];

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

  const filteredConversations = conversations.filter((c) => {
    if (activeTab === 'UNREAD' && c.unreadCount === 0) return false;
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      return (
        c.peerName.toLowerCase().includes(kw) ||
        c.contextBook.courseCode.toLowerCase().includes(kw) ||
        c.contextBook.title.toLowerCase().includes(kw)
      );
    }
    return true;
  });

  const unreadThreadsCount = conversations.filter((c) => c.unreadCount > 0).length;

  const handleSendText = (contentToSend?: string, isAppointment?: boolean) => {
    const raw = (contentToSend ?? inputText).trim();
    if (!raw || !activeConv) return;
    sendMessage.mutate(
      {
        conversationId: activeConv.id,
        content: raw,
        senderId: user?.id ?? 1,
        senderName: user?.fullName ?? 'Nguyễn Văn An',
        isAppointment,
      },
      {
        onSuccess: () => {
          if (!contentToSend) setInputText('');
        },
      },
    );
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

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '12px 20px 24px' }}>
      {/* Top Breadcrumb & WebSocket Status Strip */}
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
              title: <strong style={{ color: '#004ac6' }}>{translate('chat:topBadge')}</strong>,
            },
          ]}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12 }}>
          <span style={{ color: '#596377' }}>
            <MaterialIcon name="location_on" size={15} style={{ color: '#004ac6' }} />{' '}
            {translate('chat:campusAddress')}
          </span>
          <span
            style={{
              padding: '3px 10px',
              borderRadius: 999,
              background: '#e6f9f1',
              color: '#006c49',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#10b981',
              }}
            />
            {translate('chat:wsConnected')}
          </span>
        </div>
      </div>

      {/* 2-Panel Chat Workspace (Stitch Screen 8: 98741f6091c249a3a5c7de9f13eb815b) */}
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
                <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#131b2e' }}>
                  {translate('chat:inboxTitle')}
                </h1>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: '#dbe1ff',
                    color: '#004ac6',
                    fontSize: 11,
                    fontWeight: 800,
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
                    borderRadius: 6,
                    border: 'none',
                    background: activeTab === tab.key ? '#004ac6' : '#f2f3ff',
                    color: activeTab === tab.key ? '#ffffff' : '#596377',
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredConversations.map((conv) => {
              const isActive = conv.id === activeConv?.id;
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
                          color: isActive ? '#004ac6' : '#131b2e',
                        }}
                      >
                        {conv.peerName}
                      </span>
                      <span style={{ fontSize: 11, color: '#737686' }}>
                        {conv.lastMessageTime}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#006c49',
                        marginBottom: 3,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      [{conv.contextBook.courseCode}] {conv.contextBook.title}
                    </div>

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
            {/* 1. Peer Info Header */}
            <div
              style={{
                padding: '10px 18px',
                borderBottom: '1px solid #eef1f8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
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
                      color: '#004ac6',
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
                const isMine = msg.senderId === (user?.id ?? 1) || msg.senderId === 1;
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
                        fontSize: 10.5,
                        color: '#737686',
                        marginTop: 3,
                        display: 'flex',
                        gap: 6,
                      }}
                    >
                      <span>{msg.createdAt}</span>
                      {isMine && (
                        <span style={{ color: '#004ac6', fontWeight: 700 }}>
                          {msg.isRead
                            ? translate('chat:seenStatus')
                            : translate('chat:deliveredStatus')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 4. Quick Reply Chips & Input Composer */}
            <div style={{ padding: '10px 16px 12px', borderTop: '1px solid #eef1f8' }}>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: '#596377' }}>
                  {translate('chat:quickReplyLabel')}
                </span>
                {[
                  translate('chat:quickReply1'),
                  translate('chat:quickReply2'),
                  translate('chat:quickReply3'),
                ].map((qr, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendText(qr)}
                    style={{
                      padding: '3px 10px',
                      borderRadius: 999,
                      border: '1px solid #d5dcff',
                      background: '#f2f3ff',
                      color: '#004ac6',
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {qr}
                  </button>
                ))}
              </div>

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

              <div style={{ fontSize: 11, color: '#737686', marginTop: 6 }}>
                🔒 {translate('chat:privacyNote')}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Campus Pickup Appointment Modal (Stitch Screen 8 Deal Modal) */}
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {(campusLocationItems.length > 0
                ? campusLocationItems.map((c) => ({
                    title: c.name,
                    sub: c.subtitle || 'Địa điểm ULIS',
                  }))
                : [
                    {
                      title: translate('chat:dealLoc1Title'),
                      sub: translate('chat:dealLoc1Sub'),
                    },
                    {
                      title: translate('chat:dealLoc2Title'),
                      sub: translate('chat:dealLoc2Sub'),
                    },
                    {
                      title: translate('chat:dealLoc3Title'),
                      sub: translate('chat:dealLoc3Sub'),
                    },
                  ]
              ).map((loc) => {
                const active = dealLocation === loc.title;
                return (
                  <div
                    key={loc.title}
                    onClick={() => setDealLocation(loc.title)}
                    style={{
                      padding: 10,
                      borderRadius: 8,
                      border: active ? '2px solid #1677ff' : '1px solid #c3c6d7',
                      background: active ? '#eef2ff' : '#ffffff',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#131b2e' }}>
                      {loc.title}
                    </div>
                    <div style={{ fontSize: 11, color: '#596377' }}>{loc.sub}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#000000', marginBottom: 6 }}>
              {translate('chat:dealTimeLabel')}
            </div>
            <Input
              value={dealTime}
              onChange={(e) => setDealTime(e.target.value)}
              placeholder="VD: 14:30 - Chiều nay (21/11/2026)"
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
