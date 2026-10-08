import cron from 'node-cron';
import { generateWeeklyInsight } from '../services/insight.service.js';
import { refreshSlaStates } from '../services/sla.service.js';
import { dbState } from '../config/db.js';

/** Background jobs: SLA monitor every 5 min, AI weekly insights Monday 08:00 IST. */
export function startScheduler(): void {
  cron.schedule('*/5 * * * *', async () => {
    if (dbState() !== 'connected') return;
    try {
      const r = await refreshSlaStates();
      if (r.updated) console.log(`[sla] updated ${r.updated} issues, ${r.newlyBreached} newly breached`);
    } catch (err) {
      console.error('[sla] refresh failed', err);
    }
  });

  cron.schedule(
    '0 8 * * 1',
    async () => {
      if (dbState() !== 'connected') return;
      try {
        const insight = await generateWeeklyInsight();
        console.log(`[insights] weekly insight generated (${insight.aiModel})`);
      } catch (err) {
        console.error('[insights] generation failed', err);
      }
    },
    { timezone: 'Asia/Kolkata' },
  );
}
