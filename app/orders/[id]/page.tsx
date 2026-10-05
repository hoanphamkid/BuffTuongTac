import { CustomerOrderDetail } from '@/components/order/CustomerOrderDetail';
import './order-detail.css';

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CustomerOrderDetail orderId={id} />;
}
