import { AlertProvider } from "@/components/ui/alert-provider";
import { requireBrowserSessionOrRedirect } from "@/lib/auth/require-browser-session";
import { adminHeaderRowClassName } from "./admin-chrome";
import { AdminSectionTitle } from "./admin-section-title";
import { SideNav } from "./side-nav";
import { UserMenu } from "./user-menu";

export const dynamic = "force-dynamic";

export default async function AdminShellLayout({ children }: { children: React.ReactNode }) {
  await requireBrowserSessionOrRedirect("/admin");

  return (
    <AlertProvider>
    <div className="h-screen overflow-hidden bg-background text-on-surface">
      {/* Sidebar */}
      <SideNav />

      {/* Main content area */}
      <div className="ml-12 h-screen flex flex-col">
        {/* Top bar */}
        <header
          className={`flex ${adminHeaderRowClassName} w-full shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-4`}
        >
          <div className="min-w-0 flex-1">
            <AdminSectionTitle />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <UserMenu />
          </div>
        </header>

        {/* Page content */}
        <main className="flex min-h-0 flex-1 flex-col overflow-auto px-4 py-3">
          {children}
        </main>
      </div>
    </div>
    </AlertProvider>
  );
}
