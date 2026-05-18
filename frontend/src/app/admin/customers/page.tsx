import AdminCustomersTable from "@/components/admin/AdminCustomersTable";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

export default function AdminCustomersPage() {
  return (
    <>
      <AdminPageHeader
        title="Customers"
        description="Registered customers and their activity."
      />
      <AdminCustomersTable />
    </>
  );
}
