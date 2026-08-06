import { Sidebar } from "@/components/layout/Sidebar";

export const dynamic = 'force-dynamic';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-full min-h-screen bg-zinc-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 py-6 pt-16 lg:px-8 lg:pt-6">{children}</main>
    </div>
  );
}
