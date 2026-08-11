import { Sidebar } from "@/components/layout/Sidebar";
import { TopLocationBar } from "@/components/layout/TopLocationBar";

export const dynamic = 'force-dynamic';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-full min-h-screen bg-zinc-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <TopLocationBar />
        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
