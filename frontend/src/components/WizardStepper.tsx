import { Fragment } from 'react';

// Three-step header for the book wizard. `active` is the 1-based current step.
const STEPS = ['Тип книги', 'Настройка', 'Генерация'];

export default function WizardStepper({ active }: { active: 1 | 2 | 3 }) {
  return (
    <div className="mb-[34px] flex items-center gap-2">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const on = step <= active;
        return (
          <Fragment key={label}>
            {i > 0 && <div className="h-0.5 flex-1 bg-border" />}
            <div className="flex items-center gap-[9px]">
              <div
                className={`flex h-[34px] w-[34px] items-center justify-center rounded-full font-display text-[15px] font-bold ${
                  on ? 'bg-primary text-white' : 'bg-border text-[#a89a8d]'
                }`}
              >
                {step}
              </div>
              <span
                className={`font-display text-[15px] font-bold ${on ? 'text-ink' : 'text-faint'}`}
              >
                {label}
              </span>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}
