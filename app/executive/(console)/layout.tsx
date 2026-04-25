import { ExecutiveConsoleChrome } from "@/components/executive/executive-console-chrome";

export default function ExecutiveConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ExecutiveConsoleChrome>{children}</ExecutiveConsoleChrome>;
}
