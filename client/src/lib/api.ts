import type {
  Analytics,
  AuthUser,
  Insight,
  IssueDetail,
  IssueList,
  Meta,
  PublicStats,
  QueueSummary,
  SubmitResponse,
  TrackResponse,
} from './types';

export const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
export const TOKEN_KEY = 'cp_token';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

/** Server returns media as /api/media/:id; prefix with the API host in production. */
export const mediaUrl = (path: string | null) => (path ? `${API_BASE}${path}` : null);

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isForm = init.body instanceof FormData;
  let token: string | null = null;
  try {
    token = localStorage.getItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api${path}`, {
      ...init,
      headers: {
        ...(isForm ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.');
  }

  const body = res.headers.get('content-type')?.includes('application/json') ? await res.json() : null;
  if (!res.ok) {
    if (res.status === 401 && token && !path.startsWith('/auth/login')) window.dispatchEvent(new Event('cp:unauthorized'));
    throw new ApiError(res.status, body?.error ?? res.statusText, body?.details);
  }
  return body as T;
}

const qs = (params: Record<string, string | number | undefined>) => {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') s.set(k, String(v));
  const str = s.toString();
  return str ? `?${str}` : '';
};

export interface HealthResponse {
  status: 'ok';
  env: string;
  uptimeSeconds: number;
  database: 'connected' | 'connecting' | 'disconnected' | 'disconnecting' | 'unknown';
  gemini: { configured: boolean; model: string; embeddingModel: string };
}

export const getHealth = () => api<HealthResponse>('/health');
export const getMeta = () => api<Meta>('/meta');
export const getPublicStats = () => api<PublicStats>('/public/stats');
export const submitComplaint = (form: FormData) => api<SubmitResponse>('/complaints', { method: 'POST', body: form });
export const trackComplaint = (code: string) => api<TrackResponse>(`/complaints/track/${encodeURIComponent(code)}`);

export const login = (email: string, password: string) =>
  api<{ token: string; user: AuthUser }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export type IssueFilters = {
  status?: string;
  department?: string;
  category?: string;
  priority?: string;
  sla?: string;
  q?: string;
  sort?: string;
  limit?: number;
};
export const listIssues = (f: IssueFilters) => api<IssueList>(`/issues${qs(f)}`);
export const getQueueSummary = (department?: string) => api<QueueSummary>(`/issues/summary${qs({ department })}`);
export const getIssue = (id: string) => api<IssueDetail>(`/issues/${id}`);
export const updateIssue = (id: string, body: Record<string, unknown>) =>
  api<IssueDetail>(`/issues/${id}`, { method: 'PATCH', body: JSON.stringify(body) });

export const getAnalytics = (days: number) => api<Analytics>(`/analytics?days=${days}`);
export const getLatestInsight = () => api<{ insight: Insight | null }>('/insights/latest');
export const generateInsight = () => api<{ insight: Insight }>('/insights/generate', { method: 'POST' });
