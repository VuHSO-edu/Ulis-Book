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
            height: 56,
            padding: '0 18px',
            borderBottom: '1px solid #dce2f2',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#004ac6',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialIcon name="menu_book" size={18} />
          </span>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: '#131b2e', lineHeight: 1.15 }}>
              {translate('common:appName')}
            </div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: '#596377',
                textTransform: 'uppercase',
              }}
            >
              {translate('admin:consoleSubtitle')}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 800,
              color: '#737686',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              padding: '0 10px 8px',
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
                  padding: '2px 7px',
                  borderRadius: 999,
                  background: location.pathname.includes('/admin/reports')
                    ? '#ffffff'
                    : '#ffdad6',
                  color: '#ba1a1a',
                  fontSize: 11,
                  fontWeight: 800,
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
              background: '#dce2f2',
              margin: '14px 4px',
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
            padding: 12,
            borderTop: '1px solid #dce2f2',
            background: '#faf8ff',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 10px',
              borderRadius: 6,
              background: '#eef2ff',
              fontSize: 11,
              fontWeight: 700,
              color: '#006c49',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#10b981',
              }}
            />
            <span>{translate('admin:serverOnline')}</span>
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
                    style={{ cursor: 'pointer', fontWeight: 600 }}
                  >
                    {translate('admin:breadcrumbRoot')}
                  </span>
                ),
              },
              {
                title: <strong style={{ color: '#004ac6' }}>{currentCrumb()}</strong>,
              },
            ]}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={() => navigate('/')}
              style={{
                height: 32,
                padding: '0 12px',
                borderRadius: 6,
                border: '1px solid #c3c6d7',
                background: '#ffffff',
                fontSize: 12,
                fontWeight: 700,
                color: '#131b2e',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <MaterialIcon name="open_in_new" size={15} />
              <span>{translate('admin:backToStudentView')}</span>
            </button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 10px 4px 4px',
                borderRadius: 999,
                background: '#f2f3ff',
                border: '1px solid #d5dcff',
              }}
            >
              <Avatar size={26} style={{ background: '#004ac6', fontSize: 11, fontWeight: 700 }}>
                AD
              </Avatar>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#131b2e' }}>
                {user?.fullName ?? 'Admin ULIS'}
              </span>
            </div>
          </div>
        </header>

        <div className="ulis-admin-content">
          <Outlet />
        </div>
      </div>

      <ReportModal />
    </div>
  );
}
