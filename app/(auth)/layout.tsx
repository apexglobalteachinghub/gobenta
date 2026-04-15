export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-surface/70 via-zinc-50 to-zinc-100 px-4 py-12 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-950">
      {children}
    </div>
  );
}
