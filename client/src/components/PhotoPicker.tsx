import { Camera, ImagePlus, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState, type DragEvent } from 'react';
import { Button } from '@/components/ui/button';
import { compressImage } from '@/lib/image';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const MAX_BYTES = 8 * 1024 * 1024;

export function PhotoPicker({ value, onChange }: { value: File | null; onChange: (f: File | null) => void }) {
  const { t } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!value) return setPreview(null);
    const u = URL.createObjectURL(value);
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [value]);

  const pick = async (file?: File) => {
    setError('');
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('Please choose an image');
    const compressed = await compressImage(file);
    if (compressed.size > MAX_BYTES) return setError('Photo is too large (max 8 MB)');
    onChange(compressed);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    void pick(e.dataTransfer.files?.[0]);
  };

  return (
    <div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          void pick(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {preview ? (
        <div className="group relative overflow-hidden rounded-2xl border border-border shadow-soft">
          <img src={preview} alt="Selected" className="h-52 w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent" />
          <div className="absolute bottom-3 right-3 flex gap-2">
            <Button type="button" size="sm" variant="glass" onClick={() => input.current?.click()}>
              <RefreshCw /> {t('changePhoto')}
            </Button>
            <Button type="button" size="icon-sm" variant="glass" onClick={() => onChange(null)} aria-label={t('remove')}>
              <Trash2 />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            'flex w-full items-center gap-4 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-4 text-left transition-all duration-150 hover:border-brand-500/60 hover:bg-brand-50/50 active:scale-[0.99]',
            dragging && 'border-brand-500 bg-brand-50',
          )}
        >
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-soft ring-1 ring-border">
            {dragging ? <ImagePlus className="size-5" /> : <Camera className="size-5" />}
          </span>
          <span>
            <span className="block text-sm font-semibold text-foreground">{t('dropPhoto')}</span>
            <span className="block text-xs text-subtle">{t('dropPhotoHint')}</span>
          </span>
        </button>
      )}
      {error && <p className="mt-1.5 text-xs font-medium text-red-700">{error}</p>}
    </div>
  );
}
