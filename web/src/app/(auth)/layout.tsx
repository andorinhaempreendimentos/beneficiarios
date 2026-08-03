export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-full min-h-screen items-center justify-center bg-zinc-100">
      {children}
    </div>
  );
}
