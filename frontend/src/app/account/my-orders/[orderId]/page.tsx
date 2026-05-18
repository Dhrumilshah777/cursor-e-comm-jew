import type { Metadata } from "next";
import OrderDetailLoader from "@/components/account/OrderDetailLoader";

export const metadata: Metadata = {
  title: "Order Details | Jewelry",
  description: "View your order details, tracking, and delivery information.",
};

type PageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function OrderDetailPage({ params }: PageProps) {
  const { orderId } = await params;
  return <OrderDetailLoader orderId={orderId} />;
}
