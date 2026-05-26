import AdminGoldRatesPanel from "@/components/admin/AdminGoldRatesPanel";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

export default function AdminGoldRatesPage() {
  return (
    <>
      <AdminPageHeader
        title="Gold rates"
        description="Set the 24KT base rate per gram. 22KT, 18KT, and 14KT rates and all product prices update automatically."
      />
      <AdminGoldRatesPanel />
    </>
  );
}
