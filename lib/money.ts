export const toMoney = (value: number | bigint | string) => Number(value);
export const formatMoney = (value: number | bigint | string) => new Intl.NumberFormat('vi-VN').format(toMoney(value)) + 'đ';
