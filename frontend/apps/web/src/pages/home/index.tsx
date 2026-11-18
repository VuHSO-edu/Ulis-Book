import { useQuery } from '@tanstack/react-query';
import { Card, Space, Tag, Typography } from 'antd';
import { translate } from '@ulis/locale';
import { fetchHealth } from '../../services/health';

/**
 * Trang chủ (skeleton) — danh sách sách sẽ xây ở ticket 06.
 * Có widget nhỏ ping /health backend để chứng minh seam API nối được.
 */
export default function HomePage() {
  const { data, isError } = useQuery({ queryKey: ['health'], queryFn: fetchHealth });
  const up = !isError && data?.data?.status === 'UP';

  return (
    <Card className="home-card" title={translate('home:welcome')}>
      <Space direction="vertical" size="middle">
        <Typography.Text>{translate('home:listComingSoon')}</Typography.Text>
        <Space>
          <Typography.Text type="secondary">{translate('home:backendStatus')}:</Typography.Text>
          <Tag color={up ? 'success' : 'error'}>
            {up ? translate('home:backendUp') : translate('home:backendDown')}
          </Tag>
        </Space>
      </Space>
    </Card>
  );
}
