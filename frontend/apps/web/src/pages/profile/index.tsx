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
  Select,
  Space,
  Table,
  Tag,
  type TableProps,
} from '@ulis/components';
import { translate } from '@ulis/locale';
import { formatCurrencyVnd } from '@ulis/utils';
import { extractErrorMessage } from '../../services/auth';
import { useGetProfile, useUpdateProfile } from '../../services/profile';
import { useMyBookPosts } from '../../services/books';
import { useMyInvoices } from '../../services/v2';
import { useAuth } from '../../store/useAuth';
import { showBhttConfirm } from '../../components/bhtt-confirm';
import type { InvoiceItem } from '../../services/mock-data';

const COURSE_CATEGORY_OPTIONS = [
  'Ngôn ngữ Anh (FELTE)',
  'Giáo trình HSK / Tiếng Trung',
  'Minna no Nihongo / JLPT',
  'Giáo trình Tiếng Hàn / Pháp',
  'Sách bài tập & Workbook',
  'Đề cương ôn thi học phần',
  'Từ điển chuyên ngành',
  'Văn học & Đọc hiểu',
];

interface ProfileFormValues {
  msv: string;
  fullName: string;
  faculty?: string;
  major?: string;
  className?: string;
  phone?: string;
  avatarUrl?: string;
  coverUrl?: string;
  preferredCategories?: string[];
}

/**
 * Giao diện "Hồ sơ của tôi" V2.0 (TASK-10):
 * Tích hợp Điểm uy tín 1-5 & Cảnh báo < 3 (TASK-02), Hạn mức đăng bài 15 bài/tháng (TASK-13),
 * Quản lý tủ sách và Lịch sử hóa đơn mua/bán (TASK-01).
 */
export default function ProfilePage() {
  const [form] = Form.useForm<ProfileFormValues>();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const { data } = useGetProfile();
  const { data: myPosts = [] } = useMyBookPosts();
  const { data: myInvoices = [] } = useMyInvoices();
  const updateMutation = useUpdateProfile();
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'settings'>('overview');
  const formSectionRef = useRef<HTMLDivElement | null>(null);

  const avatarUrl = Form.useWatch('avatarUrl', form);
  const coverUrlWatch = Form.useWatch('coverUrl', form);
  const preferredCategoriesWatch = Form.useWatch('preferredCategories', form) ?? [];
  const fullNameWatch = Form.useWatch('fullName', form);
  const phoneWatch = Form.useWatch('phone', form);
  const facultyWatch = Form.useWatch('faculty', form);
  const msvWatch = Form.useWatch('msv', form);
  const prefsStorageKey = `ulis_profile_prefs_${user?.email ?? 'guest'}`;

  const profileData = data?.data?.data as
    | {
        msv?: string;
        fullName?: string;
        faculty?: string;
        major?: string;
        className?: string;
        phone?: string;
        avatarUrl?: string;
        reputationScore?: number;
        monthlyPostCount?: number;
        monthlyPostLimit?: number;
      }
    | undefined;

  const reputationScore = profileData?.reputationScore ?? 4;
  const isLowReputation = reputationScore < 3;
  const monthlyUsed = profileData?.monthlyPostCount ?? Math.min(15, myPosts.length);
  const monthlyLimit = profileData?.monthlyPostLimit ?? 15;
  const monthlyRemain = Math.max(0, monthlyLimit - monthlyUsed);

  useEffect(() => {
    let savedPrefs: { coverUrl?: string; preferredCategories?: string[] } = {};
    try {
      const raw = localStorage.getItem(prefsStorageKey);
      if (raw) savedPrefs = JSON.parse(raw);
    } catch {
      // ignore storage errors
    }
    form.setFieldsValue({
      msv: profileData?.msv ?? '22040118',
      fullName: profileData?.fullName ?? user?.fullName ?? 'Nguyễn Văn An',
      faculty: profileData?.faculty ?? 'Khoa Sư phạm Tiếng Anh (FELTE)',
      major: profileData?.major ?? 'Sư phạm Tiếng Anh',
      className: profileData?.className ?? 'QH-2022.F1',
      phone: profileData?.phone ?? '0987654321',
      avatarUrl: profileData?.avatarUrl ?? '',
      coverUrl: savedPrefs.coverUrl ?? '',
      preferredCategories:
        savedPrefs.preferredCategories && savedPrefs.preferredCategories.length > 0
          ? savedPrefs.preferredCategories
          : ['Ngôn ngữ Anh (FELTE)', 'Đề cương ôn thi học phần'],
    });
  }, [profileData, form, user, prefsStorageKey]);

  const onFinish = async (values: ProfileFormValues) => {
    const cleanName = values.fullName?.trim() ?? '';
    if (!cleanName) {
      message.error(
        translate('common:validation.whitespace', { field: translate('profile:fullName') }),
      );
      return;
    }
    try {
      localStorage.setItem(
        prefsStorageKey,
        JSON.stringify({
          coverUrl: values.coverUrl?.trim() ?? '',
          preferredCategories: values.preferredCategories ?? [],
        }),
      );
    } catch {
      // ignore storage errors
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
      setActiveTab('overview');
      return;
    }
    showBhttConfirm({
      content: translate('common:dirtyConfirmMessage'),
      onConfirm: () => {
        setIsDirty(false);
        setActiveTab('overview');
      },
    });
  };

  const sellingCount = myPosts.filter((p) => !p.isGiveaway && p.status === 'SELLING').length;
  const soldCount = myPosts.filter((p) => p.status === 'SOLD').length;
  const donateCount = myPosts.filter((p) => p.isGiveaway).length;
  const completedTradesCount = myInvoices.filter((i) => i.status === 'COMPLETED').length;

  const invoiceColumns: TableProps<InvoiceItem>['columns'] = [
    {
      title: translate('admin:transactions.colCode'),
      dataIndex: 'invoiceCode',
      key: 'invoiceCode',
      width: 120,
      render: (code: string) => <strong style={{ color: 'var(--ulis-french-blue)' }}>{code}</strong>,
    },
    {
      title: 'Vai trò',
      key: 'role',
      width: 110,
      render: (_v, rec) => {
        const isSeller = rec.sellerId === (user?.id ?? 1);
        return (
          <Tag color={isSeller ? 'blue' : 'gold'}>
            {isSeller
              ? translate('v2:profileV2.roleSeller')
              : translate('v2:profileV2.roleBuyer')}
          </Tag>
        );
      },
    },
    {
      title: translate('admin:transactions.colBooks'),
      key: 'books',
      render: (_v, rec) => (
        <div>
          {rec.items.map((it) => (
            <div key={it.bookPostId} style={{ fontSize: 12.5 }}>
              <strong>[{it.bookCode || it.courseCode}]</strong> {it.bookTitle} (x{it.quantity})
            </div>
          ))}
        </div>
      ),
    },
    {
      title: translate('admin:transactions.colAmount'),
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 130,
      align: 'right',
      render: (amt: number) => <strong>{formatCurrencyVnd(amt)}</strong>,
    },
    {
      title: translate('admin:transactions.colReminders'),
      key: 'reminders',
      width: 110,
      align: 'center',
      render: (_v, rec) => (
        <Tag color={rec.reminderCount >= 3 ? 'red' : 'default'}>
          {rec.reminderCount}/{rec.maxReminders} lần
        </Tag>
      ),
    },
    {
      title: translate('common:status'),
      dataIndex: 'status',
      key: 'status',
      width: 185,
      render: (st: InvoiceItem['status']) => {
        if (st === 'COMPLETED') {
          return <Tag color="success">{translate('v2:invoice.statusCompleted')}</Tag>;
        }
        if (st === 'FAILED') {
          return <Tag color="error">{translate('v2:invoice.statusFailed')}</Tag>;
        }
        return <Tag color="processing">{translate('v2:invoice.statusConfirmed')}</Tag>;
      },
    },
  ];

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '16px 24px 48px' }}>
      <div style={{ marginBottom: 14 }}>
        <Breadcrumb
          items={[
            {
              title: (
                <span
                  onClick={() => navigate('/')}
                  style={{ cursor: 'pointer', fontWeight: 600 }}
                >
                  {translate('nav:breadcrumbHome')}
                </span>
              ),
            },
            {
              title: (
                <strong style={{ color: 'var(--ulis-french-blue)' }}>
                  {translate('profile:title')}
                </strong>
              ),
            },
          ]}
        />
      </div>

      {/* Cảnh báo nếu điểm uy tín dưới 3 (TASK-02) */}
      {isLowReputation && (
        <div
          style={{
            marginBottom: 16,
            padding: '12px 18px',
            borderRadius: 4,
            background: '#fff1f0',
            border: '1px solid #ffa39e',
            color: '#9e2a2b',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <MaterialIcon name="warning" size={22} />
          <span>{translate('v2:reputation.lowWarningDetail', { score: reputationScore })}</span>
        </div>
      )}

      <div
        style={{
          background: '#ffffff',
          borderRadius: 6,
          overflow: 'hidden',
          paddingBottom: 28,
        }}
      >
        {/* Top Patterned Wheat Banner */}
        <div
          className="ulis-profile-pattern-banner"
          style={
            coverUrlWatch
              ? {
                  backgroundImage: `url(${coverUrlWatch})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : undefined
          }
        >
          {!coverUrlWatch &&
            Array.from({ length: 8 }).map((_, idx) => (
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

        <div style={{ padding: '0 32px' }}>
          {/* Avatar + Identity + Reputation & Monthly Quota Badges */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 20,
              marginTop: -44,
              marginBottom: 22,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, minWidth: 0, flex: 1 }}>
              <Avatar
                size={96}
                src={avatarUrl || profileData?.avatarUrl || undefined}
                style={{
                  background: 'var(--ulis-french-blue)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: 34,
                  border: '4px solid #ffffff',
                  flexShrink: 0,
                }}
              >
                {(fullNameWatch || user?.fullName || 'N').charAt(0).toUpperCase()}
              </Avatar>
              <div style={{ paddingTop: 48, paddingBottom: 4, minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h1 style={{ margin: 0, fontSize: 23, lineHeight: 1.3, wordBreak: 'break-word' }}>
                    {fullNameWatch || user?.fullName || 'Nguyễn Văn An'}
                  </h1>
                  <span
                    style={{
                      padding: '2px 10px',
                      borderRadius: 4,
                      background: isLowReputation ? '#f9dadd' : '#dceee9',
                      color: isLowReputation ? '#9e2a2b' : '#2e6f5e',
                      fontSize: 12.5,
                      fontWeight: 700,
                    }}
                  >
                    {isLowReputation
                      ? translate('v2:reputation.lowWarningBadge', { score: reputationScore })
                      : translate('v2:reputation.scoreDisplay', { score: reputationScore })}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: 12.5,
                    color: 'var(--ulis-midnight-muted)',
                    marginTop: 4,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 14,
                  }}
                >
                  <span>MSV: <strong>{msvWatch || '22040118'}</strong></span>
                  <span>Email: <strong>{user?.email ?? 'an.nv@ulis.edu.vn'}</strong></span>
                  {facultyWatch && <span>Khoa: <strong>{facultyWatch}</strong></span>}
                  {phoneWatch && <span>SĐT: <strong>{phoneWatch}</strong></span>}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, paddingBottom: 4 }}>
              <button
                type="button"
                className="ulis-secondary-btn-wheat"
                onClick={() => {
                  setActiveTab('settings');
                  formSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <MaterialIcon name="edit" size={15} style={{ marginRight: 6 }} />
                {translate('profile:editProfileLink')}
              </button>
              <button
                type="button"
                className="ulis-primary-btn"
                onClick={() => navigate('/my-posts?create=1')}
              >
                <MaterialIcon name="add_circle" size={15} style={{ marginRight: 6 }} />
                {translate('button:createPost')}
              </button>
            </div>
          </div>

          {/* 3 V2.0 KPI Highlight Cards: Reputation (1-5), Monthly Quota (X/15), Completed Invoices */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 16,
              marginBottom: 24,
            }}
          >
            {/* Card 1: Điểm Uy Tín (TASK-02) */}
            <div
              style={{
                padding: '16px 20px',
                borderRadius: 6,
                background: isLowReputation ? '#fff1f0' : 'var(--ulis-seashell)',
                border: isLowReputation ? '1px solid #ffa39e' : 'none',
              }}
            >
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ulis-midnight-muted)' }}>
                {translate('v2:profileV2.reputationCardTitle')}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  margin: '6px 0',
                }}
              >
                <span
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: isLowReputation ? '#9e2a2b' : 'var(--ulis-french-blue)',
                  }}
                >
                  {reputationScore} / 5 ★
                </span>
                <span style={{ color: '#e6b85c', fontSize: 17 }}>
                  {'★'.repeat(reputationScore)}
                  {'☆'.repeat(Math.max(0, 5 - reputationScore))}
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--ulis-midnight-muted)' }}>
                {translate('v2:reputation.ruleHint')}
              </div>
            </div>

            {/* Card 2: Hạn Mức Đăng Bài 15 bài / tháng (TASK-13) */}
            <div
              style={{
                padding: '16px 20px',
                borderRadius: 6,
                background: 'var(--ulis-wheat)',
              }}
            >
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ulis-midnight-violet)' }}>
                {translate('v2:profileV2.quotaCardTitle')}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  margin: '6px 0',
                }}
              >
                <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--ulis-french-blue)' }}>
                  {monthlyUsed} / {monthlyLimit}
                </span>
                <span style={{ fontSize: 12.5, fontWeight: 700 }}>
                  {translate('v2:quota.remaining', { remain: monthlyRemain })}
                </span>
              </div>
              <div
                style={{
                  height: 7,
                  borderRadius: 999,
                  background: 'rgba(61, 21, 52, 0.14)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, Math.round((monthlyUsed / monthlyLimit) * 100))}%`,
                    height: '100%',
                    background:
                      monthlyUsed >= monthlyLimit ? '#c83e3b' : 'var(--ulis-french-blue)',
                  }}
                />
              </div>
            </div>

            {/* Card 3: Giao dịch Hóa đơn & Tủ sách */}
            <div
              style={{
                padding: '16px 20px',
                borderRadius: 6,
                background: 'var(--ulis-seashell)',
              }}
            >
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ulis-midnight-muted)' }}>
                {translate('v2:profileV2.invoicesCardTitle')}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  margin: '6px 0',
                }}
              >
                <span style={{ fontSize: 26, fontWeight: 800, color: '#2e6f5e' }}>
                  {completedTradesCount} đơn
                </span>
                <span
                  onClick={() => setActiveTab('invoices')}
                  style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: 'var(--ulis-french-blue)',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                  }}
                >
                  Xem hóa đơn →
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--ulis-midnight-muted)' }}>
                Đang bán: {sellingCount} · Đã bán: {soldCount} · Tặng 0đ: {donateCount}
              </div>
            </div>
          </div>

          {/* Preferred Categories */}
          {preferredCategoriesWatch.length > 0 && (
            <div style={{ marginBottom: 22 }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 15, color: 'var(--ulis-french-blue)' }}>
                {translate('profile:preferredCategories')}
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {preferredCategoriesWatch.map((cat) => (
                  <span
                    key={cat}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 4,
                      background: 'var(--ulis-seashell)',
                      fontSize: 12.5,
                      fontWeight: 600,
                    }}
                  >
                    • {cat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Horizontal Profile Tabs */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              background: 'var(--ulis-seashell)',
              borderRadius: 4,
              overflow: 'hidden',
              marginBottom: 22,
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              style={{
                height: 44,
                border: 'none',
                borderBottom:
                  activeTab === 'overview'
                    ? '3px solid var(--ulis-french-blue)'
                    : '3px solid transparent',
                background: activeTab === 'overview' ? 'var(--ulis-wheat)' : 'transparent',
                color: 'var(--ulis-midnight-violet)',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <MaterialIcon name="grid_view" size={17} />
              <span>{translate('v2:profileV2.tabOverview')}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('invoices')}
              style={{
                height: 44,
                border: 'none',
                borderBottom:
                  activeTab === 'invoices'
                    ? '3px solid var(--ulis-french-blue)'
                    : '3px solid transparent',
                background: activeTab === 'invoices' ? 'var(--ulis-wheat)' : 'transparent',
                color: 'var(--ulis-midnight-violet)',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <MaterialIcon name="receipt_long" size={17} />
              <span>
                {translate('v2:profileV2.tabMyInvoices')} ({myInvoices.length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              style={{
                height: 44,
                border: 'none',
                borderBottom:
                  activeTab === 'settings'
                    ? '3px solid var(--ulis-french-blue)'
                    : '3px solid transparent',
                background: activeTab === 'settings' ? 'var(--ulis-wheat)' : 'transparent',
                color: 'var(--ulis-midnight-violet)',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <MaterialIcon name="manage_accounts" size={17} />
              <span>{translate('v2:profileV2.tabSettings')}</span>
            </button>
          </div>

          {activeTab === 'overview' && (
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
                  <div className="summary-count">{myPosts.length}</div>
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
                  <div className="summary-label">Hóa đơn Chat</div>
                  <div className="summary-count">{myInvoices.length}</div>
                  <div className="summary-view-link" onClick={() => setActiveTab('invoices')}>
                    {translate('profile:viewLink')}
                  </div>
                </div>
                <div className="summary-caption">Giao dịch trực tiếp qua khung Chat</div>
                <button
                  type="button"
                  className="ulis-primary-btn"
                  onClick={() => navigate('/chat')}
                >
                  Mở Chat
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
          )}

          {activeTab === 'invoices' && (
            <div className="ulis-data-table">
              <Table<InvoiceItem>
                rowKey="id"
                columns={invoiceColumns}
                dataSource={myInvoices}
                pagination={{ pageSize: 10, showSizeChanger: false }}
              />
            </div>
          )}

          {activeTab === 'settings' && (
            <div
              ref={formSectionRef}
              style={{
                marginTop: 12,
                padding: 24,
                borderRadius: 4,
                background: 'var(--ulis-seashell)',
              }}
            >
              <h2 style={{ margin: '0 0 16px', fontSize: 19 }}>{translate('profile:title')}</h2>

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
                      <span style={{ fontSize: 11.5 }}>{translate('profile:phoneHint')}</span>
                    }
                  >
                    <Input placeholder={translate('profile:phonePlaceholder')} />
                  </Form.Item>
                </div>

                <Form.Item name="avatarUrl" label={translate('profile:avatarUrl')}>
                  <Input
                    placeholder={translate('profile:avatarUrlPlaceholder')}
                    addonAfter={
                      <label style={{ cursor: 'pointer', fontSize: 12 }}>
                        {translate('profile:uploadCover')}
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (typeof reader.result === 'string') {
                                form.setFieldValue('avatarUrl', reader.result);
                                setIsDirty(true);
                              }
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                    }
                  />
                </Form.Item>

                <Form.Item name="coverUrl" label={translate('profile:coverUrl')}>
                  <Input
                    placeholder={translate('profile:coverUrlPlaceholder')}
                    addonAfter={
                      <label style={{ cursor: 'pointer', fontSize: 12 }}>
                        {translate('profile:uploadCover')}
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (typeof reader.result === 'string') {
                                form.setFieldValue('coverUrl', reader.result);
                                setIsDirty(true);
                              }
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                    }
                  />
                </Form.Item>

                <Form.Item
                  name="preferredCategories"
                  label={translate('profile:preferredCategories')}
                >
                  <Select
                    mode="multiple"
                    allowClear
                    placeholder={translate('profile:preferredCategoriesPlaceholder')}
                    options={COURSE_CATEGORY_OPTIONS.map((c) => ({ label: c, value: c }))}
                  />
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
          )}
        </div>
      </div>
    </div>
  );
}
