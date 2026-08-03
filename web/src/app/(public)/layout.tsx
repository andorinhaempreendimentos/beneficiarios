import { LayoutDashboard } from "lucide-react";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-600">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-zinc-900">Andorinha</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        {children}
      </main>
      <footer className="border-t border-zinc-200 bg-white px-6 py-4 text-center text-xs text-zinc-400">
        Andorinha &copy; 2024 — Sistema de Gestão de Beneficiários
      </footer>
    </div>
  );
}
