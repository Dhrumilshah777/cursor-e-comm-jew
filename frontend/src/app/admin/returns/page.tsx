import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminReturnsPanel from "@/components/admin/AdminReturnsPanel";

export default function AdminReturnsPage() {
  return (
    <>
      <AdminPageHeader
        title="Returns"
        description="Review and process customer return requests."
      />
      <AdminReturnsPanel />
    </>
  );
}
