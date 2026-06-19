import Link from "next/link";
import { googleLoginAction, stubLoginAction } from "@/app/actions/auth";
import Backdrop from "@/components/Backdrop";

const isStub = process.env.STUB_AUTH === "true";

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" className="shrink-0">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.4-3.5z" />
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 43.5c5.4 0 10.3-2 14-5.3l-6.5-5.5c-2 1.5-4.6 2.4-7.5 2.4-5.2 0-9.6-3.3-11.2-8l-6.6 5C9.6 39 16.2 43.5 24 43.5z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.5 5.5c-.5.4 7-5 7-15 0-1.2-.1-2.3-.4-3.5z" />
  </svg>
);

export default function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Backdrop />
      <main className="relative z-[2] flex min-h-screen flex-col items-center justify-center px-5 py-10">
        <Link href="/" className="mb-7 flex items-center gap-2.5">
          <div className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-primary text-xl">📖</div>
          <span className="font-display text-[21px] font-extrabold">StoryCraft</span>
        </Link>

        <div className="animate-pop w-full max-w-[430px] rounded-[28px] border border-border bg-surface px-10 pt-10 pb-[34px] text-center shadow-[0_20px_50px_rgba(120,90,60,0.1)]">
          <div className="mx-auto flex h-[60px] w-[60px] -rotate-6 items-center justify-center rounded-[18px] bg-peach text-[30px]">
            ✨
          </div>
          <h2 className="mt-[18px] mb-1.5 font-display text-[27px] font-extrabold">Войдите, чтобы начать</h2>
          <p className="mb-[26px] text-[15px] leading-[1.5] text-muted">
            Первая книга бесплатно. Сохраняем ваши сказки и профили детей.
          </p>

          <form action={googleLoginAction}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-[11px] rounded-[14px] border-2 border-[#e8e0d4] bg-surface p-[15px] text-base font-bold text-ink transition hover:border-[#d8cabb] hover:shadow-[0_4px_14px_rgba(120,90,60,0.08)]"
            >
              <GoogleIcon />
              Продолжить с Google
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[13px] font-semibold text-[#b09a89]">или скоро</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="flex cursor-not-allowed items-center justify-center gap-2.5 rounded-[14px] border-2 border-border bg-[#faf6f0] p-[13px] text-[15px] font-bold text-[#b09a89]">
               Войти через Apple
              <span className="ml-1 rounded-pill bg-[#ece1d2] px-2 py-0.5 text-[11px] font-bold text-muted">скоро</span>
            </div>
            <div className="flex cursor-not-allowed items-center justify-center gap-2.5 rounded-[14px] border-2 border-border bg-[#faf6f0] p-[13px] text-[15px] font-bold text-[#b09a89]">
              ✉️ Войти по эл. почте
              <span className="ml-1 rounded-pill bg-[#ece1d2] px-2 py-0.5 text-[11px] font-bold text-muted">скоро</span>
            </div>
          </div>

          {isStub && (
            <form action={stubLoginAction} className="mt-2.5">
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2.5 rounded-[14px] border-2 border-dashed border-[#e0d4c5] bg-field p-[13px] text-[15px] font-bold text-muted hover:border-primary hover:text-primary-dark"
              >
                🧪 Войти как тестовый пользователь (dev)
              </button>
            </form>
          )}

          <p className="mt-6 text-xs leading-[1.5] text-faint">
            Продолжая, вы соглашаетесь с{" "}
            <span className="font-bold text-primary-dark">Условиями</span> и{" "}
            <span className="font-bold text-primary-dark">Политикой конфиденциальности</span>.
          </p>
        </div>

        <Link href="/" className="mt-[18px] text-sm font-semibold text-faint">
          ← На главную
        </Link>
      </main>
    </div>
  );
}
