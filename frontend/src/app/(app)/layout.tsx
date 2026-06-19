import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { apiFetch } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Backdrop from "@/components/Backdrop";

// App shell for authenticated screens: decorative backdrop + shared navbar with
// the live coin balance. Pre-auth screens (landing, auth, onboarding) live
// outside this route group and render without the shell.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const res = await apiFetch("/users/me");
  const user = res.ok
    ? ((await res.json()) as { name: string | null; balance: number })
    : { name: null, balance: 0 };

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Backdrop />
      <Navbar balance={user.balance} userName={user.name} />
      <div className="relative z-[2]">{children}</div>
    </div>
  );
}
