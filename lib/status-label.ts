const labels: Record<string, string> = {
  PENDING: "Chờ xử lý",
  PAID: "Đã thanh toán",
  PROCESSING: "Đang xử lý",
  IN_PROGRESS: "Đang chạy",
  COMPLETED: "Hoàn thành",
  FAILED: "Thất bại",
  CANCELED: "Đã hủy",
  REFUNDED: "Đã hoàn tiền",
};

export const statusLabel = (status: string) => labels[status] || status;
