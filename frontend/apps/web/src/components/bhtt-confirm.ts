import { Modal } from '@ulis/components';
import { translate } from '@ulis/locale';

/**
 * Helper mở hộp thoại xác nhận chuẩn Global Rules §6:
 * - Title: "BHTT"
 * - Font Tahoma 13px
 * - Tự động focus vào button đầu tiên (autoFocusButton: 'ok')
 * - Hỗ trợ phím Esc để đóng (keyboard: true)
 */
export function showBhttConfirm(options: {
  content: string;
  onConfirm: () => void;
  okText?: string;
  cancelText?: string;
}) {
  Modal.confirm({
    title: translate('common:popupTitle'),
    content: options.content,
    okText: options.okText ?? translate('button:confirm'),
    cancelText: options.cancelText ?? translate('button:cancel'),
    autoFocusButton: 'ok',
    keyboard: true,
    centered: true,
    onOk: options.onConfirm,
  });
}
