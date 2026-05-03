import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const next = sp.next && sp.next.startsWith("/") ? sp.next : "/admin";

  return (
    <>
      {/* Background blurs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-container/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-primary-container/5 blur-[100px] rounded-full" />
      </div>

      {/* Main viewport */}
      <main className="relative z-10 flex min-h-screen items-center justify-center p-3">
        <LoginForm next={next} />
      </main>

      {/* Decorative side panel — matches Stitch image composition */}
      <div className="fixed top-0 right-0 h-full w-[30vw] pointer-events-none hidden lg:flex items-center justify-center overflow-hidden">
        <div className="relative w-full aspect-square max-w-[500px] opacity-20 rotate-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="w-full h-full object-cover rounded-full grayscale opacity-50 mix-blend-screen"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDc9OylEAUJ8Y0XY8rBj6yeYAZXKrJuJfqHzj6jAM0DOMoiRrwqqTpYdAT0wajFFkikhmKZGYKeHUHOIDVk2q_J4hjn1mcFX1-a6tkPEN5K3S33dJLqSggxTuFeRgD0ANsWHCCv3w0OdZ1R0IR9QV9YGjxtfYRvMRQYqkbZcx8Pfq3El4CbHhTD32ZHX6UXR1bZBLZ_8c6bNhA97wztNVFL4hGtDZV4PmQSZCQE_S2_tUEdC0dZ22Fl7XWlUKkLB5U0vDwYIJQU0g"
            alt=""
          />
          <div className="absolute inset-0 bg-gradient-to-l from-background to-transparent" />
        </div>
      </div>

      {/* System meta bar — exact Stitch labels */}
      <div className="fixed bottom-6 w-full flex justify-center pointer-events-none z-10">
        <div className="flex items-center gap-6 font-mono text-[10px] text-outline uppercase tracking-widest opacity-40">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            US-EAST-1_CLUSTER_ACTIVE
          </div>
          <div className="h-3 w-px bg-outline/20" />
          <div>ENCRYPTION: AES-256-GCM</div>
          <div className="h-3 w-px bg-outline/20" />
          <div>v2.4.0-STABLE</div>
        </div>
      </div>
    </>
  );
}
