import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminProductsTable from "@/components/admin/AdminProductsTable";

export default function AdminProductsPage() {
  return (
    <>
      <AdminPageHeader
        title="Products"
        description="Catalog products synced from the database."
      />
      <AdminProductsTable />
    </>
  );
}
