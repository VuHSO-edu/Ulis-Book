import { useRef, useState } from 'react';
import {
  Button,
  CustomModalForm,
  Form,
  Input,
  InputNumber,
  MaterialIcon,
  Select,
  Table,
  Tag,
  Tooltip,
  message,
  type TableProps,
} from '@ulis/components';
import { COMMON_VALIDATION_PATTERN, translate } from '@ulis/locale';
import {
  useAdminCategories,
  useAdminDeleteCategory,
  useAdminSaveCategory,
  type UpsertCategoryPayload,
} from '../../../services/admin';
import { useAdminStore } from '../../../store/useAdminStore';
import { showBhttConfirm } from '../../../components/bhtt-confirm';
import type { BookCategoryItem, CategoryAxis } from '../../../services/mock-data';

export default function AdminBookCategoriesPage() {
  const { data: categories = [], isLoading } = useAdminCategories();
  const saveCategory = useAdminSaveCategory();
  const deleteCategory = useAdminDeleteCategory();

  const treeKeyword = useAdminStore((s) => s.treeKeyword);
  const selectedTreeNodeCode = useAdminStore((s) => s.selectedTreeNodeCode);
  const categoryKeyword = useAdminStore((s) => s.categoryKeyword);
  const categoryAxisFilter = useAdminStore((s) => s.categoryAxisFilter);
  const categoryPage = useAdminStore((s) => s.categoryPage);
  const focusedCategoryId = useAdminStore((s) => s.focusedCategoryId);
  const setCategoryFilter = useAdminStore((s) => s.setCategoryFilter);
  const focusRowByTableAction = useAdminStore((s) => s.focusRowByTableAction);
  const clearFocusedRow = useAdminStore((s) => s.clearFocusedRow);

  const [inputKeyword, setInputKeyword] = useState(categoryKeyword);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BookCategoryItem | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [form] = Form.useForm<UpsertCategoryPayload>();

  // Global Rules §4: Server filter debounce 500ms + useAdminStore.getState() + reset page 1
  const handleKeywordChange = (val: string) => {
    setInputKeyword(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const latest = useAdminStore.getState();
      latest.clearFocusedRow('categories');
      latest.setCategoryFilter({ categoryKeyword: val.trim(), categoryPage: 1 });
    }, 500);
  };

  // Tree View Local Filter (Global Rules §4: Chia rõ 2 luồng Local Filter và Server Filter)
  const localFilteredTreeNodes = categories.filter((c) => {
    if (!treeKeyword.trim()) return true;
    const kw = treeKeyword.trim().toLowerCase();
    return c.code.toLowerCase().includes(kw) || c.name.toLowerCase().includes(kw);
  });

  const treeBookTypes = localFilteredTreeNodes.filter((c) => c.parentAxis === 'BOOK_TYPE');
  const treeFaculties = localFilteredTreeNodes.filter((c) => c.parentAxis === 'FACULTY');
  const treeLocations = localFilteredTreeNodes.filter((c) => c.parentAxis === 'CAMPUS_LOCATION');

  // Table Grid Server Filter
  const filteredTableCategories = categories.filter((c) => {
    if (categoryAxisFilter !== 'ALL' && c.parentAxis !== categoryAxisFilter) return false;
    if (selectedTreeNodeCode !== 'ALL' && c.code !== selectedTreeNodeCode) return false;
    if (categoryKeyword) {
      const kw = categoryKeyword.toLowerCase();
      return (
        c.code.toLowerCase().includes(kw) ||
        c.name.toLowerCase().includes(kw) ||
        c.subtitle.toLowerCase().includes(kw)
      );
    }
    return true;
  });

  const openCreateModal = () => {
    setEditingItem(null);
    setIsDirty(false);
    form.setFieldsValue({
      code: '',
      name: '',
      subtitle: '',
      parentAxis: 'FACULTY',
      sortOrder: categories.length + 1,
      status: 'ACTIVE',
    });
    setModalOpen(true);
  };

  const openEditModal = (record: BookCategoryItem) => {
    setEditingItem(record);
    setIsDirty(false);
    form.setFieldsValue({
      id: record.id,
      code: record.code,
      name: record.name,
      subtitle: record.subtitle,
      parentAxis: record.parentAxis,
      sortOrder: record.sortOrder,
      status: record.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    });
    setModalOpen(true);
  };

  const handleFinish = (values: UpsertCategoryPayload) => {
    const cleanName = values.name?.trim() ?? '';
    const cleanCode = values.code?.trim() ?? '';
    if (!cleanName) {
      message.error(
        translate('common:validation.whitespace', {
          field: translate('admin:categories.fieldName'),
        }),
      );
      return;
    }
    saveCategory.mutate(
      {
        ...values,
        id: editingItem?.id,
        code: cleanCode,
        name: cleanName,
        subtitle: values.subtitle?.trim() ?? '',
      },
      {
        onSuccess: (saved) => {
          focusRowByTableAction('categories', saved.id);
          setModalOpen(false);
          setIsDirty(false);
          message.success(translate('admin:categories.savedSuccess'));
        },
        onError: (err) => {
          if (err instanceof Error && err.message.startsWith('DUPLICATE_CODE:')) {
            const dup = err.message.split(':')[1] ?? cleanCode;
            message.error(translate('common:validation.duplicateCode', { code: dup }));
          } else {
            message.error(translate('common:unknownError'));
          }
        },
      },
    );
  };

  const handleDelete = (record: BookCategoryItem) => {
    showBhttConfirm({
      content: translate('common:deleteConfirmMessage'),
      onConfirm: () => {
        deleteCategory.mutate(record.id, {
          onSuccess: () => {
            message.success(translate('admin:categories.deletedSuccess'));
          },
          onError: (err) => {
            if (err instanceof Error && err.message.startsWith('BOUND_BOOKS:')) {
              const count = Number(err.message.split(':')[1] || record.bookCount);
              message.error(translate('admin:categories.cannotDeleteBound', { count }));
            } else {
              message.error(translate('common:unknownError'));
            }
          },
        });
      },
    });
  };

  const columns: TableProps<BookCategoryItem>['columns'] = [
    {
      title: translate('common:stt'),
      key: 'stt',
      width: 60,
      align: 'center',
      render: (_v, _r, idx) => (categoryPage - 1) * 10 + idx + 1,
    },
    {
      title: translate('admin:categories.colCode'),
      dataIndex: 'code',
      key: 'code',
      width: 145,
      align: 'left',
      render: (val: string) => <strong style={{ fontFamily: 'monospace' }}>{val}</strong>,
    },
    {
      title: translate('admin:categories.colName'),
      dataIndex: 'name',
      key: 'name',
      align: 'left',
      ellipsis: true,
      render: (_v, record) => (
        <Tooltip title={record.name}>
          <div>
            <div style={{ fontWeight: 700 }}>{record.name}</div>
            <div style={{ fontSize: 11.5, color: '#64748b' }}>{record.subtitle}</div>
          </div>
        </Tooltip>
      ),
    },
    {
      title: translate('admin:categories.colParent'),
      dataIndex: 'parentAxis',
      key: 'parentAxis',
      width: 120,
      align: 'center',
      render: (axis: CategoryAxis) => (
        <Tag color={axis === 'FACULTY' ? 'blue' : axis === 'BOOK_TYPE' ? 'purple' : 'green'}>
          {axis}
        </Tag>
      ),
    },
    {
      title: translate('admin:categories.colBookCount'),
      dataIndex: 'bookCount',
      key: 'bookCount',
      width: 90,
      align: 'right',
    },
    {
      title: translate('admin:categories.colOrder'),
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80,
      align: 'right',
    },
    {
      title: translate('admin:categories.colUpdatedAt'),
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 110,
      align: 'center',
    },
    {
      title: translate('admin:categories.colStatus'),
      dataIndex: 'status',
      key: 'status',
      width: 105,
      align: 'center',
      render: (st: BookCategoryItem['status']) => (
        <Tag color={st === 'ACTIVE' ? 'success' : 'default'}>{st}</Tag>
      ),
    },
    {
      title: translate('common:actions'),
      key: 'actions',
      width: 130,
      align: 'center',
      render: (_v, record) => (
        <div className="ulis-table-action-icons">
          <Tooltip title={translate('button:edit')}>
            <button
              type="button"
              className="ulis-action-icon-btn"
              onClick={(e) => {
                e.stopPropagation();
                openEditModal(record);
              }}
            >
              <MaterialIcon name="edit_square" size={17} />
            </button>
          </Tooltip>

          <Tooltip title={translate('button:delete')}>
            <button
              type="button"
              className="ulis-action-icon-btn danger"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(record);
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
      {/* Header Row */}
      <div className="ulis-admin-page-header">
        <div>
          <h1>{translate('admin:categories.title')}</h1>
          <div className="page-subtitle">{translate('admin:categories.subtitle')}</div>
        </div>

        <Button type="primary" className="ulis-primary-btn" onClick={openCreateModal}>
          {translate('admin:categories.createBtn')}
        </Button>
      </div>

      {/* 12-Col Split Workspace: Left 4-col Tree View + Right 8-col Data Table */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 18 }}>
        {/* Left: Interactive 2-Axis Academic Tree */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 10,
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '12px 14px',
              borderBottom: '1px solid #e2e8f0',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <strong style={{ fontSize: 13, color: '#0f172a' }}>
              {translate('admin:categories.treeTitle')}
            </strong>
            {selectedTreeNodeCode !== 'ALL' && (
              <button
                type="button"
                onClick={() => setCategoryFilter({ selectedTreeNodeCode: 'ALL', categoryPage: 1 })}
                style={{
                  border: 'none',
                  background: 'none',
                  color: '#2563eb',
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {translate('button:reset')}
              </button>
            )}
          </div>

          <div style={{ padding: 10, borderBottom: '1px solid #f1f5f9' }}>
            <Input
              value={treeKeyword}
              onChange={(e) => setCategoryFilter({ treeKeyword: e.target.value })}
              placeholder={translate('admin:categories.treeSearchPlaceholder')}
              prefix={<MaterialIcon name="filter_alt" size={16} style={{ color: '#64748b' }} />}
              allowClear
            />
          </div>

          <div style={{ padding: 10, overflowY: 'auto', maxHeight: 540 }}>
            {/* Axis 1: BOOK_TYPE */}
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  background: '#eef2ff',
                  color: '#2563eb',
                  fontSize: 12,
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                ▾ {translate('admin:categories.branchBookType')} ({treeBookTypes.length})
              </div>
              {treeBookTypes.map((node) => {
                const active = selectedTreeNodeCode === node.code;
                return (
                  <div
                    key={node.id}
                    onClick={() =>
                      setCategoryFilter({
                        selectedTreeNodeCode: active ? 'ALL' : node.code,
                        categoryPage: 1,
                      })
                    }
                    style={{
                      padding: '8px 10px',
                      marginLeft: 8,
                      borderRadius: 6,
                      background: active ? '#2563eb' : 'transparent',
                      color: active ? '#ffffff' : '#0f172a',
                      fontSize: 12.5,
                      fontWeight: active ? 600 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>{node.name}</span>
                    <span style={{ fontSize: 11, opacity: 0.8 }}>{node.bookCount}</span>
                  </div>
                );
              })}
            </div>

            {/* Axis 2: FACULTY */}
            <div>
              <div
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  background: '#ecfdf5',
                  color: '#059669',
                  fontSize: 12,
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                ▾ {translate('admin:categories.branchFaculty')} ({treeFaculties.length})
              </div>
              {treeFaculties.map((node) => {
                const active = selectedTreeNodeCode === node.code;
                return (
                  <div
                    key={node.id}
                    onClick={() =>
                      setCategoryFilter({
                        selectedTreeNodeCode: active ? 'ALL' : node.code,
                        categoryPage: 1,
                      })
                    }
                    style={{
                      padding: '8px 10px',
                      marginLeft: 8,
                      borderRadius: 6,
                      background: active ? '#2563eb' : 'transparent',
                      color: active ? '#ffffff' : '#0f172a',
                      fontSize: 12.5,
                      fontWeight: active ? 600 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>{node.name}</span>
                    <span style={{ fontSize: 11, opacity: 0.8 }}>{node.bookCount}</span>
                  </div>
                );
              })}
            </div>

            {/* Axis 3: CAMPUS_LOCATION */}
            <div style={{ marginTop: 14 }}>
              <div
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  background: '#fef3c7',
                  color: '#b45309',
                  fontSize: 12,
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                ▾ Địa điểm giao dịch ({treeLocations.length})
              </div>
              {treeLocations.map((node) => {
                const active = selectedTreeNodeCode === node.code;
                return (
                  <div
                    key={node.id}
                    onClick={() =>
                      setCategoryFilter({
                        selectedTreeNodeCode: active ? 'ALL' : node.code,
                        categoryPage: 1,
                      })
                    }
                    style={{
                      padding: '8px 10px',
                      marginLeft: 8,
                      borderRadius: 6,
                      background: active ? '#2563eb' : 'transparent',
                      color: active ? '#ffffff' : '#0f172a',
                      fontSize: 12.5,
                      fontWeight: active ? 600 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>{node.name}</span>
                    <span style={{ fontSize: 11, opacity: 0.8 }}>{node.bookCount}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Server Filter Bar + Category Data Table */}
        <div>
          <div
            className="ulis-admin-filter-bar"
            style={{ gridTemplateColumns: '2fr 1fr auto' }}
          >
            <Input
              value={inputKeyword}
              onChange={(e) => handleKeywordChange(e.target.value)}
              placeholder={translate('admin:categories.filterSearchPlaceholder')}
              prefix={<MaterialIcon name="search" size={17} style={{ color: '#64748b' }} />}
              allowClear
            />

            <Select
              popupMatchSelectWidth={false}
              value={categoryAxisFilter}
              onChange={(val) => {
                clearFocusedRow('categories');
                setCategoryFilter({
                  categoryAxisFilter: val as 'ALL' | CategoryAxis,
                  categoryPage: 1,
                });
              }}
              options={[
                { value: 'ALL', label: translate('admin:categories.filterParentAll') },
                { value: 'FACULTY', label: 'Khoa Đào Tạo' },
                { value: 'BOOK_TYPE', label: 'Loại Tài Liệu' },
                { value: 'CAMPUS_LOCATION', label: 'Địa điểm giao dịch' },
              ]}
            />

            <Button
              onClick={() => {
                setInputKeyword('');
                clearFocusedRow('categories');
                setCategoryFilter({
                  categoryKeyword: '',
                  categoryAxisFilter: 'ALL',
                  selectedTreeNodeCode: 'ALL',
                  categoryPage: 1,
                });
              }}
            >
              {translate('button:reset')}
            </Button>
          </div>

          <div className="ulis-data-table ulis-admin-table-card">
            <Table<BookCategoryItem>
              rowKey="id"
              loading={isLoading}
              columns={columns}
              dataSource={filteredTableCategories}
              rowClassName={(record) =>
                record.id === focusedCategoryId ? 'ulis-row-focused' : ''
              }
              onRow={(record) => ({
                onClick: () => focusRowByTableAction('categories', record.id),
              })}
              pagination={{
                current: categoryPage,
                pageSize: 10,
                total: filteredTableCategories.length,
                showSizeChanger: false,
                onChange: (p) => setCategoryFilter({ categoryPage: p }),
                showTotal: (total) => translate('common:totalRecords', { total }),
              }}
            />
          </div>
        </div>
      </div>

      {/* Category Create / Edit Modal (Stitch Screen 7 Modal: 5b9048fd6b0d475bb2cb424508a5339c) */}
      <CustomModalForm
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={() => form.submit()}
        confirmLoading={saveCategory.isPending}
        isDirty={isDirty}
        width={600}
        title={
          editingItem
            ? translate('admin:categories.editModalTitle')
            : translate('admin:categories.createModalTitle')
        }
      >
        <Form<UpsertCategoryPayload>
          form={form}
          layout="vertical"
          onValuesChange={() => setIsDirty(true)}
          onFinish={handleFinish}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item
              name="code"
              label={translate('admin:categories.fieldCode')}
              extra={
                <span style={{ fontSize: 11 }}>
                  {translate('admin:categories.fieldCodeReadonlyNote')}
                </span>
              }
              rules={[
                {
                  required: true,
                  message: translate('common:validation.required', {
                    field: translate('admin:categories.fieldCode'),
                  }),
                },
                {
                  pattern: COMMON_VALIDATION_PATTERN.CODE,
                  message: translate('common:validation.codePattern', {
                    field: translate('admin:categories.fieldCode'),
                  }),
                },
              ]}
            >
              <Input
                disabled={!!editingItem}
                autoFocus={!editingItem}
                placeholder="ENG_FACULTY"
              />
            </Form.Item>

            <Form.Item
              name="parentAxis"
              label={translate('admin:categories.fieldParent')}
              rules={[
                {
                  required: true,
                  message: translate('common:validation.required', {
                    field: translate('admin:categories.fieldParent'),
                  }),
                },
              ]}
            >
              <Select
                options={[
                  { value: 'FACULTY', label: 'Nhóm Khoa Đào Tạo' },
                  { value: 'BOOK_TYPE', label: 'Nhóm Loại Tài Liệu' },
                  { value: 'CAMPUS_LOCATION', label: 'Địa điểm giao dịch' },
                ]}
              />
            </Form.Item>
          </div>

          <Form.Item
            name="name"
            label={translate('admin:categories.fieldName')}
            rules={[
              {
                required: true,
                message: translate('common:validation.required', {
                  field: translate('admin:categories.fieldName'),
                }),
              },
            ]}
          >
            <Input
              autoFocus={!!editingItem}
              placeholder={translate('admin:categories.fieldNamePlaceholder')}
            />
          </Form.Item>

          <Form.Item name="subtitle" label={translate('admin:categories.fieldSubtitle')}>
            <Input placeholder={translate('admin:categories.fieldSubtitlePlaceholder')} />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item
              name="sortOrder"
              label={translate('admin:categories.fieldSortOrder')}
              rules={[
                {
                  required: true,
                  message: translate('common:validation.required', {
                    field: translate('admin:categories.fieldSortOrder'),
                  }),
                },
              ]}
            >
              <InputNumber min={0} precision={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="status"
              label={translate('admin:categories.fieldStatus')}
              rules={[
                {
                  required: true,
                  message: translate('common:validation.required', {
                    field: translate('admin:categories.fieldStatus'),
                  }),
                },
              ]}
            >
              <Select
                options={[
                  { value: 'ACTIVE', label: 'ACTIVE - Đang hoạt động' },
                  { value: 'INACTIVE', label: 'INACTIVE - Tạm ẩn' },
                ]}
              />
            </Form.Item>
          </div>
        </Form>
      </CustomModalForm>
    </div>
  );
}
