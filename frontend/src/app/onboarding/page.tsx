import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { apiFetch } from '@/lib/api';
import Backdrop from '@/components/Backdrop';
import { updateNameAction, addChildAction, skipChildAction } from '@/app/actions/onboarding';

const fieldCls =
  'w-full rounded-[14px] border-2 border-[#efe6da] bg-field px-4 py-3.5 text-base font-semibold text-ink outline-none focus:border-primary';
const labelCls = 'mb-[7px] block text-sm font-bold text-ink-soft';
const primaryBtn =
  'rounded-[14px] bg-primary p-[15px] font-display text-[17px] font-bold text-white shadow-primary transition hover:-translate-y-px';

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const session = await auth();
  if (!session) redirect('/login');

  const { step } = await searchParams;
  const isStep2 = step === '2';

  if (!isStep2) {
    const res = await apiFetch('/users/me');
    const user = (await res.json()) as { name: string | null };
    if (user.name) redirect('/dashboard');
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Backdrop />
      <main className="relative z-[2] flex min-h-screen flex-col items-center justify-center px-5 py-10">
        <Link href="/" className="mb-7 flex items-center gap-2.5">
          <div className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-primary text-xl">📖</div>
          <span className="font-display text-[21px] font-extrabold">StoryCraft</span>
        </Link>

        <div className="animate-pop w-full max-w-[480px] rounded-[28px] border border-border bg-surface px-10 py-[38px] shadow-[0_20px_50px_rgba(120,90,60,0.1)]">
          {/* progress */}
          <div className="mb-[26px] flex items-center gap-2">
            <div className="h-[7px] flex-1 rounded-pill bg-primary" />
            <div className={`h-[7px] flex-1 rounded-pill ${isStep2 ? 'bg-primary' : 'bg-border'}`} />
          </div>

          {!isStep2 ? (
            <div>
              <div className="text-[40px]">👋</div>
              <h2 className="mt-3.5 mb-1.5 font-display text-[28px] font-extrabold">Добро пожаловать!</h2>
              <p className="mb-6 text-base text-muted">Как вас зовут? Так мы обратимся к вам в приложении.</p>
              <form action={updateNameAction}>
                <label className={labelCls} htmlFor="name">Ваше имя</label>
                <input id="name" name="name" placeholder="Анна" required autoFocus className={fieldCls} />
                <button type="submit" className={`mt-6 w-full ${primaryBtn}`}>Продолжить →</button>
              </form>
            </div>
          ) : (
            <div>
              <div className="text-[40px]">🧸</div>
              <h2 className="mt-3.5 mb-1.5 font-display text-[28px] font-extrabold">Расскажите о ребёнке</h2>
              <p className="mb-[22px] text-base text-muted">Это поможет сделать сказку по-настоящему личной.</p>

              <div className="mb-[18px] flex items-center gap-3.5">
                <div className="flex h-[72px] w-[72px] shrink-0 flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-[#e7c3ac] bg-peach text-pink">
                  <div className="text-[22px]">📷</div>
                </div>
                <div className="text-[13px] leading-[1.4] text-faint">
                  Загрузите фото ребёнка позже — герой книги станет похож на него. Сейчас можно пропустить.
                </div>
              </div>

              <form action={addChildAction}>
                <div className="grid grid-cols-[1.4fr_1fr] gap-3">
                  <div>
                    <label className={labelCls} htmlFor="child-name">Имя ребёнка</label>
                    <input id="child-name" name="name" placeholder="Эмма" required className={fieldCls} />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="birthDate">Дата рождения</label>
                    <input id="birthDate" name="birthDate" type="date" className={fieldCls} />
                  </div>
                </div>

                <label className={`${labelCls} mt-[18px]`} htmlFor="gender">Пол</label>
                <select id="gender" name="gender" className={fieldCls}>
                  <option value="">Не указывать</option>
                  <option value="male">Мальчик</option>
                  <option value="female">Девочка</option>
                  <option value="other">Другое</option>
                </select>

                <label className={`${labelCls} mt-[18px]`} htmlFor="interests">Увлечения</label>
                <input
                  id="interests"
                  name="interests"
                  placeholder="Динозавры, космос, рисование"
                  className={fieldCls}
                />
                <p className="mt-[7px] text-xs leading-[1.45] text-faint">Перечислите через запятую. По желанию.</p>

                <div className="mt-[26px] flex gap-3">
                  <button type="submit" className={`flex-1 ${primaryBtn}`}>Готово, в кабинет →</button>
                </div>
              </form>
            </div>
          )}
        </div>

        <form action={skipChildAction}>
          <button type="submit" className="mt-[18px] text-sm font-semibold text-faint hover:text-muted">
            Пропустить пока
          </button>
        </form>
      </main>
    </div>
  );
}
