import AdminOrdersTable from "@/components/admin/AdminOrdersTable";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

export default function AdminOrdersPage() {
  return (
    <>
      <AdminPageHeader
        title="Orders"
        description="All customer orders from the database."
      />
      <AdminOrdersTable />
    </>
  );
}
