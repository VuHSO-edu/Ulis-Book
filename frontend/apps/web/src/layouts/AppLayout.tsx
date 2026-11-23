import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, CustomModalForm, Dropdown, MaterialIcon, Tooltip } from '@ulis/components';
import { translate } from '@ulis/locale';
import { useAuth } from '../store/useAuth';
import { useBookFilterStore } from '../store/useBookFilterStore';
import { useConversations } from '../services/chat';
import ReportModal from '../components/ReportModal';

export default function AppLayout() {
  const user = useAuth((s) => s.user);
  const isAuthenticated = useAuth((s) => s.isAuthenticated);
  const logout = useAuth((s) => s.logout);
  const setFilter = useBookFilterStore((s) => s.setFilter);
  const navigate = useNavigate();
  const location = useLocation();
  const { data: conversations = [] } = useConversations();

  const [activeInfoModal, setActiveInfoModal] = useState<'about' | 'faq' | null>(null);

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleHomeClick = () => {
    setActiveInfoModal(null);
    setFilter({ onlyGiveaway: false, pageNumber: 1 });
    navigate('/');
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

  const isHomeActive = location.pathname === '/' && activeInfoModal === null;

  return (
    <div className="ulis-student-shell">
      <header className="ulis-top-header">
        <div className="ulis-header-inner">
          {/* Left: Brand Logo — Text chính (Adobe Caslon) */}
          <Link to="/" className="ulis-brand" onClick={handleHomeClick}>
            <span className="brand-icon">
              <MaterialIcon name="auto_stories" size={20} />
            </span>
            <span className="brand-title">{translate('common:appName')}</span>
          </Link>

          {/* Center: Navigation Links — Text chính (Adobe Caslon), nhấn vào chỗ nào text đổi màu */}
          <nav className="ulis-nav-links">
            <button
              type="button"
              onClick={handleHomeClick}
              className={`nav-link-btn ${isHomeActive ? 'active' : ''}`}
            >
              {translate('nav:home')}
            </button>

            <button
              type="button"
              onClick={() => setActiveInfoModal('about')}
              className={`nav-link-btn ${activeInfoModal === 'about' ? 'active' : ''}`}
            >
              {translate('nav:aboutUs')}
            </button>

            <button
              type="button"
              onClick={() => setActiveInfoModal('faq')}
              className={`nav-link-btn ${activeInfoModal === 'faq' ? 'active' : ''}`}
            >
              {translate('nav:faq')}
            </button>

            {isAuthenticated && (
              <Link
                to="/my-posts"
                onClick={() => setActiveInfoModal(null)}
                className={
                  location.pathname.startsWith('/my-posts') && !activeInfoModal ? 'active' : ''
                }
              >
                {translate('nav:myPosts')}
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/admin/reports"
                onClick={() => setActiveInfoModal(null)}
                className={location.pathname.startsWith('/admin') ? 'active' : ''}
              >
                {translate('nav:adminConsole')}
              </Link>
            )}
          </nav>

          {/* Right: "Đăng bài" Button (French Blue) + Action Icons (Chat, Notification, Avatar, Basket) */}
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

            <Tooltip title={translate('nav:notifications')}>
              <button
                type="button"
                className="ulis-icon-pill-btn"
                onClick={() => navigate(isAuthenticated ? '/chat' : '/login')}
              >
                <MaterialIcon name="notifications" size={20} />
                <span className="unread-dot">2</span>
              </button>
            </Tooltip>

            {isAuthenticated ? (
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <div style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                  <Avatar
                    size={32}
                    style={{
                      background: 'var(--ulis-french-blue)',
                      color: '#ffffff',
                      fontFamily: 'var(--font-primary)',
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    {user?.fullName?.charAt(0)?.toUpperCase() ?? 'D'}
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

            <Tooltip title={translate('nav:savedBasket')}>
              <button
                type="button"
                className="ulis-icon-pill-btn"
                onClick={() => navigate(isAuthenticated ? '/my-posts' : '/login')}
              >
                <MaterialIcon name="shopping_basket" size={20} />
              </button>
            </Tooltip>
          </div>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      <footer className="ulis-footer">
        <div className="ulis-footer-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 4,
                background: 'var(--ulis-french-blue)',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcon name="auto_stories" size={16} />
            </span>
            <div>
              <strong
                style={{
                  fontFamily: 'var(--font-primary)',
                  fontSize: 14,
                  color: 'var(--ulis-midnight-violet)',
                }}
              >
                {translate('common:footerCopyright')}
              </strong>
              <div>{translate('common:footerSubtitle')}</div>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 20,
              fontFamily: 'var(--font-primary)',
              fontWeight: 600,
              fontSize: 13.5,
            }}
          >
            <span style={{ cursor: 'pointer' }} onClick={() => setActiveInfoModal('about')}>
              {translate('common:footerSupport')}
            </span>
            <span style={{ cursor: 'pointer' }} onClick={() => setActiveInfoModal('faq')}>
              {translate('common:footerTerms')}
            </span>
            <span style={{ cursor: 'pointer' }} onClick={() => setActiveInfoModal('about')}>
              {translate('common:footerPrivacy')}
            </span>
          </div>
        </div>
      </footer>

      {/* Modal Về chúng tôi */}
      <CustomModalForm
        open={activeInfoModal === 'about'}
        onClose={() => setActiveInfoModal(null)}
        title={translate('home:aboutModalTitle')}
        width={560}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-primary)',
              fontSize: 15,
              lineHeight: 1.65,
              color: 'var(--ulis-midnight-violet)',
            }}
          >
            {translate('home:aboutModalDesc')}
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
              marginTop: 6,
            }}
          >
            <div
              style={{
                padding: 14,
                borderRadius: 4,
                background: 'var(--ulis-wheat)',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-secondary)',
                  fontSize: 20,
                  fontWeight: 700,
                  color: 'var(--ulis-french-blue)',
                }}
              >
                {translate('home:stat1Value')}
              </div>
              <div style={{ fontFamily: 'var(--font-primary)', fontSize: 13 }}>
                {translate('home:stat1Label')}
              </div>
            </div>
            <div
              style={{
                padding: 14,
                borderRadius: 4,
                background: 'var(--ulis-powder-blue)',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-secondary)',
                  fontSize: 20,
                  fontWeight: 700,
                  color: 'var(--ulis-midnight-violet)',
                }}
              >
                {translate('home:stat2Value')}
              </div>
              <div style={{ fontFamily: 'var(--font-primary)', fontSize: 13 }}>
                {translate('home:stat2Label')}
              </div>
            </div>
            <div
              style={{
                padding: 14,
                borderRadius: 4,
                background: 'var(--ulis-wheat)',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-secondary)',
                  fontSize: 20,
                  fontWeight: 700,
                  color: 'var(--ulis-french-blue)',
                }}
              >
                {translate('home:stat4Value')}
              </div>
              <div style={{ fontFamily: 'var(--font-primary)', fontSize: 13 }}>
                {translate('home:stat4Label')}
              </div>
            </div>
          </div>
        </div>
      </CustomModalForm>

      {/* Modal FAQ */}
      <CustomModalForm
        open={activeInfoModal === 'faq'}
        onClose={() => setActiveInfoModal(null)}
        title={translate('home:faqModalTitle')}
        width={560}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            style={{
              padding: 14,
              borderRadius: 4,
              background: '#ffffff',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--ulis-midnight-violet)',
                marginBottom: 6,
              }}
            >
              {translate('home:faqQ1')}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-secondary)',
                fontSize: 13,
                color: 'var(--ulis-midnight-muted)',
                lineHeight: 1.55,
              }}
            >
              {translate('home:faqA1')}
            </div>
          </div>
          <div
            style={{
              padding: 14,
              borderRadius: 4,
              background: '#ffffff',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--ulis-midnight-violet)',
                marginBottom: 6,
              }}
            >
              {translate('home:faqQ2')}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-secondary)',
                fontSize: 13,
                color: 'var(--ulis-midnight-muted)',
                lineHeight: 1.55,
              }}
            >
              {translate('home:faqA2')}
            </div>
          </div>
        </div>
      </CustomModalForm>

      <ReportModal />
    </div>
  );
}
