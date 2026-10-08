import { useEffect } from 'react';
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from 'react-leaflet';
import { CHENNAI_CENTER, PRIORITY_META, TILE_ATTRIBUTION, TILE_URL } from '@/lib/constants';
import { cn } from '@/lib/utils';

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  priority: number;
  reportCount: number;
  summary: string;
  category?: string;
  muted?: boolean;
}

function FitBounds({ points, selectedId }: { points: MapPoint[]; selectedId?: string }) {
  const map = useMap();
  const key = points.map((p) => p.id).join(',');
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) map.setView([points[0].lat, points[0].lng], 15);
    else map.fitBounds(points.map((p) => [p.lat, p.lng] as [number, number]), { padding: [30, 30], maxZoom: 15 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  useEffect(() => {
    const p = points.find((x) => x.id === selectedId);
    if (p) map.panTo([p.lat, p.lng]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, selectedId]);
  return null;
}

/** Issues as circles: colour = priority (status palette), size = report count. */
export function IssuesMap({
  points,
  selectedId,
  onSelect,
  className,
}: {
  points: MapPoint[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn('relative isolate overflow-hidden rounded-2xl border border-border bg-card shadow-soft', className)}>
      <MapContainer center={CHENNAI_CENTER} zoom={12} className="h-full w-full">
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        {[...points]
          .sort((a, b) => a.priority - b.priority) // high priority drawn on top
          .map((p) => {
            const selected = p.id === selectedId;
            return (
              <CircleMarker
                key={p.id}
                center={[p.lat, p.lng]}
                radius={Math.min(7 + (p.reportCount - 1) * 2.5, 18) + (selected ? 3 : 0)}
                pathOptions={{
                  color: '#ffffff',
                  weight: 2,
                  fillColor: PRIORITY_META[p.priority]?.color ?? '#888',
                  fillOpacity: p.muted ? 0.35 : 0.9,
                }}
                eventHandlers={{ click: () => onSelect?.(p.id) }}
              >
                <Tooltip direction="top" offset={[0, -6]}>
                  <div className="max-w-56 whitespace-normal text-xs">
                    <strong>P{p.priority}</strong>
                    {p.reportCount > 1 && ` · ${p.reportCount} reports`}
                    <br />
                    {p.summary}
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          })}
        <FitBounds points={points} selectedId={selectedId} />
      </MapContainer>
      <div className="pointer-events-none absolute bottom-3 left-3 z-[500] flex items-center gap-2.5 rounded-xl border border-border bg-card/95 px-3 py-1.5 text-[0.6875rem] font-semibold text-slate-600 shadow-lift backdrop-blur">
        {[5, 4, 3, 2, 1].map((p) => (
          <span key={p} className="flex items-center gap-1">
            <span className="size-2.5 rounded-full ring-2 ring-card" style={{ background: PRIORITY_META[p].color }} />P{p}
          </span>
        ))}
      </div>
    </div>
  );
}
