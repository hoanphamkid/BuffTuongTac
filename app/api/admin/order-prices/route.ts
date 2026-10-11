import { NextResponse } from 'next/server';

function retiredEndpoint() {
  return NextResponse.json(
    { success: false, error: 'Chỉnh giá từng đơn đã ngừng. Hãy dùng trang giá nền tảng và dịch vụ.' },
    { status: 410 },
  );
}

export async function GET() {
  return retiredEndpoint();
}

export async function PATCH() {
  return retiredEndpoint();
}
