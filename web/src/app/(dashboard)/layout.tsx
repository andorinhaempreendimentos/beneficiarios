import { Sidebar } from "@/components/layout/Sidebar";
import { TopLocationBar } from "@/components/layout/TopLocationBar";

export const dynamic = 'force-dynamic';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-full min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors print:bg-white print:text-black print:min-h-0 print:h-auto print:block">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto print:overflow-visible print:block print:w-full">
        <div className="print:hidden">
          <TopLocationBar />
        </div>
        <main className="flex-1 px-4 py-6 lg:px-8 print:p-0 print:m-0 print:block print:w-full">{children}</main>
      </div>
    </div>
  );
}
