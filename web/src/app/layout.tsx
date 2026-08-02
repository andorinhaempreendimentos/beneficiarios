import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Sidebar } from "@/components/layout/Sidebar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Andorinha - Cadastro de Beneficiários",
  description: "Sistema de gestão de núcleos, beneficiários, pessoal e atividades",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full">
        <div className="flex h-full min-h-screen bg-zinc-50">
          <Sidebar />
          <main className="flex-1 overflow-y-auto px-4 py-6 pt-16 lg:px-8 lg:pt-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
