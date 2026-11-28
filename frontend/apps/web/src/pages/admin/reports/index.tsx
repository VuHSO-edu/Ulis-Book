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
import { useAdminReports, useResolveReport } from '../../../services/admin';
import { useAdminStore } from '../../../store/useAdminStore';
import { showBhttConfirm } from '../../../components/bhtt-confirm';
import type { ReportItem, ReportSourceType, ReportStatusType } from '../../../services/mock-data';

export default function AdminReportsPage() {
  const navigate = useNavigate();
  const { data: reports = [], isLoading } = useAdminReports();
  const resolveReport = useResolveReport();

  const reportKeyword = useAdminStore((s) => s.reportKeyword);
  const reportSourceFilter = useAdminStore((s) => s.reportSourceFilter);
  const reportStatusFilter = useAdminStore((s) => s.reportStatusFilter);
  const reportPage = useAdminStore((s) => s.reportPage);
  const focusedReportId = useAdminStore((s) => s.focusedReportId);
  const setReportFilter = useAdminStore((s) => s.setReportFilter);
  const focusRowByTableAction = useAdminStore((s) => s.focusRowByTableAction);
  const clearFocusedRow = useAdminStore((s) => s.clearFocusedRow);

  const [inputKeyword, setInputKeyword] = useState(reportKeyword);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Global Rules §4: Debounce 500ms + useAdminStore.getState() trong setTimeout + reset về trang 1
  const handleKeywordChange = (val: string) => {
    setInputKeyword(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const latest = useAdminStore.getState();
      latest.clearFocusedRow('reports');
      latest.setReportFilter({ reportKeyword: val.trim(), reportPage: 1 });
    }, 500);
  };

  const filteredReports = reports.filter((r) => {
    if (reportSourceFilter !== 'ALL' && r.sourceType !== reportSourceFilter) return false;
    if (reportStatusFilter !== 'ALL' && r.status !== reportStatusFilter) return false;
    if (reportKeyword) {
      const kw = reportKeyword.toLowerCase();
      return (
        r.reportCode.toLowerCase().includes(kw) ||
        r.targetTitle.toLowerCase().includes(kw) ||
        r.reporterEmail.toLowerCase().includes(kw) ||
        r.description.toLowerCase().includes(kw)
      );
    }
    return true;
  });

  const pendingCount = reports.filter((r) => r.status === 'PENDING').length;
  const highCount = reports.filter((r) => r.severity === 'HIGH').length;
  const resolvedCount = reports.filter((r) => r.status === 'RESOLVED').length;
  const dismissedCount = reports.filter((r) => r.status === 'DISMISSED').length;

  const handleResolveAction = (record: ReportItem, status: ReportStatusType) => {
    showBhttConfirm({
      content:
        status === 'RESOLVED'
          ? 'Bạn có chắc chắn muốn xử lý & khoá/gỡ đối tượng vi phạm này không?'
          : 'Bạn có chắc chắn muốn bỏ qua (từ chối) báo cáo vi phạm này không?',
      onConfirm: () => {
        resolveReport.mutate(
          { id: record.id, status },
          {
            onSuccess: (id) => {
              focusRowByTableAction('reports', id);
              message.success(
                status === 'RESOLVED'
                  ? translate('admin:reports.resolvedSuccess')
                  : translate('admin:reports.dismissedSuccess'),
              );
            },
            onError: () => {
              message.error(translate('common:unknownError'));
            },
          },
        );
      },
    });
  };

  const columns: TableProps<ReportItem>['columns'] = [
    {
      title: translate('common:stt'),
      key: 'stt',
      width: 60,
      align: 'center',
      render: (_v, _r, idx) => (reportPage - 1) * 10 + idx + 1,
    },
    {
      title: translate('admin:reports.colCode'),
      dataIndex: 'reportCode',
      key: 'reportCode',
      width: 110,
      align: 'left',
      render: (val: string) => <strong style={{ fontFamily: 'monospace' }}>{val}</strong>,
    },
    {
      title: translate('admin:reports.colSource'),
      dataIndex: 'targetTitle',
      key: 'targetTitle',
      align: 'left',
      ellipsis: true,
      render: (_v, record) => (
        <Tooltip title={record.targetTitle}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Tag
                color={
                  record.sourceType === 'POST'
                    ? 'blue'
                    : record.sourceType === 'USER'
                      ? 'purple'
                      : 'cyan'
                }
              >
                {record.sourceType}
              </Tag>
              <strong style={{ fontSize: 13 }}>{record.targetTitle}</strong>
            </div>
            <div style={{ fontSize: 11.5, color: '#596377' }}>{record.targetSubtitle}</div>
          </div>
        </Tooltip>
      ),
    },
    {
      title: translate('admin:reports.colReason'),
      dataIndex: 'description',
      key: 'description',
      align: 'left',
      ellipsis: true,
      render: (_v, record) => (
        <Tooltip title={record.description}>
          <div>
            <span
              style={{
                display: 'inline-block',
                padding: '1px 7px',
                borderRadius: 4,
                background: record.severity === 'HIGH' ? '#ffdad6' : '#ffddb8',
                color: record.severity === 'HIGH' ? '#93000a' : '#784b00',
                fontSize: 11,
                fontWeight: 800,
                marginBottom: 3,
              }}
            >
              {record.reasonLabel}
            </span>
            <div style={{ fontSize: 12, color: '#434655' }}>{record.description}</div>
          </div>
        </Tooltip>
      ),
    },
    {
      title: translate('admin:reports.colReporter'),
      dataIndex: 'reporterName',
      key: 'reporterName',
      width: 195,
      align: 'left',
      render: (_v, record) => (
        <div>
          <div style={{ fontWeight: 700 }}>{record.reporterName}</div>
          <div style={{ fontSize: 11.5, color: '#006c49' }}>✓ {record.reporterEmail}</div>
        </div>
      ),
    },
    {
      title: translate('admin:reports.colCreatedAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 115,
      align: 'center',
      render: (_v, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record.createdAt}</div>
          <div style={{ fontSize: 11, color: '#737686' }}>{record.createdTime}</div>
        </div>
      ),
    },
    {
      title: translate('admin:reports.colStatus'),
      dataIndex: 'status',
      key: 'status',
      width: 130,
      align: 'center',
      render: (st: ReportStatusType) => {
        const color = st === 'PENDING' ? 'warning' : st === 'RESOLVED' ? 'success' : 'default';
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
                if (record.sourceType === 'POST') {
                  navigate(`/books/${record.targetId}`);
                } else if (record.sourceType === 'USER') {
                  navigate('/admin/users');
                } else {
                  message.info(`Đối tượng #${record.targetId} (${record.sourceType})`);
                }
              }}
            >
              <MaterialIcon name="visibility" size={17} />
            </button>
          </Tooltip>

          <Tooltip title={translate('admin:reports.actionResolveBan')}>
            <button
              type="button"
              className="ulis-action-icon-btn danger"
              onClick={(e) => {
                e.stopPropagation();
                handleResolveAction(record, 'RESOLVED');
              }}
            >
              <MaterialIcon name="gavel" size={17} />
            </button>
          </Tooltip>

          <Tooltip title={translate('admin:reports.actionDismiss')}>
            <button
              type="button"
              className="ulis-action-icon-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleResolveAction(record, 'DISMISSED');
              }}
            >
              <MaterialIcon name="cancel" size={17} />
            </button>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="ulis-admin-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1>{translate('admin:reports.title')}</h1>
            <span
              style={{
                padding: '3px 10px',
                borderRadius: 6,
                background: '#fef3c7',
                color: '#b45309',
                fontSize: 11.5,
                fontWeight: 700,
              }}
            >
              {translate('admin:reports.pendingBadge', { count: pendingCount })}
            </span>
          </div>
        </div>
      </div>

      {/* 4 KPI Cards — Flat & Uniform Palette */}
      <div className="ulis-kpi-grid">
        <div className="ulis-kpi-card">
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
              {translate('admin:reports.statPending')}
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#f59e0b' }}>{pendingCount}</div>
          </div>
          <span
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: '#fef3c7',
              color: '#f59e0b',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialIcon name="pending_actions" size={20} />
          </span>
        </div>

        <div className="ulis-kpi-card">
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
              {translate('admin:reports.statHigh')}
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#ef4444' }}>{highCount}</div>
          </div>
          <span
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: '#fee2e2',
              color: '#ef4444',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialIcon name="gpp_maybe" size={20} />
          </span>
        </div>

        <div className="ulis-kpi-card">
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
              {translate('admin:reports.statResolved')}
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#10b981' }}>{resolvedCount}</div>
          </div>
          <span
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: '#d1fae5',
              color: '#10b981',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialIcon name="task_alt" size={20} />
          </span>
        </div>

        <div className="ulis-kpi-card">
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
              {translate('admin:reports.statDismissed')}
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#0f172a' }}>{dismissedCount}</div>
          </div>
          <span
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: '#f1f5f9',
              color: '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialIcon name="block" size={20} />
          </span>
        </div>
      </div>

      {/* Debounced Filter Bar */}
      <div
        className="ulis-admin-filter-bar"
        style={{ gridTemplateColumns: '2fr 1fr 1fr auto' }}
      >
        <Input
          value={inputKeyword}
          onChange={(e) => handleKeywordChange(e.target.value)}
          placeholder={translate('admin:reports.filterSearchPlaceholder')}
          prefix={<MaterialIcon name="search" size={17} style={{ color: '#64748b' }} />}
          allowClear
        />

        <Select
          popupMatchSelectWidth={false}
          value={reportSourceFilter}
          onChange={(val) => {
            clearFocusedRow('reports');
            setReportFilter({
              reportSourceFilter: val as 'ALL' | ReportSourceType,
              reportPage: 1,
            });
          }}
          options={[
            { value: 'ALL', label: translate('admin:reports.filterSourceAll') },
            { value: 'POST', label: translate('admin:reports.filterSourcePost') },
            { value: 'USER', label: translate('admin:reports.filterSourceUser') },
            { value: 'COMMENT', label: translate('admin:reports.filterSourceComment') },
          ]}
        />

        <Select
          popupMatchSelectWidth={false}
          value={reportStatusFilter}
          onChange={(val) => {
            clearFocusedRow('reports');
            setReportFilter({
              reportStatusFilter: val as 'ALL' | ReportStatusType,
              reportPage: 1,
            });
          }}
          options={[
            { value: 'ALL', label: translate('admin:reports.filterStatusAll') },
            { value: 'PENDING', label: translate('admin:reports.filterStatusPending') },
            { value: 'RESOLVED', label: translate('admin:reports.filterStatusResolved') },
            { value: 'DISMISSED', label: translate('admin:reports.filterStatusDismissed') },
          ]}
        />

        <Button
          onClick={() => {
            setInputKeyword('');
            clearFocusedRow('reports');
            setReportFilter({
              reportKeyword: '',
              reportSourceFilter: 'ALL',
              reportStatusFilter: 'ALL',
              reportPage: 1,
            });
          }}
        >
          {translate('button:reset')}
        </Button>
      </div>

      {/* Moderation Table Grid */}
      <div className="ulis-data-table ulis-admin-table-card">
        <Table<ReportItem>
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={filteredReports}
          rowClassName={(record) => (record.id === focusedReportId ? 'ulis-row-focused' : '')}
          onRow={(record) => ({
            onClick: () => focusRowByTableAction('reports', record.id),
          })}
          pagination={{
            current: reportPage,
            pageSize: 10,
            total: filteredReports.length,
            showSizeChanger: false,
            onChange: (p) => setReportFilter({ reportPage: p }),
            showTotal: (total) => translate('common:totalRecords', { total }),
          }}
        />
      </div>
    </div>
  );
}
