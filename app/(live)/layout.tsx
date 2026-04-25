import { Navbar } from "@/components/layout/navbar";

export default function LiveHubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <div className="mx-auto min-h-0 w-full max-w-6xl flex-1 px-3 pb-20 pt-4 sm:px-4">
        {children}
      </div>
    </>
  );
}
