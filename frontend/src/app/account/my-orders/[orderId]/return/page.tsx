import type { Metadata } from "next";
import ReturnRequestLoader from "@/components/account/ReturnRequestLoader";

export const metadata: Metadata = {
  title: "Return Request | Jewelry",
  description: "Start a return request for your order.",
};

type PageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function ReturnRequestPage({ params }: PageProps) {
  const { orderId } = await params;
  return <ReturnRequestLoader orderId={orderId} />;
}
