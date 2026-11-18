import { Outlet, useNavigate } from 'react-router-dom';
import { Avatar, Button, Layout, Space, Typography } from 'antd';
import { translate } from '@ulis/locale';
import { useAuth } from '../store/useAuth';

const { Header, Content } = Layout;

/**
 * Layout chính sau khi xác thực: header (logo + user + hồ sơ + đăng xuất)
 * và content (Outlet cho route con). Logo/app name lấy từ env FIS_APP_NAME.
 */
export default function AppLayout() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="app-header">
        <span className="app-logo">{import.meta.env.FIS_APP_NAME}</span>
        <Space size="middle">
          <Space size="small" className="app-header-user">
            <Avatar size="small">{user?.fullName?.charAt(0) ?? ''}</Avatar>
            <Typography.Text strong style={{ color: '#fff' }}>
              {user?.fullName ?? ''}
            </Typography.Text>
          </Space>
          <Button ghost onClick={() => navigate('/profile')}>
            {translate('profile:title')}
          </Button>
          <Button danger onClick={onLogout}>
            {translate('button:logout')}
          </Button>
        </Space>
      </Header>
      <Content>
        <Outlet />
      </Content>
    </Layout>
  );
}
