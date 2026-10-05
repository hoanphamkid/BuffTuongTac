export function parseTopUpAmount(value: string | null): string {
  if (!value || !/^\d+$/.test(value)) return '';
  const amount = Number(value);
  return Number.isSafeInteger(amount) && amount > 0 && amount <= 999_999_999_999
    ? String(amount)
    : '';
}

export function balanceShortfall(total: number, balance: number | string | null | undefined, freeTrial = false) {
  const available = Number(balance);
  if (freeTrial || !Number.isFinite(total) || total <= 0 || !Number.isFinite(available)) return 0;
  return Math.max(0, Math.ceil(total - available));
}
