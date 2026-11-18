import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App, Avatar, Button, Card, Form, Input, Space, Spin, Typography } from 'antd';
import { translate } from '@ulis/locale';
import { extractErrorMessage } from '../../services/auth';
import { useGetProfile, useUpdateProfile } from '../../services/profile';
import { useAuth } from '../../store/useAuth';

interface ProfileFormValues {
  fullName: string;
  faculty?: string;
  major?: string;
  className?: string;
  phone?: string;
  avatarUrl?: string;
}

/**
 * Màn hồ sơ (ticket 03) — GET/PUT /profile/me qua React Query; option field
 * để trống sẽ được backend lưu null; có avatar preview theo link nhập vào.
 */
export default function ProfilePage() {
  const [form] = Form.useForm<ProfileFormValues>();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const logout = useAuth((s) => s.logout);
  const { data, isLoading } = useGetProfile();
  const updateMutation = useUpdateProfile();
  const [saving, setSaving] = useState(false);
  const avatarUrl = Form.useWatch('avatarUrl', form);

  useEffect(() => {
    const profile = data?.data?.data;
    if (profile) {
      form.setFieldsValue({
        fullName: profile.fullName,
        faculty: profile.faculty ?? '',
        major: profile.major ?? '',
        className: profile.className ?? '',
        phone: profile.phone ?? '',
        avatarUrl: profile.avatarUrl ?? '',
      });
    }
  }, [data, form]);

  const onFinish = async (values: ProfileFormValues) => {
    setSaving(true);
    try {
      await updateMutation.mutateAsync({
        fullName: values.fullName,
        faculty: values.faculty,
        major: values.major,
        className: values.className,
        phone: values.phone,
        avatarUrl: values.avatarUrl,
      });
      message.success(translate('profile:updated'));
    } catch (e) {
      message.error(extractErrorMessage(e) ?? translate('common:unknownError'));
    } finally {
      setSaving(false);
    }
  };

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="page-loading">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Card title={translate('profile:title')} className="home-card">
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Space size="middle" align="center">
          <Avatar size={64} src={avatarUrl || undefined}>
            {data?.data?.data?.fullName?.charAt(0)}
          </Avatar>
          <Typography.Text type="secondary">{data?.data?.data?.email}</Typography.Text>
        </Space>
        <Form<ProfileFormValues>
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
          style={{ maxWidth: 480 }}
        >
          <Form.Item
            name="fullName"
            label={translate('profile:fullName')}
            rules={[
              {
                required: true,
                message: translate('common:validation.required', { field: translate('profile:fullName') }),
              },
            ]}
          >
            <Input placeholder={translate('profile:fullNamePlaceholder')} />
          </Form.Item>
          <Form.Item name="faculty" label={translate('profile:faculty')}>
            <Input placeholder={translate('profile:facultyPlaceholder')} />
          </Form.Item>
          <Form.Item name="major" label={translate('profile:major')}>
            <Input placeholder={translate('profile:majorPlaceholder')} />
          </Form.Item>
          <Form.Item name="className" label={translate('profile:className')}>
            <Input placeholder={translate('profile:classNamePlaceholder')} />
          </Form.Item>
          <Form.Item name="phone" label={translate('profile:phone')}>
            <Input placeholder={translate('profile:phonePlaceholder')} />
          </Form.Item>
          <Form.Item name="avatarUrl" label={translate('profile:avatarUrl')}>
            <Input placeholder={translate('profile:avatarUrlPlaceholder')} />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={saving}>
              {translate('profile:save')}
            </Button>
            <Button danger onClick={onLogout}>
              {translate('button:logout')}
            </Button>
          </Space>
        </Form>
      </Space>
    </Card>
  );
}
