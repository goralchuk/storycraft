import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { apiFetch, jsonOrNull } from '@/lib/api';
import { getPricing } from '@/lib/pricing';
import WizardStepper from '@/components/WizardStepper';
import WizardStep1, { type TemplateOption } from './WizardStep1';
import WizardStep2, {
  type Child,
  type Hero,
  type Topic,
  type StyleOption,
} from './WizardStep2';

type Draft = {
  id: string;
  bookType: 'UNIQUE' | 'TEMPLATE';
  childId: string | null;
  pageCount: number | null;
  topicId: string | null;
  styleTemplateId: string | null;
  promptText: string | null;
  template: { title: string } | null;
};

const wrap = 'mx-auto max-w-[980px] px-10 pt-9 pb-[120px]';

export default async function NewBookPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const [draftRes, meRes, pricing] = await Promise.all([
    apiFetch('/books/draft', { cache: 'no-store' }),
    apiFetch('/users/me'),
    getPricing(),
  ]);
  const draft = await jsonOrNull<Draft>(draftRes);
  const me = (meRes.ok ? await meRes.json() : { balance: 0 }) as { balance: number };
  const price = (key: string) => pricing.find((p) => p.key === key)?.amount ?? 0;

  // STEP 1 — no paid draft yet: choose type (+ template) and pay.
  if (!draft) {
    const templatesRes = await apiFetch('/templates', { cache: 'no-store' });
    const templates = (templatesRes.ok ? await templatesRes.json() : []) as TemplateOption[];
    return (
      <main className={wrap}>
        <WizardStepper active={1} />
        <WizardStep1
          templates={templates}
          uniqueCost={price('BOOK_UNIQUE')}
          templateCost={price('BOOK_TEMPLATE')}
          balance={me.balance}
        />
      </main>
    );
  }

  // STEP 2 — configure the paid draft, then generate.
  const [childrenRes, topicsRes, stylesRes] = await Promise.all([
    apiFetch('/children', { cache: 'no-store' }),
    apiFetch('/topics', { cache: 'no-store' }),
    apiFetch('/styles', { cache: 'no-store' }),
  ]);
  const children = (childrenRes.ok ? await childrenRes.json() : []) as Child[];
  const topics = (topicsRes.ok ? await topicsRes.json() : []) as Topic[];
  const styles = (stylesRes.ok ? await stylesRes.json() : []) as StyleOption[];

  // Heroes belong to the selected child; only load them once a child is chosen.
  let heroes: Hero[] = [];
  if (draft.childId) {
    const heroesRes = await apiFetch(`/children/${draft.childId}/heroes`, { cache: 'no-store' });
    heroes = (heroesRes.ok ? await heroesRes.json() : []) as Hero[];
  }

  return (
    <main className={wrap}>
      <WizardStepper active={2} />
      <WizardStep2
        draft={draft}
        kids={children}
        heroes={heroes}
        topics={topics}
        styles={styles}
        balance={me.balance}
        companionCost={price('COMPANION')}
        topupCost={price('HERO_TOPUP')}
        pageSurcharge={{ 16: price('PAGE_16'), 20: price('PAGE_20'), 24: price('PAGE_24') }}
      />
    </main>
  );
}
