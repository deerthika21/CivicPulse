import { Mic, Square, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

const MAX_SECONDS = 60;
const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];

export function VoiceRecorder({ value, onChange }: { value: Blob | null; onChange: (b: Blob | null) => void }) {
  const { t } = useI18n();
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');
  const [url, setUrl] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!value) return setUrl(null);
    const u = URL.createObjectURL(value);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [value]);

  useEffect(() => () => stop(), []); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (recorder.current?.state === 'recording') recorder.current.stop();
    recorder.current = null;
    setRecording(false);
  }

  if (value && url && !recording) {
    return (
      <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-2">
        <audio src={url} controls className="h-9 min-w-0 flex-1" />
        <Button type="button" variant="ghost" size="icon" onClick={() => onChange(null)} aria-label={t('remove')}>
          <Trash2 />
        </Button>
      </div>
    );
  }

  return (
    <div>
      {recording ? (
        <Button type="button" variant="destructive" className="w-full" onClick={stop}>
          <Square className="fill-current" /> {t('stopRecording')} · 0:{String(seconds).padStart(2, '0')} / 1:00
          <span className="ml-1 size-2 animate-pulse rounded-full bg-white" />
        </Button>
      ) : (
        <Button type="button" variant="outline" className="w-full" onClick={start}>
          <Mic /> {t('recordVoice')}
        </Button>
      )}
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}
