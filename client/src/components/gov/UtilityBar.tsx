import { useState } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { getFontSize, setFontSize, type FontSize } from '@/lib/a11y';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/** Thin government-style utility strip: skip link, prototype note, text size, language, theme. */
export function UtilityBar({ className }: { className?: string }) {
  const { t, lang, setLang } = useI18n();
  const [fs, setFs] = useState<FontSize>(getFontSize);

  const size = (s: FontSize) => {
    setFs(s);
    setFontSize(s);
  };

  return (
    <div className={cn('theme-light relative z-[800] bg-navy-950 text-[0.75rem] text-slate-300', className)}>
      <div className="mx-auto flex min-h-9 max-w-[1280px] flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-1 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <a
            href="#main"
            className="sr-only shrink-0 rounded font-semibold text-white underline-offset-4 hover:underline focus:not-sr-only md:not-sr-only"
          >
            {t('skipToContent')}
          </a>
          <span className="hidden h-3 w-px bg-white/20 md:block" aria-hidden />
          <span className="hidden truncate md:block">{t('utilityNote')}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-0.5" role="group" aria-label={t('textSize')}>
            {(
              [
                ['sm', 'A−', t('textSmaller'), 'text-[0.6875rem]'],
                ['md', 'A', t('textDefault'), 'text-[0.8125rem]'],
                ['lg', 'A+', t('textLarger'), 'text-[0.9375rem]'],
              ] as const
            ).map(([s, label, aria, cls]) => (
              <button
                key={s}
                type="button"
                onClick={() => size(s)}
                aria-pressed={fs === s}
                aria-label={aria}
                className={cn('min-w-7 rounded px-1.5 py-0.5 font-bold leading-none transition', cls, fs === s ? 'bg-white text-navy-900' : 'text-slate-200 hover:bg-white/10')}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="h-3 w-px bg-white/20" aria-hidden />
          <div className="flex items-center rounded-full bg-white/10 p-0.5" role="group" aria-label="Language">
            {(
              [
                ['en', 'EN'],
                ['ta', 'தமிழ்'],
              ] as const
            ).map(([code, label]) => (
              <button
                key={code}
                type="button"
                lang={code}
                aria-pressed={lang === code}
                onClick={() => setLang(code)}
                className={cn('rounded-full px-2.5 py-0.5 font-semibold transition', lang === code ? 'bg-gold text-navy-950' : 'text-slate-200 hover:text-white')}
              >
                {label}
              </button>
            ))}
          </div>
          <ThemeToggle className="size-7 border-white/15 bg-white/10 text-slate-200 shadow-none hover:text-white" />
        </div>
      </div>
    </div>
  );
}
