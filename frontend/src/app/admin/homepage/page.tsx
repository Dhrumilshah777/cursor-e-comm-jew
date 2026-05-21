import AdminHomepagePanel from "@/components/admin/AdminHomepagePanel";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

export default function AdminHomepagePage() {
  return (
    <>
      <AdminPageHeader
        title="Homepage sections"
        description="Manage New Arrivals, Top Styles, and Elegance in Motion videos."
      />
      <AdminHomepagePanel />
    </>
  );
}
