import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  App,
  Avatar,
  Breadcrumb,
  Button,
  Card,
  Form,
  Input,
  MaterialIcon,
  Space,
} from '@ulis/components';
import { translate } from '@ulis/locale';
import { extractErrorMessage } from '../../services/auth';
import { useGetProfile, useUpdateProfile } from '../../services/profile';
import { useAuth } from '../../store/useAuth';
import { showBhttConfirm } from '../../components/bhtt-confirm';

interface ProfileFormValues {
  msv: string;
  fullName: string;
  faculty?: string;
  major?: string;
  className?: string;
  phone?: string;
  avatarUrl?: string;
}

export default function ProfilePage() {
  const [form] = Form.useForm<ProfileFormValues>();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const { data } = useGetProfile();
  const updateMutation = useUpdateProfile();
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const avatarUrl = Form.useWatch('avatarUrl', form);

  useEffect(() => {
    const profile = data?.data?.data;
    form.setFieldsValue({
      msv: '22040118',
      fullName: profile?.fullName ?? user?.fullName ?? 'Nguyễn Văn An',
      faculty: profile?.faculty ?? 'Khoa Sư phạm Tiếng Anh (FELTE)',
      major: profile?.major ?? 'Sư phạm Tiếng Anh',
      className: profile?.className ?? 'QH-2022.F1',
      phone: profile?.phone ?? '0987654321',
      avatarUrl: profile?.avatarUrl ?? '',
    });
  }, [data, form, user]);

  const onFinish = async (values: ProfileFormValues) => {
    const cleanName = values.fullName?.trim() ?? '';
    if (!cleanName) {
      message.error(
        translate('common:validation.whitespace', { field: translate('profile:fullName') }),
      );
      return;
    }
    setSaving(true);
    try {
      await updateMutation.mutateAsync({
        fullName: cleanName,
        faculty: values.faculty?.trim(),
        major: values.major?.trim(),
        className: values.className?.trim(),
        phone: values.phone?.trim(),
        avatarUrl: values.avatarUrl?.trim(),
      });
      setIsDirty(false);
      message.success(translate('profile:updated'));
    } catch (e) {
      const errMsg = extractErrorMessage(e);
      if (!errMsg) {
        setIsDirty(false);
        message.success(translate('profile:updated'));
      } else {
        message.error(errMsg);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleExit = () => {
    if (!isDirty) {
      navigate('/');
      return;
    }
    showBhttConfirm({
      content: translate('common:dirtyConfirmMessage'),
      onConfirm: () => navigate('/'),
    });
  };

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '20px 24px 48px' }}>
      <div style={{ marginBottom: 14 }}>
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
              title: <strong style={{ color: '#004ac6' }}>{translate('profile:breadcrumb')}</strong>,
            },
          ]}
        />
      </div>

      <Card title={translate('profile:title')}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: 16,
            borderRadius: 12,
            background: '#f2f3ff',
            border: '1px solid #d5dcff',
            marginBottom: 18,
          }}
        >
          <Avatar
            size={64}
            src={avatarUrl || undefined}
            style={{ background: '#004ac6', fontWeight: 800, fontSize: 22 }}
          >
            {(user?.fullName ?? 'NA').charAt(0)}
          </Avatar>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#131b2e' }}>
              {user?.fullName ?? 'Nguyễn Văn An'}
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: '#006c49',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <MaterialIcon name="verified" size={16} />
              <span>
                {user?.email ?? 'an.nv@ulis.edu.vn'} · {translate('profile:verifiedBadge')}
              </span>
            </div>
          </div>
        </div>

        <Form<ProfileFormValues>
          form={form}
          layout="vertical"
          onValuesChange={() => setIsDirty(true)}
          onFinish={onFinish}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Form.Item name="msv" label={translate('profile:msv')}>
              <Input disabled />
            </Form.Item>

            <Form.Item
              name="fullName"
              label={translate('profile:fullName')}
              rules={[
                {
                  required: true,
                  message: translate('common:validation.required', {
                    field: translate('profile:fullName'),
                  }),
                },
              ]}
            >
              <Input autoFocus placeholder={translate('profile:fullNamePlaceholder')} />
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

            <Form.Item
              name="phone"
              label={translate('profile:phone')}
              extra={<span style={{ fontSize: 11 }}>{translate('profile:phoneHint')}</span>}
            >
              <Input placeholder={translate('profile:phonePlaceholder')} />
            </Form.Item>
          </div>

          <Form.Item name="avatarUrl" label={translate('profile:avatarUrl')}>
            <Input placeholder={translate('profile:avatarUrlPlaceholder')} />
          </Form.Item>

          <Space style={{ marginTop: 12 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={saving}
              className="ulis-modal-btn-submit"
            >
              {translate('button:submit')}
            </Button>
            <Button onClick={handleExit} className="ulis-modal-btn-exit">
              {translate('button:exit')}
            </Button>
          </Space>
        </Form>
      </Card>
    </div>
  );
}
