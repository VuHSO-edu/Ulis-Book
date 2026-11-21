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
import { formatCurrencyVnd } from '@ulis/utils';
import {
  useAdminBookPosts,
  useAdminCategories,
  useAdminToggleBanPost,
} from '../../../services/admin';
import { useDeleteBookPost } from '../../../services/books';
import { useAdminStore } from '../../../store/useAdminStore';
import { showBhttConfirm } from '../../../components/bhtt-confirm';
import type { BookPostItem } from '../../../services/mock-data';

export default function AdminBookPostsPage() {
  const navigate = useNavigate();
  const { data: posts = [], isLoading } = useAdminBookPosts();
  const { data: categories = [] } = useAdminCategories();
  const toggleBanPost = useAdminToggleBanPost();
  const deletePost = useDeleteBookPost();

  const postKeyword = useAdminStore((s) => s.postKeyword);
  const postFacultyFilter = useAdminStore((s) => s.postFacultyFilter);
  const postStatusFilter = useAdminStore((s) => s.postStatusFilter);
  const postPage = useAdminStore((s) => s.postPage);
  const focusedPostId = useAdminStore((s) => s.focusedPostId);
  const setPostFilter = useAdminStore((s) => s.setPostFilter);
  const focusRowByTableAction = useAdminStore((s) => s.focusRowByTableAction);
  const clearFocusedRow = useAdminStore((s) => s.clearFocusedRow);

  const [inputKeyword, setInputKeyword] = useState(postKeyword);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleKeywordChange = (val: string) => {
    setInputKeyword(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const latest = useAdminStore.getState();
      latest.clearFocusedRow('posts');
      latest.setPostFilter({ postKeyword: val.trim(), postPage: 1 });
    }, 500);
  };

  const faculties = categories.filter((c) => c.parentAxis === 'FACULTY');

  const filteredPosts = posts.filter((p) => {
    if (postFacultyFilter !== 'ALL' && p.facultyCode !== postFacultyFilter) return false;
    if (postStatusFilter !== 'ALL' && p.status !== postStatusFilter) return false;
    if (postKeyword) {
      const kw = postKeyword.toLowerCase();
      return (
        p.code.toLowerCase().includes(kw) ||
        p.courseCode.toLowerCase().includes(kw) ||
        p.title.toLowerCase().includes(kw) ||
        p.seller.fullName.toLowerCase().includes(kw) ||
        p.seller.email.toLowerCase().includes(kw)
      );
    }
    return true;
  });

  const handleToggleBan = (record: BookPostItem) => {
    showBhttConfirm({
      content: translate('common:deleteConfirmMessage'),
      onConfirm: () => {
        toggleBanPost.mutate(record.id, {
          onSuccess: (id) => {
            focusRowByTableAction('posts', id);
            message.success(translate('admin:posts.banSuccess'));
          },
        });
      },
    });
  };

  const handleSoftDelete = (record: BookPostItem) => {
    showBhttConfirm({
      content: translate('common:deleteConfirmMessage'),
      onConfirm: () => {
        deletePost.mutate(record.id, {
          onSuccess: (id) => {
            focusRowByTableAction('posts', id);
            message.success(translate('admin:posts.deleteSuccess'));
          },
        });
      },
    });
  };

  const columns: TableProps<BookPostItem>['columns'] = [
    {
      title: translate('common:stt'),
      key: 'stt',
      width: 60,
      align: 'center',
      render: (_v, _r, idx) => (postPage - 1) * 10 + idx + 1,
    },
    {
      title: translate('admin:posts.colCode'),
      dataIndex: 'code',
      key: 'code',
      width: 135,
      align: 'left',
      render: (val: string) => <strong style={{ fontFamily: 'monospace' }}>{val}</strong>,
    },
    {
      title: translate('admin:posts.colBook'),
      dataIndex: 'title',
      key: 'title',
      width: 260,
      align: 'left',
      ellipsis: true,
      render: (val: string, record) => (
        <Tooltip title={val}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 40,
                borderRadius: 4,
                background: '#eef2ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                overflow: 'hidden',
              }}
            >
              {record.coverUrl ? (
                <img
                  src={record.coverUrl}
                  alt={val}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <MaterialIcon name="menu_book" size={16} />
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {val}
              </div>
              <div style={{ fontSize: 11.5, color: '#596377' }}>
                [{record.courseCode}] · {record.campusLocation}
              </div>
            </div>
          </div>
        </Tooltip>
      ),
    },
    {
      title: translate('admin:posts.colSeller'),
      dataIndex: 'seller',
      key: 'seller',
      width: 205,
      align: 'left',
      render: (_v, record) => (
        <div>
          <div style={{ fontWeight: 700 }}>
            {record.seller.fullName}
            {record.seller.msv && record.seller.msv !== '—' ? ` (${record.seller.msv})` : ''}
          </div>
          <div style={{ fontSize: 11.5, color: '#006c49' }}>✓ {record.seller.email}</div>
        </div>
      ),
    },
    {
      title: translate('admin:posts.colCategory'),
      dataIndex: 'facultyName',
      key: 'facultyName',
      width: 190,
      align: 'left',
      render: (_v, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record.facultyName}</div>
          <div style={{ fontSize: 11, color: '#596377' }}>{record.bookTypeName}</div>
        </div>
      ),
    },
    {
      title: translate('admin:posts.colPrice'),
      dataIndex: 'price',
      key: 'price',
      width: 120,
      align: 'right',
      render: (price: number, record) => (
        <strong style={{ color: record.isGiveaway ? '#d97706' : '#004ac6' }}>
          {record.isGiveaway ? translate('home:freeTag') : formatCurrencyVnd(price)}
        </strong>
      ),
    },
    {
      title: translate('admin:posts.colViews'),
      dataIndex: 'viewCount',
      key: 'viewCount',
      width: 90,
      align: 'right',
    },
    {
      title: translate('admin:posts.colCreatedAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 105,
      align: 'center',
    },
    {
      title: translate('admin:posts.colStatus'),
      dataIndex: 'status',
      key: 'status',
      width: 110,
      align: 'center',
      render: (st: BookPostItem['status']) => {
        const color =
          st === 'SELLING'
            ? 'success'
            : st === 'SOLD'
              ? 'processing'
              : st === 'BANNED'
                ? 'error'
                : 'default';
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
          <Tooltip title={translate('button:viewDetail')}>
            <button
              type="button"
              className="ulis-action-icon-btn"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/books/${record.id}`);
              }}
            >
              <MaterialIcon name="visibility" size={17} />
            </button>
          </Tooltip>

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

          <Tooltip title={translate('button:delete')}>
            <button
              type="button"
              className="ulis-action-icon-btn danger"
              onClick={(e) => {
                e.stopPropagation();
                handleSoftDelete(record);
              }}
            >
              <MaterialIcon name="delete" size={17} />
            </button>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Page Header + Segmented Switcher */}
      <div className="ulis-admin-page-header">
        <div>
          <h1>{translate('admin:posts.title')}</h1>
          <div className="page-subtitle">{translate('admin:posts.subtitle')}</div>
        </div>

        <div className="ulis-admin-segmented">
          <button type="button" className="seg-btn active">
            {translate('admin:navPosts')} ({posts.length})
          </button>
          <button type="button" className="seg-btn" onClick={() => navigate('/admin/users')}>
            {translate('admin:navUsers')}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        className="ulis-admin-filter-bar"
        style={{ gridTemplateColumns: '2fr 1fr 1fr auto' }}
      >
        <Input
          value={inputKeyword}
          onChange={(e) => handleKeywordChange(e.target.value)}
          placeholder={translate('admin:posts.filterKeywordPlaceholder')}
          prefix={<MaterialIcon name="search" size={17} style={{ color: '#64748b' }} />}
          allowClear
        />

        <Select
          popupMatchSelectWidth={false}
          value={postFacultyFilter}
          onChange={(val) => {
            clearFocusedRow('posts');
            setPostFilter({ postFacultyFilter: val, postPage: 1 });
          }}
          options={[
            { value: 'ALL', label: translate('home:allFaculties') },
            ...faculties.map((f) => ({
              value: f.code,
              label: f.name,
            })),
          ]}
        />

        <Select
          popupMatchSelectWidth={false}
          value={postStatusFilter}
          onChange={(val) => {
            clearFocusedRow('posts');
            setPostFilter({ postStatusFilter: val, postPage: 1 });
          }}
          options={[
            { value: 'ALL', label: translate('admin:reports.filterStatusAll') },
            { value: 'SELLING', label: 'SELLING' },
            { value: 'SOLD', label: 'SOLD' },
            { value: 'HIDDEN', label: 'HIDDEN' },
            { value: 'BANNED', label: 'BANNED' },
          ]}
        />

        <Button
          onClick={() => {
            setInputKeyword('');
            clearFocusedRow('posts');
            setPostFilter({
              postKeyword: '',
              postFacultyFilter: 'ALL',
              postStatusFilter: 'ALL',
              postPage: 1,
            });
          }}
        >
          {translate('button:reset')}
        </Button>
      </div>

      {/* Data Table */}
      <div className="ulis-data-table ulis-admin-table-card">
        <Table<BookPostItem>
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={filteredPosts}
          scroll={{ x: 1150 }}
          rowClassName={(record) => (record.id === focusedPostId ? 'ulis-row-focused' : '')}
          onRow={(record) => ({
            onClick: () => focusRowByTableAction('posts', record.id),
          })}
          pagination={{
            current: postPage,
            pageSize: 10,
            total: filteredPosts.length,
            showSizeChanger: false,
            onChange: (p) => setPostFilter({ postPage: p }),
            showTotal: (total) => translate('common:totalRecords', { total }),
          }}
        />
      </div>
    </div>
  );
}
