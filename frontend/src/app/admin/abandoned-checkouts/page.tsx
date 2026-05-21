import AdminAbandonedCheckoutsTable from "@/components/admin/AdminAbandonedCheckoutsTable";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

export default function AdminAbandonedCheckoutsPage() {
  return (
    <>
      <AdminPageHeader
        title="Abandoned checkout"
        description="Customers who clicked Pay with Razorpay but did not complete payment. Use this to follow up on WhatsApp."
      />
      <AdminAbandonedCheckoutsTable />
    </>
  );
}
