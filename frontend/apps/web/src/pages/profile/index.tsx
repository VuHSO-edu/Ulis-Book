import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  App,
  Avatar,
  Breadcrumb,
  Button,
  Form,
  Input,
  MaterialIcon,
  Space,
} from '@ulis/components';
import { translate } from '@ulis/locale';
import { extractErrorMessage } from '../../services/auth';
import { useGetProfile, useUpdateProfile } from '../../services/profile';
import { useMyBookPosts } from '../../services/books';
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
  const { data: myPosts = [] } = useMyBookPosts();
  const updateMutation = useUpdateProfile();
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings'>('dashboard');
  const formSectionRef = useRef<HTMLDivElement | null>(null);
  const avatarUrl = Form.useWatch('avatarUrl', form);
  const fullNameWatch = Form.useWatch('fullName', form);
  const phoneWatch = Form.useWatch('phone', form);
  const facultyWatch = Form.useWatch('faculty', form);

  useEffect(() => {
    const profile = data?.data?.data;
    form.setFieldsValue({
      msv: profile?.msv ?? '22041982',
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
        msv: values.msv?.trim(),
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

  const sellingCount = myPosts.filter((p) => !p.isGiveaway && p.status === 'SELLING').length || 10;
  const courseBookCount = myPosts.length || 4;
  const swapCount = 5;
  const donateCount = myPosts.filter((p) => p.isGiveaway).length || 7;

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '16px 24px 48px' }}>
      <div style={{ marginBottom: 14 }}>
        <Breadcrumb
          items={[
            {
              title: (
                <span
                  onClick={() => navigate('/')}
                  style={{
                    cursor: 'pointer',
                    fontFamily: 'var(--font-primary)',
                    fontWeight: 600,
                    color: 'var(--ulis-midnight-violet)',
                  }}
                >
                  {translate('nav:breadcrumbHome')}
                </span>
              ),
            },
            {
              title: (
                <strong
                  style={{
                    fontFamily: 'var(--font-primary)',
                    color: 'var(--ulis-french-blue)',
                  }}
                >
                  {translate('profile:breadcrumb')}
                </strong>
              ),
            },
          ]}
        />
      </div>

      {/* BOOKNET PROFILE SHELL */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 4,
          overflow: 'hidden',
          paddingBottom: 28,
        }}
      >
        {/* Top Patterned Wheat Banner */}
        <div className="ulis-profile-pattern-banner">
          {Array.from({ length: 8 }).map((_, idx) => (
            <MaterialIcon
              key={idx}
              name="menu_book"
              size={30}
              style={{
                color: 'rgba(61, 21, 52, 0.24)',
                transform: idx % 2 === 0 ? 'rotate(-16deg)' : 'rotate(14deg)',
              }}
            />
          ))}
        </div>

        <div style={{ padding: '0 36px' }}>
          {/* Overlapping Avatar + Student Info Row */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 20,
              marginTop: -44,
              marginBottom: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18 }}>
              <Avatar
                size={96}
                src={avatarUrl || undefined}
                style={{
                  background: 'var(--ulis-french-blue)',
                  color: '#ffffff',
                  fontFamily: 'var(--font-primary)',
                  fontWeight: 700,
                  fontSize: 34,
                  border: '4px solid #ffffff',
                }}
              >
                {(fullNameWatch || user?.fullName || 'U').charAt(0).toUpperCase()}
              </Avatar>
              <div style={{ paddingBottom: 4 }}>
                <h1
                  style={{
                    margin: '0 0 4px',
                    fontFamily: 'var(--font-primary)',
                    fontSize: 22,
                    fontWeight: 700,
                    color: 'var(--ulis-midnight-violet)',
                  }}
                >
                  {fullNameWatch || user?.fullName || 'Nguyễn Văn An'}
                </h1>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('settings');
                    formSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{
                    border: 'none',
                    background: 'none',
                    padding: 0,
                    color: 'var(--ulis-french-blue)',
                    fontFamily: 'var(--font-secondary)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span>{translate('profile:editProfileLink')}</span>
                  <MaterialIcon name="edit" size={14} />
                </button>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto auto',
                gap: '6px 28px',
                fontFamily: 'var(--font-secondary)',
                fontSize: 13,
                color: 'var(--ulis-midnight-violet)',
                paddingBottom: 6,
              }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <MaterialIcon name="mail" size={15} />
                <span>{user?.email ?? 'an.nv@ulis.edu.vn'}</span>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <MaterialIcon name="location_on" size={15} />
                <span>{translate('profile:campusAddress')}</span>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <MaterialIcon name="call" size={15} />
                <span>{phoneWatch || '0987654321'}</span>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <MaterialIcon name="school" size={15} />
                <span>{facultyWatch || 'ULIS - VNU'}</span>
              </div>
            </div>
          </div>

          {/* Preferred Book Categories (Danh mục giáo trình quan tâm) */}
          <div style={{ marginBottom: 24 }}>
            <h3
              style={{
                margin: '0 0 10px',
                fontFamily: 'var(--font-primary)',
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--ulis-french-blue)',
              }}
            >
              {translate('profile:preferredCategories')}
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '6px 16px',
                fontFamily: 'var(--font-secondary)',
                fontSize: 13,
                color: 'var(--ulis-midnight-violet)',
              }}
            >
              <span>• Ngôn ngữ Anh (FELTE)</span>
              <span>• Giáo trình HSK / Tiếng Trung</span>
              <span>• Minna no Nihongo / JLPT</span>
              <span>• Giáo trình Tiếng Hàn / Pháp</span>
              <span>• Sách bài tập & Workbook</span>
              <span>• Đề cương ôn thi học phần</span>
              <span>• Từ điển chuyên ngành</span>
              <span>• Văn học & Đọc hiểu</span>
            </div>
          </div>

          {/* Horizontal Profile Tabs */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              background: 'var(--ulis-seashell)',
              borderRadius: 4,
              overflow: 'hidden',
              marginBottom: 22,
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              style={{
                height: 42,
                border: 'none',
                borderBottom:
                  activeTab === 'dashboard'
                    ? '3px solid var(--ulis-french-blue)'
                    : '3px solid transparent',
                background: activeTab === 'dashboard' ? 'var(--ulis-wheat)' : 'transparent',
                color: 'var(--ulis-midnight-violet)',
                fontFamily: 'var(--font-primary)',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <MaterialIcon name="grid_view" size={16} />
              <span>{translate('profile:tabDashboard')}</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/my-posts')}
              style={{
                height: 42,
                border: 'none',
                background: 'transparent',
                color: 'var(--ulis-midnight-violet)',
                fontFamily: 'var(--font-primary)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <MaterialIcon name="history" size={16} />
              <span>{translate('profile:tabHistory')}</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              style={{
                height: 42,
                border: 'none',
                background: 'transparent',
                color: 'var(--ulis-midnight-violet)',
                fontFamily: 'var(--font-primary)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <MaterialIcon name="favorite_border" size={16} />
              <span>{translate('profile:tabFavourites')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('settings');
                formSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                height: 42,
                border: 'none',
                borderBottom:
                  activeTab === 'settings'
                    ? '3px solid var(--ulis-french-blue)'
                    : '3px solid transparent',
                background: activeTab === 'settings' ? 'var(--ulis-wheat)' : 'transparent',
                color: 'var(--ulis-midnight-violet)',
                fontFamily: 'var(--font-primary)',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <MaterialIcon name="settings" size={16} />
              <span>{translate('profile:tabSettings')}</span>
            </button>
          </div>

          {/* 4 Summary Cards Alternating Wheat (#F6E0B6) & Powder Blue (#A6BCC9) */}
          <div className="ulis-profile-summary-grid">
            <div className="summary-box" style={{ background: 'var(--ulis-seashell)' }}>
              <div className="summary-top wheat">
                <div className="summary-label">{translate('profile:cardSales')}</div>
                <div className="summary-count">{sellingCount}</div>
                <div className="summary-view-link" onClick={() => navigate('/my-posts')}>
                  {translate('profile:viewLink')}
                </div>
              </div>
              <div className="summary-caption">{translate('profile:addSaleCaption')}</div>
              <button
                type="button"
                className="ulis-primary-btn"
                onClick={() => navigate('/my-posts?create=1')}
              >
                {translate('button:add')}
              </button>
            </div>

            <div className="summary-box" style={{ background: 'var(--ulis-seashell)' }}>
              <div className="summary-top powder">
                <div className="summary-label">{translate('profile:cardBids')}</div>
                <div className="summary-count">{courseBookCount}</div>
                <div className="summary-view-link" onClick={() => navigate('/my-posts')}>
                  {translate('profile:viewLink')}
                </div>
              </div>
              <div className="summary-caption">{translate('profile:addBidCaption')}</div>
              <button
                type="button"
                className="ulis-primary-btn"
                onClick={() => navigate('/my-posts?create=1')}
              >
                {translate('button:add')}
              </button>
            </div>

            <div className="summary-box" style={{ background: 'var(--ulis-seashell)' }}>
              <div className="summary-top wheat">
                <div className="summary-label">{translate('profile:cardSwaps')}</div>
                <div className="summary-count">{swapCount}</div>
                <div className="summary-view-link" onClick={() => navigate('/my-posts')}>
                  {translate('profile:viewLink')}
                </div>
              </div>
              <div className="summary-caption">{translate('profile:addSwapCaption')}</div>
              <button
                type="button"
                className="ulis-primary-btn"
                onClick={() => navigate('/my-posts?create=1')}
              >
                {translate('button:add')}
              </button>
            </div>

            <div className="summary-box" style={{ background: 'var(--ulis-seashell)' }}>
              <div className="summary-top powder">
                <div className="summary-label">{translate('profile:cardDonates')}</div>
                <div className="summary-count">{donateCount}</div>
                <div className="summary-view-link" onClick={() => navigate('/my-posts')}>
                  {translate('profile:viewLink')}
                </div>
              </div>
              <div className="summary-caption">{translate('profile:addDonateCaption')}</div>
              <button
                type="button"
                className="ulis-primary-btn"
                onClick={() => navigate('/my-posts?create=1')}
              >
                {translate('button:add')}
              </button>
            </div>
          </div>

          {/* Form Cập nhật Hồ sơ Sinh viên */}
          <div
            ref={formSectionRef}
            style={{
              marginTop: 28,
              padding: 24,
              borderRadius: 4,
              background: 'var(--ulis-seashell)',
            }}
          >
            <h2
              style={{
                margin: '0 0 16px',
                fontFamily: 'var(--font-primary)',
                fontSize: 19,
                fontWeight: 700,
                color: 'var(--ulis-midnight-violet)',
              }}
            >
              {translate('profile:title')}
            </h2>

            <Form<ProfileFormValues>
              form={form}
              layout="vertical"
              onValuesChange={() => setIsDirty(true)}
              onFinish={onFinish}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Form.Item name="msv" label={translate('profile:msv')}>
                  <Input placeholder={translate('register:msvPlaceholder')} />
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
                  extra={
                    <span style={{ fontFamily: 'var(--font-secondary)', fontSize: 11.5 }}>
                      {translate('profile:phoneHint')}
                    </span>
                  }
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
          </div>
        </div>
      </div>
    </div>
  );
}
