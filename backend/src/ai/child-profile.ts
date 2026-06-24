// Resolve the child's age + gender for prompts, with the agreed fallbacks:
// age from birthDate, else the story theme's age range; gender from the child,
// else the neutral «ребёнок». Reused by the story prompt, the illustration prompt,
// and hero generation (9.5).

export type ChildGender = 'мальчик' | 'девочка' | 'ребёнок';

export type ChildProfile = {
  age: number | null;
  gender: ChildGender;
  /** Short human-readable descriptor, e.g. «мальчик, 3 года» / «ребёнок». */
  descriptor: string;
};

export function resolveChildProfile(
  child: { birthDate?: Date | null; gender?: string | null },
  template?: { ageRange?: string | null } | null,
): ChildProfile {
  const age = ageFromBirthDate(child.birthDate) ?? ageFromRange(template?.ageRange);
  const gender = normalizeGender(child.gender);
  const descriptor =
    age != null ? `${gender}, ${age} ${yearsWord(age)}` : gender;
  return { age, gender, descriptor };
}

function ageFromBirthDate(birthDate?: Date | null): number | null {
  if (!birthDate) return null;
  const ms = Date.now() - new Date(birthDate).getTime();
  if (ms <= 0) return null;
  const years = Math.floor(ms / (365.25 * 24 * 60 * 60 * 1000));
  return years >= 0 && years <= 18 ? years : null;
}

// Age range looks like "3–7" / "4-8" / "6–10" — take the lower bound.
function ageFromRange(range?: string | null): number | null {
  if (!range) return null;
  const m = range.match(/\d+/);
  return m ? Number(m[0]) : null;
}

function normalizeGender(raw?: string | null): ChildGender {
  const g = (raw ?? '').trim().toLowerCase();
  if (/^(m|male|boy|муж|мальч|мал)/.test(g)) return 'мальчик';
  if (/^(f|female|girl|жен|дев)/.test(g)) return 'девочка';
  return 'ребёнок';
}

// Russian declension for "год / года / лет".
function yearsWord(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'год';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'года';
  return 'лет';
}
