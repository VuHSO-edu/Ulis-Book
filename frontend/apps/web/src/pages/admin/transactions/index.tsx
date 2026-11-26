import { useMemo, useRef, useState } from 'react';
import {
  Input,
  MaterialIcon,
  Select,
  Table,
  Tag,
  Tooltip,
  type TableProps,
} from '@ulis/components';
import { translate } from '@ulis/locale';
import { formatCurrencyVnd } from '@ulis/utils';
import { useAdminTransactions } from '../../../services/v2';
import type { InvoiceItem } from '../../../services/mock-data';

/**
 * Màn hình Quản lý Lịch sử Giao dịch của User cho Admin (TASK-03):
 * Theo dõi toàn bộ hóa đơn mua bán sách trong Chat, số lần nhắc nhở (tối đa 3 lần) và biến động điểm uy tín (+1 / -1).
 */
export default function AdminTransactionsPage() {
  const { data: invoices = [], isLoading } = useAdminTransactions();
  const [keyword, setKeyword] = useState('');
  const [inputKw, setInputKw] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [focusedRowId, setFocusedRowId] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchInput = (val: string) => {
    setInputKw(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setKeyword(val.trim());
      setCurrentPage(1);
      setFocusedRowId(null);
    }, 500);
  };

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      if (statusFilter !== 'ALL' && inv.status !== statusFilter) return false;
      if (keyword) {
        const kw = keyword.toLowerCase();
        const matchCode = inv.invoiceCode.toLowerCase().includes(kw);
        const matchSeller =
          inv.sellerName.toLowerCase().includes(kw) || inv.sellerEmail.toLowerCase().includes(kw);
        const matchBuyer =
          inv.buyerName.toLowerCase().includes(kw) || inv.buyerEmail.toLowerCase().includes(kw);
        const matchBook = inv.items.some(
          (i) =>
            i.bookTitle.toLowerCase().includes(kw) ||
            (i.bookCode ?? '').toLowerCase().includes(kw) ||
            (i.courseCode ?? '').toLowerCase().includes(kw),
        );
        return matchCode || matchSeller || matchBuyer || matchBook;
      }
      return true;
    });
  }, [invoices, statusFilter, keyword]);

  const stats = useMemo(() => {
    return {
      total: invoices.length,
      pending: invoices.filter((i) => i.status === 'CONFIRMED_BY_SELLER').length,
      completed: invoices.filter((i) => i.status === 'COMPLETED').length,
      failed: invoices.filter((i) => i.status === 'FAILED').length,
    };
  }, [invoices]);

  const columns: TableProps<InvoiceItem>['columns'] = [
    {
      title: translate('common:stt'),
      key: 'stt',
      width: 60,
      align: 'center',
      render: (_v, _r, idx) => (currentPage - 1) * 10 + idx + 1,
    },
    {
      title: translate('admin:transactions.colCode'),
      dataIndex: 'invoiceCode',
      key: 'invoiceCode',
      width: 115,
      render: (code: string) => (
        <strong style={{ color: 'var(--ulis-french-blue)', fontFamily: 'monospace' }}>
          {code}
        </strong>
      ),
    },
    {
      title: translate('admin:transactions.colSeller'),
      key: 'seller',
      width: 210,
      render: (_v, rec) => {
        const low = rec.sellerReputation < 3;
        return (
          <div>
            <div style={{ fontWeight: 700 }}>{rec.sellerName}</div>
            <div style={{ fontSize: 11.5, color: '#596377' }}>{rec.sellerEmail}</div>
            <Tag color={low ? 'error' : 'success'} style={{ marginTop: 3 }}>
              {low
                ? `⚠️ Uy tín: ${rec.sellerReputation}/5`
                : `★ Uy tín: ${rec.sellerReputation}/5`}
            </Tag>
          </div>
        );
      },
    },
    {
      title: translate('admin:transactions.colBuyer'),
      key: 'buyer',
      width: 210,
      render: (_v, rec) => {
        const low = rec.buyerReputation < 3;
        return (
          <div>
            <div style={{ fontWeight: 700 }}>{rec.buyerName}</div>
            <div style={{ fontSize: 11.5, color: '#596377' }}>{rec.buyerEmail}</div>
            <Tag color={low ? 'error' : 'success'} style={{ marginTop: 3 }}>
              {low
                ? `⚠️ Uy tín: ${rec.buyerReputation}/5`
                : `★ Uy tín: ${rec.buyerReputation}/5`}
            </Tag>
          </div>
        );
      },
    },
    {
      title: translate('admin:transactions.colBooks'),
      key: 'books',
      render: (_v, rec) => (
        <div>
          {rec.items.map((item) => (
            <Tooltip key={item.bookPostId} title={item.bookTitle}>
              <div style={{ fontSize: 12.5, marginBottom: 2 }}>
                <strong>[{item.bookCode || item.courseCode}]</strong> {item.bookTitle} (SL:{' '}
                {item.quantity})
              </div>
            </Tooltip>
          ))}
        </div>
      ),
    },
    {
      title: translate('admin:transactions.colAmount'),
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 125,
      align: 'right',
      render: (amt: number) => (
        <strong style={{ color: 'var(--ulis-french-blue)' }}>{formatCurrencyVnd(amt)}</strong>
      ),
    },
    {
      title: translate('admin:transactions.colMeetup'),
      key: 'meetup',
      width: 180,
      render: (_v, rec) => (
        <div style={{ fontSize: 12 }}>
          <div style={{ fontWeight: 600 }}>📍 {rec.meetLocation}</div>
          <div style={{ color: '#596377' }}>🕒 {rec.meetTime}</div>
        </div>
      ),
    },
    {
      title: translate('admin:transactions.colReminders'),
      key: 'reminders',
      width: 115,
      align: 'center',
      render: (_v, rec) => (
        <Tag color={rec.reminderCount >= 3 ? 'red' : rec.reminderCount > 0 ? 'gold' : 'default'}>
          {rec.reminderCount}/{rec.maxReminders} lần
        </Tag>
      ),
    },
    {
      title: translate('admin:transactions.colStatus'),
      key: 'status',
      width: 195,
      align: 'center',
      render: (_v, rec) => {
        if (rec.status === 'COMPLETED') {
          return (
            <div>
              <Tag color="success">COMPLETED</Tag>
              <div style={{ fontSize: 11, color: '#2e6f5e', fontWeight: 700, marginTop: 2 }}>
                {translate('admin:transactions.reputationDeltaPlus')}
              </div>
            </div>
          );
        }
        if (rec.status === 'FAILED') {
          return (
            <div>
              <Tag color="error">FAILED</Tag>
              <div style={{ fontSize: 11, color: '#c83e3b', fontWeight: 700, marginTop: 2 }}>
                {translate('admin:transactions.reputationDeltaMinus')}
              </div>
            </div>
          );
        }
        return (
          <div>
            <Tag color="processing">CONFIRMED</Tag>
            <div style={{ fontSize: 11, color: '#596377', marginTop: 2 }}>
              {translate('admin:transactions.reputationDeltaPending')}
            </div>
          </div>
        );
      },
    },
    {
      title: translate('admin:transactions.colCreatedAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 125,
      align: 'center',
    },
  ];

  return (
    <div>
      <div className="ulis-admin-page-header">
        <div>
          <h1>{translate('admin:transactions.title')}</h1>
          <div className="page-subtitle">{translate('admin:transactions.subtitle')}</div>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="ulis-kpi-grid">
        <div className="ulis-kpi-card">
          <div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
              {translate('admin:transactions.statTotal')}
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--ulis-midnight-violet)' }}>
              {stats.total}
            </div>
          </div>
          <MaterialIcon name="receipt_long" size={28} style={{ color: 'var(--ulis-french-blue)' }} />
        </div>

        <div className="ulis-kpi-card">
          <div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
              {translate('admin:transactions.statPending')}
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#c98a2c' }}>
              {stats.pending}
            </div>
          </div>
          <MaterialIcon name="pending_actions" size={28} style={{ color: '#c98a2c' }} />
        </div>

        <div className="ulis-kpi-card">
          <div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
              {translate('admin:transactions.statCompleted')}
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#2e6f5e' }}>
              {stats.completed}
            </div>
          </div>
          <MaterialIcon name="verified" size={28} style={{ color: '#2e6f5e' }} />
        </div>

        <div className="ulis-kpi-card">
          <div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
              {translate('admin:transactions.statFailed')}
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#c83e3b' }}>
              {stats.failed}
            </div>
          </div>
          <MaterialIcon name="report_problem" size={28} style={{ color: '#c83e3b' }} />
        </div>
      </div>

      {/* Filter Bar */}
      <div
        className="ulis-admin-filter-bar"
        style={{ gridTemplateColumns: '1fr 290px' }}
      >
        <Input
          value={inputKw}
          onChange={(e) => handleSearchInput(e.target.value)}
          placeholder={translate('admin:transactions.filterSearchPlaceholder')}
          prefix={<MaterialIcon name="search" size={18} style={{ color: '#64748b' }} />}
          allowClear
        />

        <Select
          value={statusFilter}
          onChange={(val) => {
            setStatusFilter(val);
            setCurrentPage(1);
            setFocusedRowId(null);
          }}
          options={[
            { value: 'ALL', label: translate('admin:transactions.filterStatusAll') },
            {
              value: 'CONFIRMED_BY_SELLER',
              label: translate('admin:transactions.filterStatusConfirmed'),
            },
            {
              value: 'COMPLETED',
              label: translate('admin:transactions.filterStatusCompleted'),
            },
            {
              value: 'FAILED',
              label: translate('admin:transactions.filterStatusFailed'),
            },
          ]}
        />
      </div>

      {/* Transactions Grid */}
      <div className="ulis-admin-table-card ulis-data-table">
        <Table<InvoiceItem>
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={filtered}
          rowClassName={(record) => (record.id === focusedRowId ? 'ulis-row-focused' : '')}
          onRow={(record) => ({
            onClick: () => setFocusedRowId(record.id),
          })}
          pagination={{
            current: currentPage,
            pageSize: 10,
            total: filtered.length,
            showSizeChanger: false,
            onChange: (p) => setCurrentPage(p),
            showTotal: (total) => translate('common:totalRecords', { total }),
          }}
        />
      </div>
    </div>
  );
}
