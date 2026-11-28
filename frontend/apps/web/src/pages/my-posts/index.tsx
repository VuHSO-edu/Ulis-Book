import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Breadcrumb,
  Button,
  CustomModalForm,
  Form,
  Input,
  InputNumber,
  MaterialIcon,
  Select,
  Switch,
  Table,
  Tag,
  Tooltip,
  message,
  type TableProps,
} from '@ulis/components';
import { COMMON_VALIDATION_PATTERN, translate } from '@ulis/locale';
import { httpBlocking } from '@ulis/apis';
import { formatCurrencyVnd } from '@ulis/utils';
import {
  useBookCategories,
  useDeleteBookPost,
  useMarkBookSold,
  useMyBookPosts,
  useSaveBookPost,
  type UpsertBookPostPayload,
} from '../../services/books';
import { useBookFilterStore } from '../../store/useBookFilterStore';
import { showBhttConfirm } from '../../components/bhtt-confirm';
import type { BookPostItem } from '../../services/mock-data';

const CAMPUS_LOCATIONS = [
  'Sảnh A1 ULIS',
  'Sân C1',
  'Thư viện ULIS',
  'Toà B2',
  'Toà Sunwah',
  'Toà Pháp A3',
  'Cổng chính Phạm Văn Đồng',
];

export default function MyPostsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: posts = [], isLoading } = useMyBookPosts();
  const { data: categories = [] } = useBookCategories();
  const savePost = useSaveBookPost();
  const markSold = useMarkBookSold();
  const deletePost = useDeleteBookPost();

  const focusedRowId = useBookFilterStore((s) => s.focusedRowId);
  const focusRowByTableAction = useBookFilterStore((s) => s.focusRowByTableAction);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BookPostItem | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [photoUrls, setPhotoUrls] = useState<string[]>(['', '', '']);
  const [form] = Form.useForm<UpsertBookPostPayload>();
  const isGiveawayWatch = Form.useWatch('isGiveaway', form);

  const faculties = categories.filter((c) => c.parentAxis === 'FACULTY');
  const bookTypes = categories.filter((c) => c.parentAxis === 'BOOK_TYPE');
  const campusLocationOptions =
    categories.filter((c) => c.parentAxis === 'CAMPUS_LOCATION' && c.status === 'ACTIVE').length > 0
      ? categories
          .filter((c) => c.parentAxis === 'CAMPUS_LOCATION' && c.status === 'ACTIVE')
          .map((c) => c.name)
      : CAMPUS_LOCATIONS;

  const openCreateModal = () => {
    // TASK-13: Chặn khi đạt giới hạn 15 bài đăng / tháng / user
    if (posts.length >= 15) {
      message.warning(translate('v2:quota.exceededAlert'));
      return;
    }
    setEditingItem(null);
    setIsDirty(false);
    setPhotoUrls(['', '', '']);
    form.setFieldsValue({
      title: '',
      courseCode: '',
      bookTypeCode: bookTypes[0]?.code ?? 'TYPE_GIAOTRINH',
      facultyCode: faculties[0]?.code ?? 'ENG_FACULTY',
      isGiveaway: false,
      price: 45000,
      originalPrice: 120000,
      quantity: 1,
      condition: 'Mới 95% - Bìa bọc cẩn thận',
      campusLocation: campusLocationOptions[0],
      description: '',
    });
    setModalOpen(true);
  };

  useEffect(() => {
    if (searchParams.get('create') === '1') {
      openCreateModal();
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const openEditModal = (record: BookPostItem) => {
    setEditingItem(record);
    setIsDirty(false);
    setPhotoUrls(record.images?.length ? record.images : [record.coverUrl]);
    form.setFieldsValue({
      id: record.id,
      code: record.code,
      title: record.title,
      courseCode: record.courseCode,
      bookTypeCode: record.bookTypeCode,
      facultyCode: record.facultyCode,
      isGiveaway: record.isGiveaway,
      price: record.price,
      originalPrice: record.originalPrice,
      quantity: record.quantity,
      condition: record.condition,
      campusLocation: record.campusLocation,
      description: record.description,
    });
    setModalOpen(true);
  };

  const handlePhotoUpload = async (slotIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      message.error(translate('common:validation.fileSizeLimit'));
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      message.error(translate('common:validation.fileTypeLimit'));
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await httpBlocking.post<{ data?: { url?: string } }>('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploadedUrl = res.data?.data?.url;
      if (uploadedUrl) {
        setPhotoUrls((prev) => {
          const next = [...prev];
          next[slotIndex] = uploadedUrl;
          return next.slice(0, 3);
        });
        setIsDirty(true);
        return;
      }
    } catch {
      // Fallback Base64 nếu MinIO chưa bật
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) return;
      setPhotoUrls((prev) => {
        const next = [...prev];
        next[slotIndex] = dataUrl;
        return next.slice(0, 3);
      });
      setIsDirty(true);
    };
    reader.readAsDataURL(file);
  };

  const handleFinish = (values: UpsertBookPostPayload) => {
    const cleanTitle = values.title?.trim() ?? '';
    const cleanCode = values.code?.trim() ?? '';
    if (!cleanTitle) {
      message.error(
        translate('common:validation.whitespace', { field: translate('myPosts:fieldTitle') }),
      );
      return;
    }
    savePost.mutate(
      {
        ...values,
        id: editingItem?.id,
        code: cleanCode,
        title: cleanTitle,
        coverUrl: photoUrls[0],
        images: photoUrls.filter(Boolean),
      },
      {
        onSuccess: (saved) => {
          message.success(translate('myPosts:savedSuccess'));
          focusRowByTableAction(saved.id);
          setModalOpen(false);
          setIsDirty(false);
        },
        onError: (err) => {
          if (err instanceof Error && err.message.startsWith('MONTHLY_QUOTA_EXCEEDED')) {
            message.error(translate('v2:quota.exceededAlert'));
          } else if (err instanceof Error && err.message.startsWith('DUPLICATE_CODE:')) {
            const dup = err.message.split(':')[1] ?? cleanCode;
            message.error(translate('common:validation.duplicateCode', { code: dup }));
          } else {
            message.error(translate('common:unknownError'));
          }
        },
      },
    );
  };

  const handleMarkSold = (record: BookPostItem) => {
    showBhttConfirm({
      content: translate('common:deleteConfirmMessage'),
      onConfirm: () => {
        markSold.mutate(record.id, {
          onSuccess: (id) => {
            focusRowByTableAction(id);
            message.success(translate('myPosts:markedSoldSuccess'));
          },
        });
      },
    });
  };

  const handleDelete = (record: BookPostItem) => {
    showBhttConfirm({
      content: translate('common:deleteConfirmMessage'),
      onConfirm: () => {
        deletePost.mutate(record.id, {
          onSuccess: (id) => {
            focusRowByTableAction(id);
            message.success(translate('myPosts:deletedSuccess'));
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
      render: (_v, _r, index) => (currentPage - 1) * 10 + index + 1,
    },
    {
      title: translate('myPosts:colCode'),
      dataIndex: 'code',
      key: 'code',
      width: 130,
      align: 'left',
      render: (val: string) => <strong style={{ fontFamily: 'monospace' }}>{val}</strong>,
    },
    {
      title: translate('myPosts:colTitle'),
      dataIndex: 'title',
      key: 'title',
      align: 'left',
      ellipsis: true,
      render: (val: string, record) => (
        <Tooltip title={val}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src={record.coverUrl}
              alt={val}
              style={{ width: 34, height: 42, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
            />
            <div>
              <div style={{ fontWeight: 700 }}>{val}</div>
              <div style={{ fontSize: 11.5, color: '#596377' }}>
                {record.courseCode} · {record.campusLocation}
              </div>
            </div>
          </div>
        </Tooltip>
      ),
    },
    {
      title: translate('myPosts:colCategory'),
      dataIndex: 'facultyName',
      key: 'facultyName',
      width: 210,
      align: 'left',
      render: (_v, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record.facultyName}</div>
          <div style={{ fontSize: 11, color: '#596377' }}>{record.bookTypeName}</div>
        </div>
      ),
    },
    {
      title: translate('myPosts:colPrice'),
      dataIndex: 'price',
      key: 'price',
      width: 130,
      align: 'right',
      render: (price: number, record) => (
        <strong style={{ color: record.isGiveaway ? '#d97706' : '#004ac6' }}>
          {record.isGiveaway ? translate('home:freeTag') : formatCurrencyVnd(price)}
        </strong>
      ),
    },
    {
      title: translate('myPosts:colQuantity'),
      dataIndex: 'quantity',
      key: 'quantity',
      width: 95,
      align: 'right',
    },
    {
      title: translate('myPosts:colCreatedAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
      align: 'center',
    },
    {
      title: translate('common:status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center',
      render: (st: BookPostItem['status']) => {
        const color = st === 'SELLING' ? 'success' : st === 'SOLD' ? 'processing' : 'default';
        return <Tag color={color}>{st}</Tag>;
      },
    },
    {
      title: translate('common:actions'),
      key: 'actions',
      width: 165,
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

          {record.status === 'SELLING' && (
            <Tooltip title={translate('button:markSold')}>
              <button
                type="button"
                className="ulis-action-icon-btn success"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkSold(record);
                }}
              >
                <MaterialIcon name="sell" size={17} />
              </button>
            </Tooltip>
          )}

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
    <div style={{ maxWidth: 1360, margin: '0 auto', padding: '20px 24px 48px' }}>
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
              title: <strong style={{ color: '#004ac6' }}>{translate('myPosts:title')}</strong>,
            },
          ]}
        />
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 21, fontWeight: 700, color: '#131b2e' }}>
            {translate('myPosts:title')}
          </h1>
          <div style={{ fontSize: 13, color: '#596377' }}>{translate('myPosts:subtitle')}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Tag
            color={posts.length >= 15 ? 'red' : 'blue'}
            style={{ fontSize: 13, padding: '5px 12px', fontWeight: 700, margin: 0 }}
          >
            {translate('v2:quota.badge', { used: Math.min(15, posts.length), limit: 15 })}
          </Tag>
          <Button
            type="primary"
            className="ulis-primary-btn"
            disabled={posts.length >= 15}
            onClick={openCreateModal}
          >
            <MaterialIcon name="add_circle" size={16} style={{ marginRight: 6 }} />
            {translate('button:createPost')}
          </Button>
        </div>
      </div>

      <div
        className="ulis-data-table"
        style={{
          background: '#ffffff',
          borderRadius: 4,
          border: 'none',
          overflow: 'hidden',
        }}
      >
        <Table<BookPostItem>
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={posts}
          rowClassName={(record) => (record.id === focusedRowId ? 'ulis-row-focused' : '')}
          onRow={(record) => ({
            onClick: () => focusRowByTableAction(record.id),
          })}
          pagination={{
            current: currentPage,
            pageSize: 10,
            total: posts.length,
            showSizeChanger: false,
            onChange: (p) => setCurrentPage(p),
            showTotal: (total) => translate('common:totalRecords', { total }),
          }}
        />
      </div>

      {/* Create / Edit Book Post CustomModalForm */}
      <CustomModalForm
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={() => form.submit()}
        confirmLoading={savePost.isPending}
        isDirty={isDirty}
        width={680}
        title={
          editingItem
            ? translate('myPosts:editModalTitle')
            : translate('myPosts:createModalTitle')
        }
      >
        <Form<UpsertBookPostPayload>
          form={form}
          layout="vertical"
          onValuesChange={() => setIsDirty(true)}
          onFinish={handleFinish}
        >
          <Form.Item
            name="courseCode"
            label={translate('myPosts:fieldCourseCode')}
            rules={[
              {
                required: true,
                message: translate('common:validation.required', {
                  field: translate('myPosts:fieldCourseCode'),
                }),
              },
              {
                pattern: COMMON_VALIDATION_PATTERN.CODE,
                message: translate('common:validation.codePattern', {
                  field: translate('myPosts:fieldCourseCode'),
                }),
              },
            ]}
          >
            <Input
              autoFocus
              placeholder={translate('myPosts:fieldCourseCodePlaceholder')}
            />
          </Form.Item>

          <Form.Item
            name="title"
            label={translate('myPosts:fieldTitle')}
            rules={[
              {
                required: true,
                message: translate('common:validation.required', {
                  field: translate('myPosts:fieldTitle'),
                }),
              },
            ]}
          >
            <Input placeholder={translate('myPosts:fieldTitlePlaceholder')} />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item
              name="facultyCode"
              label={translate('myPosts:fieldFaculty')}
              rules={[
                {
                  required: true,
                  message: translate('common:validation.required', {
                    field: translate('myPosts:fieldFaculty'),
                  }),
                },
              ]}
            >
              <Select
                options={faculties.map((f) => ({
                  value: f.code,
                  label: f.name,
                }))}
              />
            </Form.Item>

            <Form.Item
              name="bookTypeCode"
              label={translate('myPosts:fieldBookType')}
              rules={[
                {
                  required: true,
                  message: translate('common:validation.required', {
                    field: translate('myPosts:fieldBookType'),
                  }),
                },
              ]}
            >
              <Select
                options={bookTypes.map((t) => ({
                  value: t.code,
                  label: t.name,
                }))}
              />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item
              name="isGiveaway"
              label={translate('myPosts:optionGiveaway')}
              valuePropName="checked"
            >
              <Switch
                onChange={(checked) => {
                  if (checked) {
                    form.setFieldValue('price', 0);
                  }
                }}
              />
            </Form.Item>

            <Form.Item
              name="price"
              label={translate('myPosts:fieldPrice')}
              rules={[
                {
                  required: !isGiveawayWatch,
                  message: translate('common:validation.required', {
                    field: translate('myPosts:fieldPrice'),
                  }),
                },
              ]}
            >
              <InputNumber
                disabled={!!isGiveawayWatch}
                min={0}
                precision={0}
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item name="originalPrice" label={translate('myPosts:fieldOriginalPrice')}>
              <InputNumber min={0} precision={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="quantity"
              label={translate('myPosts:fieldQuantity')}
              rules={[
                {
                  required: true,
                  message: translate('common:validation.required', {
                    field: translate('myPosts:fieldQuantity'),
                  }),
                },
              ]}
            >
              <InputNumber min={0} precision={0} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item
              name="condition"
              label={translate('myPosts:fieldCondition')}
              rules={[
                {
                  required: true,
                  message: translate('common:validation.required', {
                    field: translate('myPosts:fieldCondition'),
                  }),
                },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="campusLocation"
              label={translate('myPosts:fieldCampusLocation')}
              rules={[
                {
                  required: true,
                  message: translate('common:validation.required', {
                    field: translate('myPosts:fieldCampusLocation'),
                  }),
                },
              ]}
            >
              <Input placeholder="Nhập hoặc chọn địa điểm hẹn bên dưới..." />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: -8, marginBottom: 14 }}>
            {campusLocationOptions.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => {
                  form.setFieldValue('campusLocation', loc);
                  setIsDirty(true);
                }}
                style={{
                  padding: '3px 10px',
                  borderRadius: 4,
                  border: '1px solid #d9d9d9',
                  background: '#fafafa',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                {loc}
              </button>
            ))}
          </div>

          <Form.Item
            name="description"
            label={translate('myPosts:fieldDescription')}
            rules={[
              {
                required: true,
                message: translate('common:validation.required', {
                  field: translate('myPosts:fieldDescription'),
                }),
              },
            ]}
          >
            <Input.TextArea
              rows={2}
              placeholder={translate('myPosts:fieldDescriptionPlaceholder')}
            />
          </Form.Item>

          {/* 3-slot Photo Uploader (1 Cover + 2 Sub Photos, max 10MB) */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#000000', marginBottom: 6 }}>
              {translate('myPosts:fieldPhotos')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {[
                translate('myPosts:coverSlot'),
                translate('myPosts:subSlot1'),
                translate('myPosts:subSlot2'),
              ].map((slotLabel, idx) => (
                <label
                  key={idx}
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    border: '1px dashed #c3c6d7',
                    background: '#faf8ff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                  }}
                >
                  {photoUrls[idx] ? (
                    <img
                      src={photoUrls[idx]}
                      alt={slotLabel}
                      style={{ width: 38, height: 38, borderRadius: 6, objectFit: 'cover' }}
                    />
                  ) : (
                    <MaterialIcon name="add_a_photo" size={20} style={{ color: '#004ac6' }} />
                  )}
                  <div style={{ fontSize: 11.5 }}>
                    <div style={{ fontWeight: 700, color: '#000000' }}>{slotLabel}</div>
                    <div style={{ color: '#1677ff' }}>{translate('myPosts:uploadBtn')}</div>
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: 'none' }}
                    onChange={(e) => handlePhotoUpload(idx, e)}
                  />
                </label>
              ))}
            </div>
          </div>
        </Form>
      </CustomModalForm>
    </div>
  );
}
