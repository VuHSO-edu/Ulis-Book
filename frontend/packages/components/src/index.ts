import React from 'react';
import {
  App,
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Card,
  Checkbox,
  Col,
  ConfigProvider,
  Divider,
  Drawer,
  Dropdown,
  Empty,
  Form,
  Input,
  InputNumber,
  Layout,
  Modal,
  Pagination,
  Popover,
  Progress,
  Radio,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Tree,
  Typography,
  Upload,
  message,
} from 'antd';
import type { FormInstance, FormProps, ModalProps, TableProps } from 'antd';
import { translate } from '@ulis/locale';

/**
 * Wrapper Components chuẩn `packages/components` — theo vuhso-frontend-rules.
 * Toàn bộ các màn hình import từ `@ulis/components` thay vì dùng trực tiếp từ `antd`.
 */
export interface CustomModalFormProps extends Omit<ModalProps, 'onCancel' | 'onOk'> {
  title: React.ReactNode;
  children: React.ReactNode;
  isDirty?: boolean;
  onClose: () => void;
  onSubmit?: () => void;
  submitLabel?: string;
  exitLabel?: string;
  hideFooter?: boolean;
}

export function CustomModalForm({
  title,
  children,
  isDirty = false,
  onClose,
  onSubmit,
  submitLabel,
  exitLabel,
  confirmLoading,
  hideFooter = false,
  width = 640,
  ...rest
}: CustomModalFormProps) {
  const handleExitRequest = () => {
    if (!isDirty) {
      onClose();
      return;
    }
    Modal.confirm({
      title: translate('common:popupTitle'),
      content: translate('common:dirtyConfirmMessage'),
      okText: translate('button:confirm'),
      cancelText: translate('button:cancel'),
      autoFocusButton: 'ok',
      keyboard: true,
      centered: true,
      onOk: () => onClose(),
    });
  };

  const footerNode = hideFooter
    ? null
    : React.createElement(
        'div',
        {
          className: 'ulis-modal-footer-actions',
          style: { display: 'flex', justifyContent: 'flex-end', gap: 10 },
        },
        React.createElement(
          Button,
          {
            className: 'ulis-modal-btn-exit',
            onClick: handleExitRequest,
          },
          exitLabel ?? translate('button:exit'),
        ),
        onSubmit
          ? React.createElement(
              Button,
              {
                type: 'primary',
                className: 'ulis-modal-btn-submit',
                loading: confirmLoading,
                onClick: onSubmit,
              },
              submitLabel ?? translate('button:submit'),
            )
          : null,
      );

  return React.createElement(
    Modal,
    {
      title: React.createElement('div', { className: 'ulis-modal-header-title' }, title),
      width,
      onCancel: handleExitRequest,
      footer: footerNode,
      className: 'ulis-custom-modal',
      destroyOnClose: true,
      centered: true,
      ...rest,
    },
    children,
  );
}

export interface MaterialIconProps {
  name: string;
  size?: number;
  filled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function MaterialIcon({
  name,
  size = 18,
  filled = false,
  className = '',
  style,
}: MaterialIconProps) {
  return React.createElement(
    'span',
    {
      className: `material-symbols-outlined ${className}`.trim(),
      style: {
        fontSize: size,
        fontVariationSettings: filled ? "'FILL' 1, 'wght' 500" : "'FILL' 0, 'wght' 500",
        lineHeight: 1,
        verticalAlign: 'middle',
        userSelect: 'none',
        ...style,
      },
    },
    name,
  );
}

export {
  App,
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Card,
  Checkbox,
  Col,
  ConfigProvider,
  Divider,
  Drawer,
  Dropdown,
  Empty,
  Form,
  Input,
  InputNumber,
  Layout,
  Modal,
  Pagination,
  Popover,
  Progress,
  Radio,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Tree,
  Typography,
  Upload,
  message,
};

export type { FormInstance, FormProps, ModalProps, TableProps };
