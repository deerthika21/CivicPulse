# CivicPulse — Phased plan

Status legend: ✅ done · ⏳ next · ⬜ todo — all phases complete (2026-10-08). Remaining: user fills secrets, deploys, records demo.

## ✅ Phase 1 — Scaffold
- Monorepo with `/client` (Vite React TS, Tailwind v4, shadcn setup, router, leaflet, recharts, framer-motion) and `/server` (Express 5 TS, Mongoose, genai, zod, multer, jwt, node-cron).
- `GET /api/health` (uptime, Mongo state, Gemini configured).
- Mongoose connection with retry; server boots even if Mongo is down (health reports it).
- Placeholder client routes: `/`, `/report`, `/track/:id`, `/officer`, `/officer/issue/:id`, `/admin/analytics`.
- Root `npm run dev` runs both via concurrently.

## ✅ Phase 2 — Models
- `Complaint`: citizen text/media refs, original language, AI triage block (all fields + `aiRaw`, `aiFallback` flag), `embedding: number[]`, `location: GeoJSON Point` (2dsphere), `issueId`, tracking code (short, human-friendly), status history.
- `Issue`: canonical merged problem — category, department, priority, summary, location, `reportCount`, `complaintIds`, status (`open|in_progress|resolved|rejected`), `slaDueAt`, `overrides[]` (officer, field, from, to, reason, at), embedding centroid.
- `User`: officer/admin, department, bcrypt hash, role.
- `Insight`: weekly AI insight docs.
- Shared constants: categories ↔ departments map, priority rubric, SLA defaults per priority.

## ✅ Phase 3 — Gemini service
- `services/gemini.ts`: single client, model names from env.
- `triageComplaint({ text, imageBase64?, audioBase64?, mimeTypes })` → structured output via `responseSchema`; zod validation; retry once; fallback (`Other`, P3, `aiFallback: true`).
- `embed(text)` using embedding model (embed the English translation + summary).
- Department derived from category in code (don't trust AI for the mapping).
- Prompt includes priority rubric, Chennai context, Tanglish examples.

## ✅ Phase 4 — Complaint pipeline + duplicates
- `POST /api/complaints` (multer: photo + voice, size/type limits) → triage → embed → duplicate search → create/merge Issue → return tracking code.
- Duplicate search: Atlas `$vectorSearch` (filter category) + `$geoNear`/distance check ≤ 300 m, similarity > 0.85; fallback: `$near` within 300 m + same category, cosine in code.
- `GET /api/complaints/:code` for citizen tracking (status timeline).
- Spam-flagged complaints stored but not surfaced in queues.

## ✅ Phase 5 — Officer/admin APIs + auth
- `POST /api/auth/login` (JWT), `requireAuth`, `requireRole` middleware.
- Officer: `GET /api/issues?department&status&priority&bbox`, `GET /api/issues/:id`, `PATCH /api/issues/:id` (status, override category/priority/department with reason → audit log).
- SLA: node-cron job every 15 min flags breaching/breached issues.
- Admin: `GET /api/analytics` (by category, dept, priority, SLA compliance, trend), `GET /api/insights/latest`, weekly cron + manual trigger to generate Gemini insights.

## ✅ Phase 6 — Frontend
- Citizen (mobile-first, EN/தமிழ் toggle): report form (text, photo, voice recorder, map pin / geolocation), result card with AI triage, tracking page with timeline.
- Officer (desktop): department queue table + leaflet map, SLA badges, issue detail with complaints list, override dialog.
- Admin: Recharts dashboards + weekly insights card.
- Loading skeletons, empty states, error boundaries/toasts everywhere.

## ✅ Phase 7 — Seed data
- Script: departments' officer accounts + admin, ~60 realistic Chennai complaints across languages/areas (some deliberate duplicates), run through the real pipeline (or cached triage when no key).

## ✅ Phase 8 — Render deploy
- `render.yaml`: server Web Service (`rootDir: server`, build `npm ci && npm run build`, start `npm start`, health check `/api/health`), client Static Site (`rootDir: client`, SPA rewrite `/* → /index.html`, `VITE_API_BASE_URL`).
- Atlas network access, CORS `CLIENT_ORIGIN`, Vector Search index JSON in repo.

## ✅ Phase 9 — Polish + README
- README with architecture diagram, demo script, screenshots, env table, Vector Search index setup.
- Animations, empty-state illustrations, accessibility pass, demo-day data reset script.

## Notes from the build
- Tested: 32-check API smoke test against in-memory Mongo (submit, media, duplicate merge, 3-language cluster, community escalation, auth scoping, overrides, analytics, insights) + Playwright screenshots of every page.
- Not tested: real Gemini calls (no key in dev). Fallback path is tested; the live path needs `GEMINI_API_KEY`.
- Map tiles: OpenStreetMap standard tiles (CARTO now needs an API key).
- Render: NODE_VERSION 22 (Node 20 is EOL as of Apr 2026; code still runs on 20).
