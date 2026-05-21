import AdminCouponForm from "@/components/admin/AdminCouponForm";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

export default function AdminNewCouponPage() {
  return (
    <>
      <AdminPageHeader
        title="Create coupon"
        description="Set the code, discount, limits, and validity dates."
      />
      <AdminCouponForm mode="create" />
    </>
  );
}
