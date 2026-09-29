'use client';

import { useEffect, useRef, useState } from 'react';

export function PaymentSuccessModal({
  open,
  amount,
  bank,
  accountName = 'PHẠM THANH HOÀN',
  paidAt,
  onClose,
}: {
  open: boolean;
  amount: number | string;
  bank: string;
  accountName?: string;
  paidAt: string | Date | null;
  onClose: () => void;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [confirmedAmount, setConfirmedAmount] = useState(Number(amount) || 0);

  const previousAmount = useRef(String(amount));

  useEffect(() => {
    if (previousAmount.current !== String(amount)) {
      previousAmount.current = String(amount);
      setConfirmedAmount(Number(amount) || 0);
      setDismissed(false);
    }
  }, [amount]);

  useEffect(() => {
    if (!open || Number(amount)) return;

    fetch('/api/deposits')
      .then((r) => r.json())
      .then((x) => {
        const latest = (x.data || []).find(
          (d: any) => d.status === 'PAID'
        );

        if (latest) setConfirmedAmount(Number(latest.amount) || 0);
      })
      .catch(() => {});
  }, [open, amount]);

  if (!open || dismissed) return null;

  const close = () => {
    setDismissed(true);
    onClose();
  };

  const money =
    new Intl.NumberFormat('vi-VN').format(confirmedAmount) + 'đ';

  return (
    <div className="payment-overlay">
      <div className="success-modal">
        <button className="modal-close" onClick={close}>
          ×
        </button>

        <div className="check">✓</div>

        <h2>Nạp tiền thành công</h2>

        <p>Giao dịch đã được ghi nhận vào tài khoản.</p>

        <div className="success-amount">
          <small>Đã cộng vào tài khoản</small>
          <strong>+{money}</strong>
        </div>

        <div className="success-row">
          <span>Ngân hàng</span>
          <b>{bank || '—'}</b>
        </div>

        <div className="success-row">
          <span>Chủ tài khoản</span>
          <b>{accountName}</b>
        </div>

        <div className="success-row">
          <span>Số tiền đã nạp</span>
          <b>{money}</b>
        </div>

        <div className="success-row">
          <span>Thời gian</span>
          <b>
            {paidAt
              ? new Date(paidAt).toLocaleString('vi-VN')
              : '—'}
          </b>
        </div>

        <button className="primary" onClick={close}>
          Hoàn tất
        </button>
      </div>
    </div>
  );
}