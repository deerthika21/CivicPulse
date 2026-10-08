import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Copy, FileText, ImageIcon, MapPin, Mic, Search, ShieldAlert, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { LocationPicker } from '@/components/maps/LocationPicker';
import { PageTransition } from '@/components/motion';
import { PhotoPicker } from '@/components/PhotoPicker';
import { TriageSummary } from '@/components/TriageSummary';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input, Label, Textarea } from '@/components/ui/primitives';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { submitComplaint } from '@/lib/api';
import { CHENNAI_CENTER } from '@/lib/constants';
import { useI18n, type StringKey } from '@/lib/i18n';
import { addMyReport } from '@/lib/myReports';
import type { LatLng, SubmitResponse } from '@/lib/types';
import { cn } from '@/lib/utils';

const STEPS: { key: StringKey; icon: typeof FileText }[] = [
  { key: 'stepDescribe', icon: FileText },
  { key: 'stepLocation', icon: MapPin },
  { key: 'stepReview', icon: Check },
];

export function ReportPage() {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [audio, setAudio] = useState<Blob | null>(null);
  const [location, setLocation] = useState<LatLng>({ lat: CHENNAI_CENTER[0], lng: CHENNAI_CENTER[1] });
  const [address, setAddress] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SubmitResponse | null>(null);

  const onAddress = useCallback((a: string) => setAddress(a), []);
  const hasInput = text.trim().length >= 5 || !!photo || !!audio;

  const reset = () => {
    setText('');
    setPhoto(null);
    setAudio(null);
    setResult(null);
    setError('');
    setStep(0);
  };

  const goto = (s: number) => {
    setError('');
    if (s > 0 && !hasInput) {
      setStep(0);
      return setError(t('needInput'));
    }
    setStep(s);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (step < 2) return goto(step + 1);
    setError('');
    if (!hasInput) return goto(0);
    const form = new FormData();
    form.append('text', text.trim());
    form.append('lat', String(location.lat));
    form.append('lng', String(location.lng));
    if (address) form.append('address', address);
    if (name.trim()) form.append('name', name.trim());
    if (phone.trim()) form.append('phone', phone.trim());
    if (photo) form.append('photo', photo, photo.name);
    if (audio) form.append('audio', audio, `voice.${audio.type.includes('mp4') ? 'm4a' : audio.type.includes('ogg') ? 'ogg' : 'webm'}`);
    setSubmitting(true);
    try {
      const res = await submitComplaint(form);
      setResult(res);
      addMyReport({ code: res.complaint.trackingCode, summary: res.complaint.summary, at: res.complaint.createdAt });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (result) return <SubmitResult result={result} onAnother={reset} />;

  return (
    <PageTransition className="mx-auto max-w-xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <h1 className="font-display text-[28px] font-bold tracking-tight">{t('newComplaint')}</h1>
          <Stepper step={step} onStep={(s) => s < step && goto(s)} />
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }} className="space-y-5">
            {step === 0 && (
              <>
                <div className="space-y-2.5">
                  <Label htmlFor="text">{t('describe')}</Label>
                  <Textarea id="text" value={text} onChange={(e) => setText(e.target.value)} placeholder={t('describePlaceholder')} maxLength={4000} autoFocus />
                  <p className="text-right text-[11px] text-subtle tabular-nums">{text.length} / 4000</p>
                </div>
                <PhotoPicker value={photo} onChange={setPhoto} />
                <VoiceRecorder value={audio} onChange={setAudio} />
              </>
            )}

            {step === 1 && (
              <div className="space-y-2.5">
                <Label>{t('location')}</Label>
                <p className="text-sm text-muted-foreground">{t('locationHelp')}</p>
                <LocationPicker value={location} onChange={setLocation} address={address} onAddress={onAddress} />
              </div>
            )}

            {step === 2 && (
              <>
                <Card className="gap-0 divide-y divide-border p-0">
                  <ReviewRow icon={FileText} label={t('describe')} onEdit={() => goto(0)}>
                    {text.trim() ? <p className="line-clamp-4 whitespace-pre-wrap">{text.trim()}</p> : <p className="italic text-subtle">{t('noText')}</p>}
                  </ReviewRow>
                  <ReviewRow icon={ImageIcon} label={t('attachments')} onEdit={() => goto(0)}>
                    <div className="flex flex-wrap gap-2">
                      {photo && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800">
                          <ImageIcon className="size-3" /> Photo
                        </span>
                      )}
                      {audio && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800">
                          <Mic className="size-3" /> {t('voiceNote')}
                        </span>
                      )}
                      {!photo && !audio && <span className="text-subtle">{t('none')}</span>}
                    </div>
                  </ReviewRow>
                  <ReviewRow icon={MapPin} label={t('location')} onEdit={() => goto(1)}>
                    <p>{address || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}</p>
                  </ReviewRow>
                </Card>
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <Label>{t('contactDetails')}</Label>
                    <span className="text-xs text-subtle">{t('optional')}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} autoComplete="name" placeholder={t('yourName')} aria-label={t('yourName')} />
                    <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={15} autoComplete="tel" inputMode="tel" placeholder={t('phone')} aria-label={t('phone')} />
                  </div>
                  <p className="text-xs text-subtle">{t('contactHint')}</p>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          {step > 0 && (
            <Button type="button" variant="outline" size="xl" onClick={() => goto(step - 1)} aria-label={t('back')}>
              <ArrowLeft />
            </Button>
          )}
          <Button type="submit" size="xl" className="flex-1" disabled={submitting}>
            {step < 2 ? (
              <>
                {t('continue')} <ArrowRight />
              </>
            ) : (
              <>
                <Sparkles /> {t('submit')}
              </>
            )}
          </Button>
        </div>
      </form>

      <AnimatePresence>{submitting && <AnalysingOverlay hasPhoto={!!photo} />}</AnimatePresence>
    </PageTransition>
  );
}

function Stepper({ step, onStep }: { step: number; onStep: (s: number) => void }) {
  const { t } = useI18n();
  return (
    <ol className="mt-5 flex items-center gap-2" aria-label="Progress">
      {STEPS.map(({ key, icon: Icon }, i) => {
        const done = i < step;
        const current = i === step;
        return (
          <li key={key} className="flex flex-1 items-center gap-2">
            <button
              type="button"
              onClick={() => onStep(i)}
              disabled={i >= step}
              aria-current={current ? 'step' : undefined}
              className="flex min-w-0 items-center gap-2 disabled:cursor-default"
            >
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-200',
                  done && 'bg-teal-brand text-white',
                  current && 'bg-brand-gradient text-white shadow-brand',
                  !done && !current && 'bg-slate-100 text-subtle ring-1 ring-inset ring-border',
                )}
              >
                {done ? <Check className="size-4" /> : <Icon className="size-3.5" />}
              </span>
              <span className={cn('truncate text-[13px] font-semibold', current ? 'text-foreground' : 'text-subtle')}>{t(key)}</span>
            </button>
            {i < STEPS.length - 1 && <span className={cn('h-0.5 min-w-3 flex-1 rounded-full transition-colors', done ? 'bg-teal-500' : 'bg-slate-200')} />}
          </li>
        );
      })}
    </ol>
  );
}

function ReviewRow({ icon: Icon, label, children, onEdit }: { icon: typeof FileText; label: string; children: React.ReactNode; onEdit: () => void }) {
  const { t } = useI18n();
  return (
    <div className="flex gap-3 p-4 text-sm">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-xs font-semibold text-subtle">{label}</p>
        <div className="text-foreground">{children}</div>
      </div>
      <button type="button" onClick={onEdit} className="self-start text-xs font-semibold text-brand-600 hover:underline">
        {t('edit')}
      </button>
    </div>
  );
}

function AnalysingOverlay({ hasPhoto }: { hasPhoto: boolean }) {
  const { t } = useI18n();
  const lines = (['analysing1', ...(hasPhoto ? (['analysing2'] as const) : []), 'analysing3', 'analysing4'] as StringKey[]).map(t);
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % lines.length), 1400);
    return () => clearInterval(id);
  }, [lines.length]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[900] flex flex-col items-center justify-center gap-6 bg-white/85 p-6 text-center backdrop-blur-md"
      role="status"
      aria-live="polite"
    >
      <div className="relative">
        <div className="absolute -inset-6 animate-pulse rounded-full bg-brand-teal-gradient opacity-30 blur-2xl" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
          className="relative flex size-24 items-center justify-center rounded-[28px] bg-[linear-gradient(120deg,#3730A3,#4F46E5,#0D9488,#4F46E5,#3730A3)] bg-[length:300%_300%] animate-gradient shadow-brand"
        >
          <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}>
            <Sparkles className="size-10 text-white" strokeWidth={1.75} />
          </motion.div>
        </motion.div>
      </div>
      <div className="h-14 space-y-2">
        <AnimatePresence mode="wait">
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="font-display text-xl font-bold text-slate-900"
          >
            {lines[i]}
          </motion.p>
        </AnimatePresence>
        <p className="text-sm text-muted-foreground">{t('analysingSub')}</p>
      </div>
      <div className="flex gap-1.5">
        {lines.map((_, k) => (
          <span key={k} className={cn('h-1.5 rounded-full transition-all duration-300', k === i ? 'w-6 bg-brand-600' : 'w-1.5 bg-slate-300')} />
        ))}
      </div>
    </motion.div>
  );
}

function SubmitResult({ result, onAnother }: { result: SubmitResponse; onAnother: () => void }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const { complaint, issue, duplicate } = result;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(complaint.trackingCode);
      setCopied(true);
      toast.success(t('copied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  const others = issue ? issue.reportCount - 1 : 0;

  return (
    <PageTransition className="mx-auto max-w-xl space-y-5 px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
      <div className="flex flex-col items-center gap-3 text-center">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 16 }}
          className={cn(
            'flex size-16 items-center justify-center rounded-2xl shadow-lift',
            complaint.isSpam ? 'bg-amber-100 text-amber-700' : 'bg-gradient-to-br from-emerald-400 to-teal-600 text-white',
          )}
        >
          {complaint.isSpam ? <ShieldAlert className="size-8" /> : <Check className="size-8" strokeWidth={3} />}
        </motion.div>
        <h1 className="font-display text-2xl font-bold tracking-tight">{t('submitted')}</h1>
      </div>

      {/* tracking ID */}
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-900 p-4 pl-5 text-white shadow-lift">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{t('trackingId')}</p>
          <p className="font-mono text-2xl font-bold tracking-[0.12em]">{complaint.trackingCode}</p>
          <p className="mt-0.5 text-xs text-slate-400">{t('saveCode')}</p>
        </div>
        <Button size="sm" variant="glass" onClick={copy} aria-label={t('copy')}>
          {copied ? <Check /> : <Copy />} {copied ? t('copied') : t('copy')}
        </Button>
      </div>

      {complaint.isSpam ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{t('spamNotice')}</p>
      ) : (
        <>
          {duplicate && issue && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="relative overflow-hidden rounded-2xl bg-brand-gradient p-5 text-white shadow-brand"
            >
              <div className="pointer-events-none absolute inset-0 bg-grid-light" />
              <div className="relative flex items-center gap-4">
                <div className="flex -space-x-2.5">
                  {['from-amber-300 to-orange-400', 'from-teal-300 to-teal-500', 'from-pink-300 to-rose-400'].slice(0, Math.min(3, others)).map((g, k) => (
                    <span key={k} className={`size-9 rounded-full bg-gradient-to-br ring-2 ring-brand-600 ${g}`} />
                  ))}
                  <span className="flex size-9 items-center justify-center rounded-full bg-white text-xs font-bold text-brand-800 ring-2 ring-brand-600">+{others}</span>
                </div>
                <div>
                  <p className="font-display text-lg font-bold leading-tight">
                    +{others} {t('citizensReported')}
                  </p>
                  <p className="mt-0.5 text-sm text-indigo-100">{t('mergedNotice')}</p>
                </div>
              </div>
            </motion.div>
          )}
          <Card className="p-5 sm:p-6">
            <TriageSummary complaint={complaint} issue={issue} />
          </Card>
        </>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Button asChild variant="outline" size="lg">
          <Link to={`/track/${complaint.trackingCode}`}>
            <Search /> {t('viewStatus')}
          </Link>
        </Button>
        <Button size="lg" onClick={onAnother}>
          {t('reportAnother')}
        </Button>
      </div>
    </PageTransition>
  );
}
