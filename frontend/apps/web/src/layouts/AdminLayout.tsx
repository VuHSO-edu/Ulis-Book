import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Breadcrumb, MaterialIcon } from '@ulis/components';
import { translate } from '@ulis/locale';
import { useAuth } from '../store/useAuth';
import { useAdminReports } from '../services/admin';
import ReportModal from '../components/ReportModal';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const { data: reports = [] } = useAdminReports();

  const pendingReportsCount = reports.filter((r) => r.status === 'PENDING').length;

  const currentCrumb = () => {
    if (location.pathname.includes('/admin/book-posts')) return translate('admin:navPosts');
    if (location.pathname.includes('/admin/users')) return translate('admin:navUsers');
    if (location.pathname.includes('/admin/book-categories'))
      return translate('admin:navCategories');
    return translate('admin:navReports');
  };

  return (
    <div className="ulis-admin-shell">
      <aside className="ulis-admin-sidebar">
        <div
          style={{
            height: 60,
            padding: '0 18px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: '#2563eb',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialIcon name="admin_panel_settings" size={19} />
          </span>
          <div>
            <div
              style={{
                fontFamily: "'Merriweather', Georgia, serif",
                fontSize: 15,
                fontWeight: 700,
                color: '#0f172a',
                lineHeight: 1.2,
              }}
            >
              {translate('common:appName')}
            </div>
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {translate('admin:consoleSubtitle')}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, padding: '18px 14px', overflowY: 'auto' }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              padding: '0 10px 10px',
            }}
          >
            {translate('admin:systemGroup')}
          </div>

          <Link
            to="/admin/reports"
            className={`ulis-admin-nav-item ${location.pathname.includes('/admin/reports') ? 'active' : ''}`}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <MaterialIcon name="flag" size={18} />
              <span>{translate('admin:navReports')}</span>
            </span>
            {pendingReportsCount > 0 && (
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: location.pathname.includes('/admin/reports')
                    ? '#ffffff'
                    : '#fef3c7',
                  color: location.pathname.includes('/admin/reports') ? '#2563eb' : '#b45309',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {pendingReportsCount}
              </span>
            )}
          </Link>

          <Link
            to="/admin/book-posts"
            className={`ulis-admin-nav-item ${location.pathname.includes('/admin/book-posts') ? 'active' : ''}`}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <MaterialIcon name="library_books" size={18} />
              <span>{translate('admin:navPosts')}</span>
            </span>
          </Link>

          <Link
            to="/admin/users"
            className={`ulis-admin-nav-item ${location.pathname.includes('/admin/users') ? 'active' : ''}`}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <MaterialIcon name="group" size={18} />
              <span>{translate('admin:navUsers')}</span>
            </span>
          </Link>

          <Link
            to="/admin/book-categories"
            className={`ulis-admin-nav-item ${location.pathname.includes('/admin/book-categories') ? 'active' : ''}`}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <MaterialIcon name="account_tree" size={18} />
              <span>{translate('admin:navCategories')}</span>
            </span>
          </Link>

          <div
            style={{
              height: 1,
              background: '#e2e8f0',
              margin: '16px 4px',
            }}
          />

          <Link to="/" className="ulis-admin-nav-item">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <MaterialIcon name="storefront" size={18} />
              <span>{translate('admin:backToStudentView')}</span>
            </span>
          </Link>
        </div>

        <div
          style={{
            padding: 14,
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              borderRadius: 8,
              background: '#ffffff',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar size={28} style={{ background: '#2563eb', fontSize: 11, fontWeight: 700 }}>
                AD
              </Avatar>
              <div style={{ lineHeight: 1.25 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>
                  {user?.fullName ?? 'Admin ULIS'}
                </div>
                <div style={{ fontSize: 10.5, color: '#10b981', fontWeight: 600 }}>● ADMIN</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login', { replace: true });
              }}
              title={translate('button:logout')}
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                border: 'none',
                background: 'transparent',
                color: '#64748b',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcon name="logout" size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="ulis-admin-main">
        <header className="ulis-admin-topbar">
          <Breadcrumb
            items={[
              {
                title: (
                  <span
                    onClick={() => navigate('/admin/reports')}
                    style={{ cursor: 'pointer', fontWeight: 500, color: '#64748b' }}
                  >
                    {translate('admin:breadcrumbRoot')}
                  </span>
                ),
              },
              {
                title: <strong style={{ color: '#2563eb' }}>{currentCrumb()}</strong>,
              },
            ]}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={() => navigate('/')}
              style={{
                height: 34,
                padding: '0 14px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                fontSize: 12.5,
                fontWeight: 600,
                color: '#0f172a',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <MaterialIcon name="open_in_new" size={15} />
              <span>{translate('admin:backToStudentView')}</span>
            </button>
          </div>
        </header>

        <main className="ulis-admin-content">
          <Outlet />
        </main>
      </div>

      <ReportModal />
    </div>
  );
}
