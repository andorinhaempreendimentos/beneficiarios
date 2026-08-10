import { Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let organizacaoNome = "INSTITUTO ATLETA PARA SEMPRE";
  let objetoNome = "Escolinhas de Futebol e Futsal de Palmas – Núcleos de Inclusão e Cidadania";

  try {
    const sb = createClient();
    const [orgRes, objRes] = await Promise.all([
      sb.from('organizacoes').select('nome').is('deleted_at', null).limit(1).maybeSingle(),
      sb.from('objetos').select('nome').is('deleted_at', null).limit(1).maybeSingle(),
    ]);

    if (orgRes.data?.nome) organizacaoNome = orgRes.data.nome;
    if (objRes.data?.nome) objetoNome = objRes.data.nome;
  } catch {
    // fallback
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 shadow-2xs">
        <div className="mx-auto flex max-w-3xl flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-white shadow-2xs shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-base font-extrabold text-zinc-900 leading-tight">
                {organizacaoNome}
              </span>
              <span className="block text-xs font-semibold text-sky-700 mt-0.5">
                {objetoNome}
              </span>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        {children}
      </main>
      <footer className="border-t border-zinc-200 bg-white px-6 py-4 text-center text-xs text-zinc-500">
        <p className="font-bold text-zinc-700">{organizacaoNome}</p>
        <p className="mt-0.5 text-zinc-400">{objetoNome} &copy; 2026</p>
      </footer>
    </div>
  );
}
