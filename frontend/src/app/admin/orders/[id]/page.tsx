import AdminOrderDetail from "@/components/admin/AdminOrderDetail";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <>
      <AdminPageHeader
        title="Order details"
        description="View order, customer, payment, and update fulfillment status."
      />
      <AdminOrderDetail orderId={id} />
    </>
  );
}
