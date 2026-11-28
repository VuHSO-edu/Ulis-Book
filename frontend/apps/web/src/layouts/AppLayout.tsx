import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Button,
  Drawer,
  Dropdown,
  Input,
  MaterialIcon,
  Select,
  Tooltip,
  message,
} from '@ulis/components';
import { COMMON_VALIDATION_PATTERN, translate } from '@ulis/locale';
import { useAuth } from '../store/useAuth';
import { useBookFilterStore } from '../store/useBookFilterStore';
import { useConversations } from '../services/chat';
import { useGetProfile } from '../services/profile';
import { useCartItems, useSubmitFeedback, useSystemAppearance } from '../services/v2';
import ReportModal from '../components/ReportModal';
import NextBookLogo from '../components/NextBookLogo';

export default function AppLayout() {
  const user = useAuth((s) => s.user);
  const isAuthenticated = useAuth((s) => s.isAuthenticated);
  const logout = useAuth((s) => s.logout);
  const setFilter = useBookFilterStore((s) => s.setFilter);
  const navigate = useNavigate();
  const location = useLocation();
  const { data: conversations = [] } = useConversations();
  const { data: cartItems = [] } = useCartItems();
  const { data: profileRes } = useGetProfile();
  const profileAvatarUrl = (profileRes as { data?: { avatarUrl?: string | null } } | undefined)?.data
    ?.avatarUrl;
  useSystemAppearance(); // Đồng bộ màu nền hệ thống (TASK-04)

  const submitFeedback = useSubmitFeedback();
  const [fbName, setFbName] = useState(user?.fullName ?? '');
  const [fbEmail, setFbEmail] = useState(user?.email ?? '');
  const [fbCategory, setFbCategory] = useState('Đề xuất tính năng mới');
  const [fbContent, setFbContent] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  const totalCartCount = cartItems.length;

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleHomeClick = () => {
    setFilter({ onlyGiveaway: false, pageNumber: 1 });
    navigate('/');
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = (fbName || user?.fullName || '').trim();
    const cleanEmail = (fbEmail || user?.email || '').trim();
    const cleanContent = fbContent.trim();

    if (!cleanName || !cleanEmail || !cleanContent) {
      message.warning(
        translate('common:validation.required', {
          field: translate('v2:feedback.contentLabel'),
        }),
      );
      return;
    }
    if (!COMMON_VALIDATION_PATTERN.EDU_EMAIL.test(cleanEmail)) {
      message.error(translate('register:emailHint'));
      return;
    }

    submitFeedback.mutate(
      {
        senderName: cleanName,
        senderEmail: cleanEmail,
        category: fbCategory,
        content: cleanContent,
      },
      {
        onSuccess: () => {
          setFbContent('');
          message.success(translate('v2:feedback.sentSuccess'));
        },
      },
    );
  };

  const isAdmin = isAuthenticated && user?.role === 'ADMIN';

  const userMenuItems = [
    {
      key: 'profile',
      label: translate('nav:profile'),
      onClick: () => navigate('/profile'),
    },
    {
      key: 'myPosts',
      label: translate('nav:myPosts'),
      onClick: () => navigate('/my-posts'),
    },
    {
      key: 'cart',
      label: `${translate('v2:cart.navTitle')} (${totalCartCount})`,
      onClick: () => navigate('/cart'),
    },
    ...(isAdmin
      ? [
          {
            key: 'admin',
            label: translate('nav:adminConsole'),
            onClick: () => navigate('/admin/reports'),
          },
        ]
      : []),
    {
      key: 'logout',
      danger: true,
      label: translate('button:logout'),
      onClick: onLogout,
    },
  ];

  const isHomeActive = location.pathname === '/';

  return (
    <div className="ulis-student-shell">
      <header className="ulis-top-header">
        <div className="ulis-header-inner">
          {/* Left: Brand Logo mới + Domain NextBook (TASK-12) */}
          <NextBookLogo onClick={handleHomeClick} showDomainBadge />

          {/* Center: Navigation Links — Kiểu chữ Lexend đồng nhất (TASK-06) */}
          <nav className="ulis-nav-links">
            <button
              type="button"
              onClick={handleHomeClick}
              className={`nav-link-btn ${isHomeActive ? 'active' : ''}`}
            >
              {translate('nav:home')}
            </button>

            {isAuthenticated && (
              <Link
                to="/my-posts"
                className={location.pathname.startsWith('/my-posts') ? 'active' : ''}
              >
                {translate('nav:myPosts')}
              </Link>
            )}

            <Link
              to="/cart"
              className={location.pathname.startsWith('/cart') ? 'active' : ''}
            >
              {translate('v2:cart.navTitle')}
            </Link>

            {isAdmin && (
              <Link
                to="/admin/reports"
                className={location.pathname.startsWith('/admin') ? 'active' : ''}
              >
                {translate('nav:adminConsole')}
              </Link>
            )}
          </nav>

          {/* Right: "Đăng bài" Button + Chat + Avatar + Giỏ hàng (TASK-08) */}
          <div className="ulis-header-actions">
            <button
              type="button"
              className="ulis-sell-cta-btn"
              onClick={() => navigate(isAuthenticated ? '/my-posts?create=1' : '/login')}
            >
              <span>{translate('button:createPost')}</span>
            </button>

            <Tooltip title={translate('nav:chat')}>
              <button
                type="button"
                className="ulis-icon-pill-btn"
                onClick={() => navigate(isAuthenticated ? '/chat' : '/login')}
              >
                <MaterialIcon name="chat_bubble_outline" size={20} />
                {totalUnread > 0 && <span className="unread-dot">{totalUnread}</span>}
              </button>
            </Tooltip>

            <Tooltip title={translate('v2:cart.navTitle')}>
              <button
                type="button"
                className="ulis-icon-pill-btn"
                onClick={() => navigate('/cart')}
              >
                <MaterialIcon name="shopping_cart" size={20} />
                {totalCartCount > 0 && <span className="unread-dot">{totalCartCount}</span>}
              </button>
            </Tooltip>

            {isAuthenticated ? (
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <div style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                  <Avatar
                    size={32}
                    src={profileAvatarUrl || undefined}
                    style={{
                      background: 'var(--ulis-french-blue)',
                      color: '#ffffff',
                      fontFamily: 'var(--font-primary)',
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    {user?.fullName?.charAt(0)?.toUpperCase() ?? 'N'}
                  </Avatar>
                </div>
              </Dropdown>
            ) : (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  className="ulis-secondary-btn-wheat"
                  onClick={() => navigate('/login')}
                >
                  {translate('button:login')}
                </button>
              </div>
            )}

            <button
              type="button"
              className="ulis-mobile-menu-btn"
              aria-label="Mở menu điều hướng"
              onClick={() => setMobileMenuOpen(true)}
            >
              <MaterialIcon name="menu" size={22} />
            </button>
          </div>
        </div>
      </header>

      <Drawer
        title="NextBook"
        placement="right"
        width={280}
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Button
            block
            type={isHomeActive ? 'primary' : 'default'}
            onClick={() => {
              setMobileMenuOpen(false);
              handleHomeClick();
            }}
          >
            {translate('nav:home')}
          </Button>
          {isAuthenticated && (
            <Button
              block
              type={location.pathname.startsWith('/my-posts') ? 'primary' : 'default'}
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/my-posts');
              }}
            >
              {translate('nav:myPosts')}
            </Button>
          )}
          <Button
            block
            type={location.pathname.startsWith('/cart') ? 'primary' : 'default'}
            onClick={() => {
              setMobileMenuOpen(false);
              navigate('/cart');
            }}
          >
            {translate('v2:cart.navTitle')}
            {totalCartCount > 0 ? ` (${totalCartCount})` : ''}
          </Button>
          <Button
            block
            onClick={() => {
              setMobileMenuOpen(false);
              navigate(isAuthenticated ? '/chat' : '/login');
            }}
          >
            {translate('nav:chat')}
            {totalUnread > 0 ? ` (${totalUnread})` : ''}
          </Button>
          {isAdmin && (
            <Button
              block
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/admin/reports');
              }}
            >
              {translate('nav:adminConsole')}
            </Button>
          )}
          <Button
            block
            type="primary"
            className="ulis-primary-btn"
            onClick={() => {
              setMobileMenuOpen(false);
              navigate(isAuthenticated ? '/my-posts?create=1' : '/login');
            }}
          >
            {translate('button:createPost')}
          </Button>
          {isAuthenticated ? (
            <>
              <Button
                block
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/profile');
                }}
              >
                {translate('nav:profile')}
              </Button>
              <Button
                block
                danger
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
              >
                {translate('button:logout')}
              </Button>
            </>
          ) : (
            <Button
              block
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/login');
              }}
            >
              {translate('button:login')}
            </Button>
          )}
        </div>
      </Drawer>

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* Form Góp ý ở cuối trang */}
      <footer className="ulis-footer">
        <div className="ulis-feedback-card">
          <div>
            <span className="ulis-feedback-badge">
              <MaterialIcon name="forward_to_inbox" size={15} />
              <span>{translate('v2:feedback.sectionBadge')}</span>
            </span>
            <h3 style={{ margin: '0 0 8px', fontSize: 19, lineHeight: 1.35 }}>
              {translate('v2:feedback.sectionTitle')}
            </h3>
            <p
              style={{
                margin: '0 0 14px',
                fontSize: 13,
                color: 'var(--ulis-midnight-muted)',
                lineHeight: 1.6,
              }}
            >
              {translate('v2:feedback.sectionSubtitle')}
            </p>
            <div className="ulis-feedback-meta">
              <span className="ulis-feedback-meta-item">
                <MaterialIcon name="language" size={15} />
                <span>
                  Domain: <strong>{translate('v2:brandDomain')}</strong>
                </span>
              </span>
              <span className="ulis-feedback-meta-item">
                <MaterialIcon name="mail_outline" size={15} />
                <span>nexteraofbooks@gmail.com</span>
              </span>
            </div>
          </div>

          <form onSubmit={handleFeedbackSubmit} className="ulis-feedback-form">
            <div className="ulis-feedback-row-top">
              <Input
                size="large"
                value={fbName}
                onChange={(e) => setFbName(e.target.value)}
                placeholder={translate('v2:feedback.namePlaceholder')}
              />
              <Input
                size="large"
                value={fbEmail}
                onChange={(e) => setFbEmail(e.target.value)}
                placeholder={translate('v2:feedback.emailPlaceholder')}
              />
            </div>

            <Select
              size="large"
              style={{ width: '100%' }}
              value={fbCategory}
              onChange={(val) => setFbCategory(val)}
              options={[
                { value: 'Đề xuất tính năng mới', label: translate('v2:feedback.catFeature') },
                { value: 'Góp ý giao diện / Trải nghiệm', label: translate('v2:feedback.catUiUx') },
                {
                  value: 'Bổ sung học liệu / Khoa ngành',
                  label: translate('v2:feedback.catBookSource'),
                },
                { value: 'Yêu cầu hỗ trợ khác', label: translate('v2:feedback.catOther') },
              ]}
            />

            <Input.TextArea
              rows={3}
              value={fbContent}
              onChange={(e) => setFbContent(e.target.value)}
              placeholder={translate('v2:feedback.contentPlaceholder')}
              maxLength={500}
              showCount
            />

            <div className="ulis-feedback-submit-row">
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                loading={submitFeedback.isPending}
                className="ulis-primary-btn"
              >
                <MaterialIcon name="send" size={15} style={{ marginRight: 6 }} />
                {translate('v2:feedback.submitBtn')}
              </Button>
            </div>
          </form>
        </div>

        <div className="ulis-footer-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <NextBookLogo size={28} />
            <span>{translate('common:footerCopyright')}</span>
          </div>
          <div style={{ display: 'flex', gap: 18, fontWeight: 600 }}>
            <span>https://{translate('v2:brandDomain')}</span>
            <span>{translate('common:footerSupport')}</span>
            <span>{translate('common:footerTerms')}</span>
            <span>{translate('common:footerPrivacy')}</span>
          </div>
        </div>
      </footer>

      <ReportModal />
    </div>
  );
}
