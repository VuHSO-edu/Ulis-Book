import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Dropdown, MaterialIcon, Tooltip } from '@ulis/components';
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

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleExploreClick = () => {
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

  return (
    <div className="ulis-student-shell">
      <header className="ulis-top-header">
        <div className="ulis-header-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <Link to="/" className="ulis-brand" onClick={handleExploreClick}>
              <span className="brand-icon">
                <MaterialIcon name="menu_book" size={20} />
              </span>
              <span className="brand-title">{translate('common:appName')}</span>
              <span className="brand-badge">{translate('common:vnuBadge')}</span>
            </Link>

            <nav className="ulis-nav-links">
              <button
                type="button"
                onClick={handleExploreClick}
                className={`nav-link-btn ${location.pathname === '/' ? 'active' : ''}`}
              >
                {translate('nav:explore')}
              </button>

              {isAuthenticated && (
                <>
                  <Link
                    to="/my-posts"
                    className={location.pathname.startsWith('/my-posts') ? 'active' : ''}
                  >
                    {translate('nav:myPosts')}
                  </Link>

                  <Link
                    to="/chat"
                    className={location.pathname.startsWith('/chat') ? 'active' : ''}
                  >
                    {translate('nav:chat')}
                  </Link>
                </>
              )}

              {isAdmin && (
                <Link
                  to="/admin/reports"
                  className={location.pathname.startsWith('/admin') ? 'active' : ''}
                >
                  {translate('nav:adminConsole')}
                </Link>
              )}
            </nav>
          </div>

          <div className="ulis-header-actions">
            <button
              type="button"
              className="ulis-sell-cta-btn"
              onClick={() => navigate(isAuthenticated ? '/my-posts?create=1' : '/login')}
            >
              <MaterialIcon name="add_circle" size={18} />
              <span>{translate('button:createPost')}</span>
            </button>

            {isAuthenticated && (
              <Tooltip title={translate('nav:chat')}>
                <button
                  type="button"
                  className="ulis-icon-pill-btn"
                  onClick={() => navigate('/chat')}
                >
                  <MaterialIcon name="chat_bubble" size={18} />
                  {totalUnread > 0 && <span className="unread-dot">{totalUnread}</span>}
                </button>
              </Tooltip>
            )}

            {isAuthenticated ? (
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '4px 10px 4px 4px',
                    borderRadius: 999,
                    background: '#f2f3ff',
                    border: '1px solid #d5dcff',
                    cursor: 'pointer',
                  }}
                >
                  <Avatar
                    size={30}
                    style={{
                      background: '#004ac6',
                      fontWeight: 700,
                      fontSize: 12,
                    }}
                  >
                    {user?.fullName?.charAt(0)?.toUpperCase() ?? 'U'}
                  </Avatar>
                  <div style={{ lineHeight: 1.2 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#131b2e' }}>
                      {user?.fullName ?? 'Sinh viên ULIS'}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#006c49' }}>
                      {user?.email ?? 'an.nv@ulis.edu.vn'}
                    </div>
                  </div>
                </div>
              </Dropdown>
            ) : (
              <button
                type="button"
                className="ulis-primary-btn"
                onClick={() => navigate('/login')}
                style={{ cursor: 'pointer' }}
              >
                {translate('button:login')}
              </button>
            )}
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
                width: 26,
                height: 26,
                borderRadius: 6,
                background: '#004ac6',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcon name="auto_stories" size={15} />
            </span>
            <div>
              <strong style={{ color: '#131b2e' }}>{translate('common:footerCopyright')}</strong>
              <div>{translate('common:footerSubtitle')}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20, fontWeight: 600 }}>
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
