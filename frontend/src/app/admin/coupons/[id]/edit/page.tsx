import AdminCouponForm from "@/components/admin/AdminCouponForm";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

export default async function AdminEditCouponPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <AdminPageHeader title="Edit coupon" description="Update discount rules or deactivate." />
      <AdminCouponForm mode="edit" couponId={id} />
    </>
  );
}
