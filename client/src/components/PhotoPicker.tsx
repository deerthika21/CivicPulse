import { Camera, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { compressImage } from '@/lib/image';
import { useI18n } from '@/lib/i18n';

const MAX_BYTES = 8 * 1024 * 1024;

export function PhotoPicker({ value, onChange }: { value: File | null; onChange: (f: File | null) => void }) {
  const { t } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');

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
        <div className="relative overflow-hidden rounded-lg border">
          <img src={preview} alt="Selected" className="max-h-56 w-full object-cover" />
          <div className="absolute right-2 top-2 flex gap-1">
            <Button type="button" size="sm" variant="secondary" onClick={() => input.current?.click()}>
              {t('changePhoto')}
            </Button>
            <Button type="button" size="icon" variant="secondary" onClick={() => onChange(null)} aria-label={t('remove')}>
              <Trash2 />
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" className="w-full" onClick={() => input.current?.click()}>
          <Camera /> {t('addPhoto')}
        </Button>
      )}
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}
