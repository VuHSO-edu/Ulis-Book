import { useEffect, useState } from 'react';
import {
  Button,
  CustomModalForm,
  Form,
  Input,
  InputNumber,
  MaterialIcon,
  Switch,
  Table,
  Tag,
  Tooltip,
  message,
  type TableProps,
} from '@ulis/components';
import { translate } from '@ulis/locale';
import {
  applyThemeCssVariables,
  useSaveSystemAppearance,
  useSystemAppearance,
} from '../../../services/v2';
import { INITIAL_APPEARANCE, type HeroLoopBannerItem } from '../../../services/mock-data';
import { showBhttConfirm } from '../../../components/bhtt-confirm';

const COLOR_PRESETS = [
  {
    name: 'Seashell & French Blue (Mặc định NextBook)',
    bgColor: '#fff4eb',
    surfaceColor: '#f6e0b6',
    primaryColor: '#3e4b8e',
  },
  {
    name: 'Academic Sky Blue (Xanh Học Thuật VNU)',
    bgColor: '#f0f5ff',
    surfaceColor: '#dbeafe',
    primaryColor: '#1d4ed8',
  },
  {
    name: 'Matcha Emerald (Xanh Lá Thư Viện)',
    bgColor: '#f2fbf7',
    surfaceColor: '#d1fae5',
    primaryColor: '#047857',
  },
  {
    name: 'Warm Parchment (Giấy Cổ Điển)',
    bgColor: '#fdf8f0',
    surfaceColor: '#f3e3c3',
    primaryColor: '#6d3b1e',
  },
];

/**
 * Trang Quản trị Giao diện & Banner Loop cho Admin:
 * - TASK-04: Chức năng Admin Đổi Màu Nền Hệ thống
 * - TASK-05: Chức năng Admin Quản lý Chạy Loop Ảnh trong Tiêu đề (Hero Banner)
 * - TASK-12: Cấu hình Domain cho App
 */
export default function AdminAppearancePage() {
  const { data: appearance = INITIAL_APPEARANCE, isLoading } = useSystemAppearance();
  const saveAppearance = useSaveSystemAppearance();

  const [bgColor, setBgColor] = useState(appearance.bgColor);
  const [surfaceColor, setSurfaceColor] = useState(appearance.surfaceColor);
  const [primaryColor, setPrimaryColor] = useState(appearance.primaryColor);
  const [presetName, setPresetName] = useState(appearance.presetName);
  const [domain, setDomain] = useState(appearance.domain || 'nextbook.ulis.edu.vn');
  const [banners, setBanners] = useState<HeroLoopBannerItem[]>(appearance.heroBanners);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<HeroLoopBannerItem | null>(null);
  const [form] = Form.useForm<HeroLoopBannerItem>();

  useEffect(() => {
    setBgColor(appearance.bgColor);
    setSurfaceColor(appearance.surfaceColor);
    setPrimaryColor(appearance.primaryColor);
    setPresetName(appearance.presetName);
    setDomain(appearance.domain || 'nextbook.ulis.edu.vn');
    setBanners(appearance.heroBanners);
  }, [appearance]);

  const handleSelectPreset = (preset: (typeof COLOR_PRESETS)[number]) => {
    setPresetName(preset.name);
    setBgColor(preset.bgColor);
    setSurfaceColor(preset.surfaceColor);
    setPrimaryColor(preset.primaryColor);
    applyThemeCssVariables({
      ...appearance,
      bgColor: preset.bgColor,
      surfaceColor: preset.surfaceColor,
      primaryColor: preset.primaryColor,
    });
  };

  const handleSaveTheme = () => {
    saveAppearance.mutate(
      {
        bgColor,
        surfaceColor,
        primaryColor,
        presetName,
        domain: domain.trim() || 'nextbook.ulis.edu.vn',
        heroBanners: banners,
      },
      {
        onSuccess: () => {
          message.success(translate('admin:appearance.colorSavedSuccess'));
        },
      },
    );
  };

  const handleResetDefault = () => {
    setBgColor(INITIAL_APPEARANCE.bgColor);
    setSurfaceColor(INITIAL_APPEARANCE.surfaceColor);
    setPrimaryColor(INITIAL_APPEARANCE.primaryColor);
    setPresetName(INITIAL_APPEARANCE.presetName);
    setDomain(INITIAL_APPEARANCE.domain);
    saveAppearance.mutate(
      {
        ...INITIAL_APPEARANCE,
        heroBanners: banners,
      },
      {
        onSuccess: () => {
          message.success(translate('admin:appearance.colorResetSuccess'));
        },
      },
    );
  };

  const openAddBanner = () => {
    setEditingBanner(null);
    form.setFieldsValue({
      title: '',
      imageUrl: '',
      badgeText: 'Giáo trình ULIS · Tiết kiệm 70%',
      sortOrder: banners.length + 1,
      active: true,
    });
    setModalOpen(true);
  };

  const openEditBanner = (record: HeroLoopBannerItem) => {
    setEditingBanner(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleBannerFinish = (values: HeroLoopBannerItem) => {
    let nextList: HeroLoopBannerItem[];
    if (editingBanner) {
      nextList = banners.map((b) =>
        b.id === editingBanner.id
          ? {
              ...b,
              title: values.title.trim(),
              imageUrl: values.imageUrl.trim(),
              badgeText: values.badgeText?.trim() ?? '',
              sortOrder: Number(values.sortOrder || 1),
              active: Boolean(values.active),
            }
          : b,
      );
    } else {
      const nextId = Math.max(0, ...banners.map((b) => b.id)) + 1;
      nextList = [
        ...banners,
        {
          id: nextId,
          title: values.title.trim(),
          imageUrl: values.imageUrl.trim(),
          badgeText: values.badgeText?.trim() ?? '',
          sortOrder: Number(values.sortOrder || banners.length + 1),
          active: Boolean(values.active ?? true),
        },
      ];
    }
    nextList.sort((a, b) => a.sortOrder - b.sortOrder);
    setBanners(nextList);
    setModalOpen(false);
    saveAppearance.mutate(
      {
        bgColor,
        surfaceColor,
        primaryColor,
        presetName,
        domain,
        heroBanners: nextList,
      },
      {
        onSuccess: () => {
          message.success(translate('admin:appearance.bannerSavedSuccess'));
        },
      },
    );
  };

  const handleToggleBannerActive = (record: HeroLoopBannerItem, checked: boolean) => {
    const nextList = banners.map((b) => (b.id === record.id ? { ...b, active: checked } : b));
    setBanners(nextList);
    saveAppearance.mutate({
      bgColor,
      surfaceColor,
      primaryColor,
      presetName,
      domain,
      heroBanners: nextList,
    });
  };

  const handleDeleteBanner = (record: HeroLoopBannerItem) => {
    showBhttConfirm({
      content: translate('common:deleteConfirmMessage'),
      onConfirm: () => {
        const nextList = banners.filter((b) => b.id !== record.id);
        setBanners(nextList);
        saveAppearance.mutate(
          {
            bgColor,
            surfaceColor,
            primaryColor,
            presetName,
            domain,
            heroBanners: nextList,
          },
          {
            onSuccess: () => {
              message.success(translate('admin:appearance.bannerDeletedSuccess'));
            },
          },
        );
      },
    });
  };

  const columns: TableProps<HeroLoopBannerItem>['columns'] = [
    {
      title: translate('admin:appearance.colOrder'),
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 85,
      align: 'center',
    },
    {
      title: translate('admin:appearance.colPreview'),
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 120,
      align: 'center',
      render: (url: string, rec) => (
        <img
          src={url}
          alt={rec.title}
          style={{ width: 76, height: 52, borderRadius: 4, objectFit: 'cover' }}
        />
      ),
    },
    {
      title: translate('admin:appearance.colTitle'),
      dataIndex: 'title',
      key: 'title',
      render: (val: string) => <strong>{val}</strong>,
    },
    {
      title: translate('admin:appearance.colBadge'),
      dataIndex: 'badgeText',
      key: 'badgeText',
      width: 210,
      render: (val: string) => <Tag color="blue">{val || 'NextBook'}</Tag>,
    },
    {
      title: translate('admin:appearance.colActive'),
      dataIndex: 'active',
      key: 'active',
      width: 120,
      align: 'center',
      render: (active: boolean, rec) => (
        <Switch
          checked={active}
          onChange={(checked) => handleToggleBannerActive(rec, checked)}
        />
      ),
    },
    {
      title: translate('common:actions'),
      key: 'actions',
      width: 130,
      align: 'center',
      render: (_v, rec) => (
        <div className="ulis-table-action-icons">
          <Tooltip title={translate('button:edit')}>
            <button
              type="button"
              className="ulis-action-icon-btn"
              onClick={() => openEditBanner(rec)}
            >
              <MaterialIcon name="edit_square" size={17} />
            </button>
          </Tooltip>
          <Tooltip title={translate('button:delete')}>
            <button
              type="button"
              className="ulis-action-icon-btn danger"
              onClick={() => handleDeleteBanner(rec)}
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
      <div className="ulis-admin-page-header">
        <div>
          <h1>{translate('admin:appearance.title')}</h1>
          <div className="page-subtitle">{translate('admin:appearance.subtitle')}</div>
        </div>
      </div>

      {/* SECTION 1: ADMIN ĐỔI MÀU NỀN HỆ THỐNG (TASK-04) & CẤU HÌNH DOMAIN (TASK-12) */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 6,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h2 style={{ margin: '0 0 14px', fontSize: 18 }}>
          {translate('admin:appearance.colorSectionTitle')}
        </h2>

        {/* Preset Selector */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
            {translate('admin:appearance.presetLabel')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {COLOR_PRESETS.map((preset) => {
              const isSelected = preset.bgColor.toLowerCase() === bgColor.toLowerCase();
              return (
                <div
                  key={preset.name}
                  onClick={() => handleSelectPreset(preset)}
                  style={{
                    padding: 12,
                    borderRadius: 6,
                    background: preset.bgColor,
                    border: isSelected
                      ? `2px solid ${preset.primaryColor}`
                      : '1px solid #cbd5e1',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 4,
                        background: preset.bgColor,
                        border: '1px solid rgba(0,0,0,0.15)',
                      }}
                    />
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 4,
                        background: preset.surfaceColor,
                      }}
                    />
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 4,
                        background: preset.primaryColor,
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 700 }}>{preset.name}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Color Pickers + Domain Input */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
            marginBottom: 18,
          }}
        >
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
              {translate('admin:appearance.bgColorLabel')}
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                style={{ width: 42, height: 36, border: 'none', cursor: 'pointer' }}
              />
              <Input value={bgColor} onChange={(e) => setBgColor(e.target.value)} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
              {translate('admin:appearance.surfaceColorLabel')}
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="color"
                value={surfaceColor}
                onChange={(e) => setSurfaceColor(e.target.value)}
                style={{ width: 42, height: 36, border: 'none', cursor: 'pointer' }}
              />
              <Input value={surfaceColor} onChange={(e) => setSurfaceColor(e.target.value)} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
              {translate('admin:appearance.primaryColorLabel')}
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                style={{ width: 42, height: 36, border: 'none', cursor: 'pointer' }}
              />
              <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
              {translate('admin:appearance.domainLabel')}
            </label>
            <Input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="nextbook.ulis.edu.vn"
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button
            type="primary"
            loading={saveAppearance.isPending}
            className="ulis-primary-btn"
            onClick={handleSaveTheme}
          >
            <MaterialIcon name="palette" size={16} style={{ marginRight: 6 }} />
            {translate('admin:appearance.applyColorBtn')}
          </Button>
          <Button className="ulis-secondary-btn-powder" onClick={handleResetDefault}>
            {translate('admin:appearance.resetDefaultBtn')}
          </Button>
        </div>
      </div>

      {/* SECTION 2: ADMIN QUẢN LÝ CHẠY LOOP ẢNH TRONG TIÊU ĐỀ (TASK-05) */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 6,
          padding: 24,
        }}
      >
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
            <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>
              {translate('admin:appearance.bannerSectionTitle')}
            </h2>
            <div style={{ fontSize: 12.5, color: '#64748b' }}>
              {translate('admin:appearance.bannerSectionDesc')}
            </div>
          </div>

          <Button type="primary" className="ulis-primary-btn" onClick={openAddBanner}>
            {translate('admin:appearance.addBannerBtn')}
          </Button>
        </div>

        <div className="ulis-data-table">
          <Table<HeroLoopBannerItem>
            rowKey="id"
            loading={isLoading}
            columns={columns}
            dataSource={banners}
            pagination={false}
          />
        </div>
      </div>

      {/* Modal Thêm / Sửa Ảnh Loop trong Tiêu đề */}
      <CustomModalForm
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={() => form.submit()}
        title={
          editingBanner
            ? translate('admin:appearance.modalEditTitle')
            : translate('admin:appearance.modalAddTitle')
        }
        width={540}
      >
        <Form<HeroLoopBannerItem> form={form} layout="vertical" onFinish={handleBannerFinish}>
          <Form.Item
            name="title"
            label={translate('admin:appearance.fieldBannerTitle')}
            rules={[
              {
                required: true,
                message: translate('common:validation.required', {
                  field: translate('admin:appearance.fieldBannerTitle'),
                }),
              },
            ]}
          >
            <Input autoFocus placeholder="VD: Giáo trình Academic Writing B2 - Khoa Anh ULIS" />
          </Form.Item>

          <Form.Item
            name="imageUrl"
            label={translate('admin:appearance.fieldBannerImage')}
            rules={[
              {
                required: true,
                message: translate('common:validation.required', {
                  field: translate('admin:appearance.fieldBannerImage'),
                }),
              },
            ]}
          >
            <Input
              placeholder="Dán URL ảnh hoặc bấm tải ảnh lên"
              addonAfter={
                <label style={{ cursor: 'pointer', fontSize: 12 }}>
                  Tải ảnh
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
                          form.setFieldValue('imageUrl', reader.result);
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              }
            />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px', gap: 12 }}>
            <Form.Item name="badgeText" label={translate('admin:appearance.fieldBannerBadge')}>
              <Input placeholder="VD: ENG2014 · Tiết kiệm 70%" />
            </Form.Item>

            <Form.Item name="sortOrder" label={translate('admin:appearance.colOrder')}>
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="active"
              label={translate('admin:appearance.colActive')}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </div>
        </Form>
      </CustomModalForm>
    </div>
  );
}
