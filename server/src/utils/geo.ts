const EARTH_RADIUS_M = 6_378_100;

/** Great-circle distance in metres between two [lng, lat] points. */
export function haversineMeters([lng1, lat1]: number[], [lng2, lat2]: number[]): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

export function radiusToRadians(meters: number): number {
  return meters / EARTH_RADIUS_M;
}

/** Loose bounding box around Greater Chennai (incl. suburbs). */
export const CHENNAI_BOUNDS = { minLat: 12.75, maxLat: 13.35, minLng: 79.95, maxLng: 80.4 };

export function isInChennai(lat: number, lng: number): boolean {
  const b = CHENNAI_BOUNDS;
  return lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng;
}
