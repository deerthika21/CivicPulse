import { Mic, Square, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

const MAX_SECONDS = 60;
const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
const BARS = 28;

export function VoiceRecorder({ value, onChange }: { value: Blob | null; onChange: (b: Blob | null) => void }) {
  const { t } = useI18n();
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');
  const [url, setUrl] = useState<string | null>(null);
  const [levels, setLevels] = useState<number[]>(() => Array(BARS).fill(0.15));
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const raf = useRef<number | undefined>(undefined);
  const audioCtx = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!value) return setUrl(null);
    const u = URL.createObjectURL(value);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [value]);

  useEffect(() => () => stop(), []); // eslint-disable-line react-hooks/exhaustive-deps

  /** Live waveform from the mic level (visual only). */
  const startMeter = (stream: MediaStream) => {
    try {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      ctx.createMediaStreamSource(stream).connect(analyser);
      audioCtx.current = ctx;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        setLevels(Array.from({ length: BARS }, (_, i) => Math.max(0.12, (data[i % data.length] ?? 0) / 255)));
        raf.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      /* meter is optional */
    }
  };

  const start = async () => {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Voice recording is not supported in this browser');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m));
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks: BlobPart[] = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        onChange(new Blob(chunks, { type: rec.mimeType || 'audio/webm' }));
      };
      rec.start();
      recorder.current = rec;
      setRecording(true);
      setSeconds(0);
      startMeter(stream);
      timer.current = window.setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_SECONDS) stop();
          return s + 1;
        });
      }, 1000);
    } catch {
      setError('Microphone permission denied');
    }
  };

  function stop() {
    window.clearInterval(timer.current);
    if (raf.current) cancelAnimationFrame(raf.current);
    void audioCtx.current?.close().catch(() => undefined);
    audioCtx.current = null;
    if (recorder.current?.state === 'recording') recorder.current.stop();
    recorder.current = null;
    setRecording(false);
  }

  if (value && url && !recording) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-2 pl-3 shadow-soft">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
          <Mic className="size-4" />
        </span>
        <audio src={url} controls className="h-10 min-w-0 flex-1" />
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => onChange(null)} aria-label={t('remove')}>
          <Trash2 />
        </Button>
      </div>
    );
  }

  if (recording) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4">
        <div className="flex items-center gap-3">
          <span className="relative flex size-12 shrink-0 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-red-400/40" />
            <span className="relative flex size-12 items-center justify-center rounded-full bg-red-600 text-white shadow-lg">
              <Mic className="size-5" />
            </span>
          </span>
          <div className="flex h-10 flex-1 items-center gap-[3px]" aria-hidden>
            {levels.map((l, i) => (
              <span key={i} className="w-full rounded-full bg-red-500/80 transition-[height] duration-75" style={{ height: `${Math.round(l * 100)}%` }} />
            ))}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-red-800">
            {t('recording')} <span className="tabular-nums">0:{String(seconds).padStart(2, '0')}</span> <span className="font-normal text-red-700/70">/ 1:00</span>
          </span>
          <Button type="button" variant="destructive" size="sm" onClick={stop}>
            <Square className="fill-current" /> {t('stopRecording')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={start}
        className="flex w-full items-center gap-4 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-4 text-left transition-all duration-150 hover:border-teal-500/60 hover:bg-teal-50/50 active:scale-[0.99]"
      >
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white text-teal-700 shadow-soft ring-1 ring-border">
          <Mic className="size-5" />
        </span>
        <span>
          <span className="block text-sm font-semibold text-foreground">{t('recordVoice')}</span>
          <span className="block text-xs text-subtle">{t('voiceHint')}</span>
        </span>
      </button>
      {error && <p className="mt-1.5 text-xs font-medium text-red-700">{error}</p>}
    </div>
  );
}
