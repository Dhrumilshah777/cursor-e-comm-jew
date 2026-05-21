import { Suspense } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminProductForm from "@/components/admin/AdminProductForm";

export default function AdminNewProductPage() {
  return (
    <>
      <AdminPageHeader
        title="Add product"
        description="Create a new catalog product. Price is calculated from weight, purity, and making charge."
      />
      <Suspense fallback={<p className="text-sm font-light text-zinc-500">Loading form…</p>}>
        <AdminProductForm mode="create" />
      </Suspense>
    </>
  );
}
