import { useState } from 'react';
import { CustomModalForm, Form, Input, MaterialIcon, message } from '@ulis/components';
import { translate } from '@ulis/locale';
import { useReportModalStore } from '../store/useReportModalStore';
import { useCreateReport } from '../services/reports';
import { useAuth } from '../store/useAuth';
import type { ReportReasonType } from '../services/mock-data';

interface ReportFormValues {
  description: string;
}

export default function ReportModal() {
  const open = useReportModalStore((s) => s.open);
  const target = useReportModalStore((s) => s.target);
  const closeReportModal = useReportModalStore((s) => s.closeReportModal);
  const user = useAuth((s) => s.user);

  const [form] = Form.useForm<ReportFormValues>();
  const [selectedReason, setSelectedReason] = useState<ReportReasonType>('SCAM');
  const [isDirty, setIsDirty] = useState(false);
  const [evidenceFileName, setEvidenceFileName] = useState<string>('');
  const createReport = useCreateReport();

  const reasons: Array<{
    key: ReportReasonType;
    icon: string;
    title: string;
    desc: string;
  }> = [
    {
      key: 'SPAM',
      icon: 'content_copy',
      title: translate('report:reasonSpamTitle'),
      desc: translate('report:reasonSpamDesc'),
    },
    {
      key: 'SCAM',
      icon: 'gpp_maybe',
      title: translate('report:reasonScamTitle'),
      desc: translate('report:reasonScamDesc'),
    },
    {
      key: 'OFFENSIVE',
      icon: 'mood_bad',
      title: translate('report:reasonOffensiveTitle'),
      desc: translate('report:reasonOffensiveDesc'),
    },
    {
      key: 'OTHER',
      icon: 'more_horiz',
      title: translate('report:reasonOtherTitle'),
      desc: translate('report:reasonOtherDesc'),
    },
  ];

  const handleClose = () => {
    form.resetFields();
    setIsDirty(false);
    setEvidenceFileName('');
    closeReportModal();
  };

  const handleFinish = (values: ReportFormValues) => {
    if (!target) return;
    const trimmed = values.description?.trim() ?? '';
    if (!trimmed) {
      message.error(
        translate('common:validation.whitespace', {
          field: translate('report:descriptionLabel'),
        }),
      );
      return;
    }
    const reasonObj = reasons.find((r) => r.key === selectedReason) ?? reasons[1];
    createReport.mutate(
      {
        sourceType: target.sourceType,
        targetId: target.targetId,
        targetTitle: target.targetTitle,
        targetSubtitle: target.targetSubtitle,
        reasonType: selectedReason,
        reasonLabel: reasonObj.title,
        description: trimmed,
        reporterName: user?.fullName ?? 'Nguyễn Văn An',
        reporterEmail: user?.email ?? 'an.nv@ulis.edu.vn',
      },
      {
        onSuccess: () => {
          message.success(translate('report:reportSuccess'));
          handleClose();
        },
      },
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      message.error(translate('common:validation.fileSizeLimit'));
      return;
    }
    setEvidenceFileName(file.name);
    setIsDirty(true);
  };

  return (
    <CustomModalForm
      open={open}
      onClose={handleClose}
      onSubmit={() => form.submit()}
      confirmLoading={createReport.isPending}
      isDirty={isDirty}
      width={600}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: 6,
              background: '#ffdad6',
              color: '#ba1a1a',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialIcon name="report" size={18} />
          </span>
          <span>{translate('report:modalTitle')}</span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 4,
              background: '#ffdad6',
              color: '#93000a',
              textTransform: 'uppercase',
            }}
          >
            {translate('report:urgentBadge')}
          </span>
        </div>
      }
    >
      {target && (
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            background: '#f2f3ff',
            border: '1px solid #d8deee',
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#004ac6' }}>
              {translate('report:targetLabel')} · [{target.sourceType}]
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#131b2e' }}>
              {target.targetTitle}
            </div>
            <div style={{ fontSize: 11.5, color: '#596377' }}>{target.targetSubtitle}</div>
          </div>
          <span
            style={{
              padding: '3px 8px',
              borderRadius: 6,
              background: '#dbe1ff',
              color: '#004ac6',
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            #{target.targetId}
          </span>
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 6,
            fontSize: 13,
            fontWeight: 700,
            color: '#000000',
          }}
        >
          <span>
            {translate('report:reasonLabel')} <span style={{ color: '#ba1a1a' }}>*</span>
          </span>
          <span style={{ fontSize: 11, fontWeight: 400, color: '#596377' }}>
            {translate('report:reasonHint')}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {reasons.map((r) => {
            const active = selectedReason === r.key;
            return (
              <div
                key={r.key}
                onClick={() => {
                  setSelectedReason(r.key);
                  setIsDirty(true);
                }}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: active ? '2px solid #1677ff' : '1px solid #c3c6d7',
                  background: active ? 'rgba(22, 119, 255, 0.06)' : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                }}
              >
                <MaterialIcon
                  name={r.icon}
                  size={18}
                  style={{ color: active ? '#1677ff' : '#596377', marginTop: 2 }}
                />
                <div>
                  <div
                    style={{
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: active ? '#1677ff' : '#000000',
                    }}
                  >
                    {r.title}
                  </div>
                  <div style={{ fontSize: 11, color: '#596377', lineHeight: 1.35 }}>{r.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        onValuesChange={() => setIsDirty(true)}
        onFinish={handleFinish}
      >
        <Form.Item
          name="description"
          label={translate('report:descriptionLabel')}
          rules={[
            {
              required: true,
              message: translate('common:validation.required', {
                field: translate('report:descriptionLabel'),
              }),
            },
            {
              max: 500,
              message: translate('common:validation.maxLength', {
                field: translate('report:descriptionLabel'),
                max: 500,
              }),
            },
          ]}
        >
          <Input.TextArea
            rows={3}
            maxLength={500}
            showCount
            placeholder={translate('report:descriptionPlaceholder')}
          />
        </Form.Item>

        <div
          style={{
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px dashed #c3c6d7',
            background: '#faf8ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MaterialIcon name="add_photo_alternate" size={20} style={{ color: '#004ac6' }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#000000' }}>
                {translate('report:attachmentTitle')}
              </div>
              {evidenceFileName && (
                <div style={{ fontSize: 11, color: '#1677ff' }}>{evidenceFileName}</div>
              )}
            </div>
          </div>
          <label
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              background: '#dbe1ff',
              color: '#004ac6',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {translate('myPosts:uploadBtn')}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </label>
        </div>
      </Form>
    </CustomModalForm>
  );
}
