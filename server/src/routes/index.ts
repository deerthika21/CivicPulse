import { Router } from 'express';
import { analytics, getLatestInsight, regenerateInsight } from '../controllers/admin.controller.js';
import { login, me } from '../controllers/auth.controller.js';
import { createComplaint, trackComplaint } from '../controllers/complaint.controller.js';
import * as issues from '../controllers/issue.controller.js';
import { getMedia } from '../controllers/media.controller.js';
import { getMeta, getPublicStats } from '../controllers/meta.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { aiLimiter, loginLimiter, submitLimiter } from '../middleware/rateLimit.js';
import { complaintUpload } from '../middleware/upload.js';
import { healthRouter } from './health.routes.js';

export const apiRouter = Router();

// --- public ---
apiRouter.use('/health', healthRouter);
apiRouter.get('/meta', getMeta);
apiRouter.get('/public/stats', getPublicStats);
apiRouter.post('/complaints', submitLimiter, complaintUpload, createComplaint);
apiRouter.get('/complaints/track/:code', trackComplaint);
apiRouter.get('/media/:id', getMedia);

// --- auth ---
apiRouter.post('/auth/login', loginLimiter, login);
apiRouter.get('/auth/me', requireAuth, me);

// --- officers & admins ---
const issuesRouter = Router();
issuesRouter.get('/', issues.list);
issuesRouter.get('/summary', issues.summary);
issuesRouter.get('/:id', issues.detail);
issuesRouter.patch('/:id', issues.update);
apiRouter.use('/issues', requireAuth, requireRole('officer', 'admin'), issuesRouter);

// --- admins ---
const adminOnly = [requireAuth, requireRole('admin')];
apiRouter.get('/analytics', ...adminOnly, analytics);
apiRouter.get('/insights/latest', ...adminOnly, getLatestInsight);
apiRouter.post('/insights/generate', ...adminOnly, aiLimiter, regenerateInsight);
