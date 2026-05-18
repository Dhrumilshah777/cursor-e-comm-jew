import AccountAuthGuard from "@/components/account/AccountAuthGuard";
import AccountShell from "@/components/account/AccountShell";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AccountAuthGuard>
      <AccountShell>{children}</AccountShell>
    </AccountAuthGuard>
  );
}