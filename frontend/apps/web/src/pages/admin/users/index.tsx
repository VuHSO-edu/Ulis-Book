import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Input,
  MaterialIcon,
  Select,
  Table,
  Tag,
  Tooltip,
  message,
  type TableProps,
} from '@ulis/components';
import { translate } from '@ulis/locale';
import { useAdminBookPosts, useAdminToggleBanUser, useAdminUsers } from '../../../services/admin';
import { useAdminStore } from '../../../store/useAdminStore';
import { showBhttConfirm } from '../../../components/bhtt-confirm';
import type { StudentUserItem } from '../../../services/mock-data';

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const { data: users = [], isLoading } = useAdminUsers();
  const toggleBanUser = useAdminToggleBanUser();

  const userKeyword = useAdminStore((s) => s.userKeyword);
  const userStatusFilter = useAdminStore((s) => s.userStatusFilter);
  const userPage = useAdminStore((s) => s.userPage);
  const focusedUserId = useAdminStore((s) => s.focusedUserId);
  const setUserFilter = useAdminStore((s) => s.setUserFilter);
  const focusRowByTableAction = useAdminStore((s) => s.focusRowByTableAction);
  const clearFocusedRow = useAdminStore((s) => s.clearFocusedRow);

  const [inputKeyword, setInputKeyword] = useState(userKeyword);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleKeywordChange = (val: string) => {
    setInputKeyword(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const latest = useAdminStore.getState();
      latest.clearFocusedRow('users');
      latest.setUserFilter({ userKeyword: val.trim(), userPage: 1 });
    }, 500);
  };

  const filteredUsers = users.filter((u) => {
    if (userStatusFilter !== 'ALL' && u.status !== userStatusFilter) return false;
    if (userKeyword) {
      const kw = userKeyword.toLowerCase();
      return (
        u.msv.toLowerCase().includes(kw) ||
        u.fullName.toLowerCase().includes(kw) ||
        u.email.toLowerCase().includes(kw) ||
        u.faculty.toLowerCase().includes(kw)
      );
    }
    return true;
  });

  const handleToggleBan = (record: StudentUserItem) => {
    showBhttConfirm({
      content: translate('common:deleteConfirmMessage'),
      onConfirm: () => {
        toggleBanUser.mutate(record.id, {
          onSuccess: (id) => {
            focusRowByTableAction('users', id);
            message.success(translate('admin:users.banSuccess'));
          },
        });
      },
    });
  };

  const columns: TableProps<StudentUserItem>['columns'] = [
    {
      title: translate('common:stt'),
      key: 'stt',
      width: 60,
      align: 'center',
      render: (_v, _r, idx) => (userPage - 1) * 10 + idx + 1,
    },
    {
      title: translate('admin:users.colMsv'),
      dataIndex: 'msv',
      key: 'msv',
      width: 120,
      align: 'left',
      render: (val: string) => <strong style={{ fontFamily: 'monospace' }}>{val}</strong>,
    },
    {
      title: translate('admin:users.colStudent'),
      dataIndex: 'fullName',
      key: 'fullName',
      align: 'left',
      render: (val: string, record) => (
        <div>
          <div style={{ fontWeight: 700 }}>{val}</div>
          <div style={{ fontSize: 11.5, color: '#596377' }}>{record.phone}</div>
        </div>
      ),
    },
    {
      title: translate('admin:users.colEmail'),
      dataIndex: 'email',
      key: 'email',
      width: 220,
      align: 'left',
      render: (val: string) => (
        <span style={{ color: '#006c49', fontWeight: 700 }}>✓ {val}</span>
      ),
    },
    {
      title: translate('admin:users.colFaculty'),
      dataIndex: 'faculty',
      key: 'faculty',
      align: 'left',
      render: (val: string, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{val}</div>
          <div style={{ fontSize: 11.5, color: '#596377' }}>{record.className}</div>
        </div>
      ),
    },
    {
      title: translate('admin:users.colPostCount'),
      dataIndex: 'postCount',
      key: 'postCount',
      width: 105,
      align: 'right',
      render: (val: number, record) => {
        const computed = allPosts.filter(
          (p) =>
            p.seller.id === record.id ||
            (p.seller.email &&
              record.email &&
              p.seller.email.toLowerCase() === record.email.toLowerCase()),
        ).length;
        return computed > 0 ? computed : val;
      },
    },
    {
      title: translate('admin:users.colCreatedAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 115,
      align: 'center',
    },
    {
      title: translate('admin:users.colStatus'),
      dataIndex: 'status',
      key: 'status',
      width: 130,
      align: 'center',
      render: (st: StudentUserItem['status']) => {
        const color = st === 'ACTIVE' ? 'success' : st === 'BANNED' ? 'error' : 'warning';
        return <Tag color={color}>{st}</Tag>;
      },
    },
    {
      title: translate('common:actions'),
      key: 'actions',
      width: 130,
      align: 'center',
      render: (_v, record) => (
        <div className="ulis-table-action-icons">
          <Tooltip title={translate('button:toggleBan')}>
            <button
              type="button"
              className="ulis-action-icon-btn danger"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleBan(record);
              }}
            >
              <MaterialIcon name={record.status === 'BANNED' ? 'lock_open' : 'block'} size={17} />
            </button>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="ulis-admin-page-header">
        <div>
          <h1>{translate('admin:users.title')}</h1>
          <div className="page-subtitle">{translate('admin:users.subtitle')}</div>
        </div>

        <div className="ulis-admin-segmented">
          <button type="button" className="seg-btn" onClick={() => navigate('/admin/book-posts')}>
            {translate('admin:navPosts')}
          </button>
          <button type="button" className="seg-btn active">
            {translate('admin:navUsers')} ({users.length})
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        className="ulis-admin-filter-bar"
        style={{ gridTemplateColumns: '2fr 1fr auto' }}
      >
        <Input
          value={inputKeyword}
          onChange={(e) => handleKeywordChange(e.target.value)}
          placeholder={translate('admin:users.filterKeywordPlaceholder')}
          prefix={<MaterialIcon name="search" size={17} style={{ color: '#64748b' }} />}
          allowClear
        />

        <Select
          popupMatchSelectWidth={false}
          value={userStatusFilter}
          onChange={(val) => {
            clearFocusedRow('users');
            setUserFilter({ userStatusFilter: val, userPage: 1 });
          }}
          options={[
            { value: 'ALL', label: translate('admin:reports.filterStatusAll') },
            { value: 'ACTIVE', label: translate('admin:users.statusActive') },
            { value: 'INACTIVE', label: translate('admin:users.statusInactive') },
            { value: 'BANNED', label: translate('admin:users.statusBanned') },
          ]}
        />

        <Button
          onClick={() => {
            setInputKeyword('');
            clearFocusedRow('users');
            setUserFilter({ userKeyword: '', userStatusFilter: 'ALL', userPage: 1 });
          }}
        >
          {translate('button:reset')}
        </Button>
      </div>

      <div className="ulis-data-table ulis-admin-table-card">
        <Table<StudentUserItem>
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={filteredUsers}
          rowClassName={(record) => (record.id === focusedUserId ? 'ulis-row-focused' : '')}
          onRow={(record) => ({
            onClick: () => focusRowByTableAction('users', record.id),
          })}
          pagination={{
            current: userPage,
            pageSize: 10,
            total: filteredUsers.length,
            showSizeChanger: false,
            onChange: (p) => setUserFilter({ userPage: p }),
            showTotal: (total) => translate('common:totalRecords', { total }),
          }}
        />
      </div>
    </div>
  );
}
