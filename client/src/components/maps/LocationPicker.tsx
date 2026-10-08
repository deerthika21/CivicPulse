import L from 'leaflet';
import { Crosshair, Loader2, MapPin } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { TILE_ATTRIBUTION, TILE_URL } from '@/lib/constants';
import { useI18n } from '@/lib/i18n';
import type { LatLng } from '@/lib/types';

const pinIcon = L.divIcon({
  className: '',
  html: `<svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg"><path d="M17 43s15-14.3 15-26A15 15 0 0 0 2 17c0 11.7 15 26 15 26z" fill="#0f766e" stroke="#fff" stroke-width="2.5"/><circle cx="17" cy="17" r="5.5" fill="#fff"/></svg>`,
  iconSize: [34, 44],
  iconAnchor: [17, 43],
});

function ClickToMove({ onPick }: { onPick: (p: LatLng) => void }) {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

function FlyTo({ target }: { target: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], 17, { duration: 0.8 });
  }, [map, target]);
  return null;
}

/** Best-effort reverse geocode via OpenStreetMap Nominatim (no key; failures ignored). */
async function reverseGeocode(p: LatLng, signal: AbortSignal): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=17&addressdetails=1&lat=${p.lat}&lon=${p.lng}`;
  const res = await fetch(url, { signal, headers: { 'Accept-Language': 'en' } });
  const j = await res.json();
  const a = j.address ?? {};
  const parts = [a.road ?? a.pedestrian, a.neighbourhood ?? a.suburb, a.city_district ?? a.suburb ?? a.city].filter(Boolean);
  return [...new Set(parts)].join(', ') || j.display_name?.split(',').slice(0, 3).join(',') || '';
}

interface Props {
  value: LatLng;
  onChange: (p: LatLng) => void;
  address: string;
  onAddress: (a: string) => void;
}

export function LocationPicker({ value, onChange, address, onAddress }: Props) {
  const { t } = useI18n();
  const [flyTarget, setFlyTarget] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState('');
  const markerRef = useRef<L.Marker>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      reverseGeocode(value, ctrl.signal).then(onAddress).catch(() => undefined);
    }, 600);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [value, onAddress]);

  const handlers = useMemo(
    () => ({
      dragend() {
        const m = markerRef.current;
        if (m) onChange({ lat: m.getLatLng().lat, lng: m.getLatLng().lng });
      },
    }),
    [onChange],
  );

  const locate = () => {
    if (!navigator.geolocation) return setGeoError('Location is not available in this browser');
    setLocating(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        onChange(p);
        setFlyTarget(p);
        setLocating(false);
      },
      (err) => {
        setGeoError(err.code === err.PERMISSION_DENIED ? 'Location permission denied — tap the map instead' : 'Could not get your location');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  return (
    <div className="space-y-2">
      <div className="relative h-64 overflow-hidden rounded-lg border">
        <MapContainer center={[value.lat, value.lng]} zoom={13} className="h-full w-full" scrollWheelZoom={false}>
          <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
          <Marker position={[value.lat, value.lng]} draggable eventHandlers={handlers} ref={markerRef} icon={pinIcon} />
          <ClickToMove onPick={onChange} />
          <FlyTo target={flyTarget} />
        </MapContainer>
        <Button type="button" size="sm" variant="secondary" className="absolute right-2 top-2 z-[500] shadow" onClick={locate} disabled={locating}>
          {locating ? <Loader2 className="animate-spin" /> : <Crosshair />}
          {locating ? t('locating') : t('useMyLocation')}
        </Button>
      </div>
      <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
        <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
        <span>{address || t('locationHelp')}</span>
      </p>
      {geoError && <p className="text-xs text-red-700">{geoError}</p>}
    </div>
  );
}
