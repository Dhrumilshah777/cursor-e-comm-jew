import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

export default function AdminHomePage() {
  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description="Overview of orders, returns, products, and revenue."
      />
      <AdminDashboard />
    </>
  );
}
