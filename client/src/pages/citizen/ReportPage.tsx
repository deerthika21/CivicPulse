import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, GitMerge, Loader2, ShieldAlert, Sparkles } from 'lucide-react';
import { useCallback, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { LocationPicker } from '@/components/maps/LocationPicker';
import { PhotoPicker } from '@/components/PhotoPicker';
import { TriageSummary } from '@/components/TriageSummary';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input, Label, Textarea } from '@/components/ui/primitives';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { submitComplaint } from '@/lib/api';
import { CHENNAI_CENTER } from '@/lib/constants';
import { useI18n } from '@/lib/i18n';
import { addMyReport } from '@/lib/myReports';
import type { LatLng, SubmitResponse } from '@/lib/types';

export function ReportPage() {
  const { t } = useI18n();
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

  const reset = () => {
    setText('');
    setPhoto(null);
    setAudio(null);
    setResult(null);
    setError('');
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (text.trim().length < 5 && !photo && !audio) return setError(t('needInput'));
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
    <form onSubmit={onSubmit} className="relative space-y-5">
      <h1 className="text-2xl font-bold">{t('newComplaint')}</h1>

      <div className="space-y-2">
        <Label htmlFor="text">{t('describe')}</Label>
        <Textarea id="text" value={text} onChange={(e) => setText(e.target.value)} placeholder={t('describePlaceholder')} maxLength={4000} />
        <div className="grid grid-cols-2 gap-2">
          <PhotoPicker value={photo} onChange={setPhoto} />
          <VoiceRecorder value={audio} onChange={setAudio} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t('location')}</Label>
        <LocationPicker value={location} onChange={setLocation} address={address} onAddress={onAddress} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">{t('yourName')}</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} autoComplete="name" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">{t('phone')}</Label>
          <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={15} autoComplete="tel" inputMode="tel" />
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={submitting}>
        {submitting ? <Loader2 className="animate-spin" /> : <Sparkles />}
        {submitting ? t('analysing') : t('submit')}
      </Button>

      <AnimatePresence>
        {submitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[900] flex flex-col items-center justify-center gap-4 bg-background/90 p-6 text-center backdrop-blur-sm"
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 1.4 }}
              className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground"
            >
              <Sparkles className="size-7" />
            </motion.div>
            <p className="text-lg font-semibold">{t('analysing')}</p>
            <p className="max-w-xs text-sm text-muted-foreground">{t('analysingSteps')}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
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

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex flex-col items-center gap-2 pt-2 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 15 }}
          className={`flex size-14 items-center justify-center rounded-full ${complaint.isSpam ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}
        >
          {complaint.isSpam ? <ShieldAlert className="size-7" /> : <Check className="size-7" />}
        </motion.div>
        <h1 className="text-xl font-bold">{t('submitted')}</h1>
      </div>

      <Card className="items-center gap-2 p-4 text-center">
        <p className="text-xs text-muted-foreground">{t('saveCode')}</p>
        <div className="flex items-center gap-2">
          <span className="font-mono text-2xl font-bold tracking-wider">{complaint.trackingCode}</span>
          <Button size="icon" variant="ghost" onClick={copy} aria-label={t('copy')}>
            {copied ? <Check /> : <Copy />}
          </Button>
        </div>
      </Card>

      {complaint.isSpam ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{t('spamNotice')}</p>
      ) : (
        <>
          {duplicate && issue && (
            <div className="flex gap-3 rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-900">
              <GitMerge className="mt-0.5 size-4 shrink-0" />
              <p>
                {t('mergedNotice')} <strong>{issue.reportCount} {t('reports')}</strong>
              </p>
            </div>
          )}
          <Card className="p-4">
            <TriageSummary complaint={complaint} issue={issue} />
          </Card>
        </>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Button asChild variant="outline">
          <Link to={`/track/${complaint.trackingCode}`}>{t('viewStatus')}</Link>
        </Button>
        <Button onClick={onAnother}>{t('reportAnother')}</Button>
      </div>
    </motion.div>
  );
}
