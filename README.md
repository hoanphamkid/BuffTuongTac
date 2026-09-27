# SMM Việt

Bảng điều khiển dịch vụ tăng tương tác mạng xã hội, giao diện tiếng Việt, xây dựng bằng Next.js, TypeScript, Prisma và PostgreSQL.

## Chạy local

1. Sao chép `.env.example` thành `.env` và điền `DATABASE_URL`.
2. Chạy `npm install`.
3. Chạy `npm run db:generate` và `npm run db:push`.
4. Chạy `npm run dev`, mở `http://localhost:3000`.

Giao diện New Order đã có bộ chọn nền tảng/dịch vụ, máy chủ, tính tiền theo số lượng và bố cục responsive. Schema Prisma đã chuẩn bị cho người dùng, đơn hàng, nạp tiền, giao dịch số dư và provider SMM. Cần bổ sung đăng nhập/API route ở bước kết nối backend tiếp theo; không có thông tin ngân hàng, API thanh toán hoặc SMM thật trong mã nguồn.
