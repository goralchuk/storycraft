import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";

// Shared top navigation for authenticated screens. Presentational: balance and
// user name are passed in by the app-shell layout (server-fetched from /users/me).
export default function Navbar({
  balance,
  userName,
}: {
  balance: number;
  userName: string | null;
}) {
  const initial = (userName?.trim()?.[0] ?? "?").toUpperCase();

  return (
    <header className="relative z-10 flex h-[74px] items-center gap-6 border-b border-border bg-bg/80 px-10 backdrop-blur-md">
      <Link href="/dashboard" className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-primary text-[21px] shadow-[0_5px_14px_rgba(232,130,90,0.4)]">
          📖
        </div>
        <span className="font-display text-[23px] font-extrabold tracking-[-0.3px]">
          StoryCraft
        </span>
      </Link>

      <nav className="ml-4 flex gap-1.5">
        <Link
          href="/dashboard"
          className="rounded-pill px-4 py-2 text-[15px] font-bold text-ink-soft hover:bg-[#f3e8d9] hover:text-ink"
        >
          Мои книги
        </Link>
        <Link
          href="/children"
          className="rounded-pill px-4 py-2 text-[15px] font-bold text-ink-soft hover:bg-[#f3e8d9] hover:text-ink"
        >
          Дети
        </Link>
      </nav>

      <div className="flex-1" />

      <Link
        href="/wallet"
        className="inline-flex items-center gap-2 rounded-pill border border-border bg-surface px-4 py-2 font-display text-[15px] font-extrabold text-ink shadow-[0_2px_8px_rgba(120,90,60,0.06)] hover:border-[#f1c9b3]"
      >
        <span className="text-base">🪙</span>
        {balance}
        <span className="ml-1 inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#fff0e8] text-[15px] leading-none text-primary-dark">
          ＋
        </span>
      </Link>

      <Link
        href="/books/new"
        className="inline-flex items-center gap-2 rounded-pill bg-primary px-5 py-2.5 font-display text-[15px] font-bold text-white shadow-primary transition hover:-translate-y-0.5"
      >
        ✨ Создать книгу
      </Link>

      <form action={logoutAction} className="flex items-center pl-1.5">
        <button
          type="submit"
          title="Выйти"
          className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#ffe0cd] font-display text-[17px] font-bold text-primary-dark shadow-[0_2px_8px_rgba(120,90,60,0.12)] transition hover:brightness-95"
        >
          {initial}
        </button>
      </form>
    </header>
  );
}
