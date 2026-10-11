export const REFUND_REASONS = [
  { value: 'WRONG_LINK', label: 'Người dùng nhập sai liên kết' },
  { value: 'LINK_UNAVAILABLE', label: 'Liên kết không tồn tại hoặc không công khai' },
  { value: 'WRONG_PLATFORM', label: 'Liên kết sai nền tảng hoặc dịch vụ' },
  { value: 'SERVICE_UNAVAILABLE', label: 'Dịch vụ không thể thực hiện' },
  { value: 'OTHER', label: 'Lý do khác' },
] as const;

export function resolveRefundReason(code: unknown, detail: unknown) {
  if (typeof code !== 'string') return null;
  const option = REFUND_REASONS.find((reason) => reason.value === code);
  if (!option) return null;
  if (option.value !== 'OTHER') return option.label;

  const note = typeof detail === 'string' ? detail.trim().slice(0, 160) : '';
  return note ? `${option.label}: ${note}` : null;
}
