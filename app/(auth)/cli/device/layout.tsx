import { requireBrowserSessionOrRedirect } from "@/lib/auth/require-browser-session";

export const dynamic = "force-dynamic";

export default async function CliDeviceLayout({ children }: { children: React.ReactNode }) {
  await requireBrowserSessionOrRedirect("/cli/device");
  return <>{children}</>;
}
