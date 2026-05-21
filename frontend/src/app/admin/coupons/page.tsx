import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminCouponsTable from "@/components/admin/AdminCouponsTable";

export default function AdminCouponsPage() {
  return (
    <>
      <AdminPageHeader
        title="Coupons"
        description="Create discount codes for checkout — percentage or fixed amount off."
      />
      <AdminCouponsTable />
    </>
  );
}
