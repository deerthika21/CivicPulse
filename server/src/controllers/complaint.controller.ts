import type { Request, Response } from 'express';
import { z } from 'zod';
import { HttpError } from '../middleware/errorHandler.js';
import { Complaint } from '../models/Complaint.js';
import { Issue } from '../models/Issue.js';
import { submitComplaint } from '../services/complaint.service.js';
import { serializeComplaint, serializeIssue } from '../services/serialize.js';
import { isInChennai } from '../utils/geo.js';

const SubmitBody = z.object({
  text: z.string().trim().max(4000).default(''),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  address: z.string().trim().max(300).optional(),
  name: z.string().trim().max(100).optional(),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{0,15}$/, 'Invalid phone number')
    .optional(),
});

type Files = Record<string, Express.Multer.File[] | undefined>;

export async function createComplaint(req: Request, res: Response): Promise<void> {
  const body = SubmitBody.parse(req.body);
  const files = (req.files ?? {}) as Files;
  const photo = files.photo?.[0];
  const audio = files.audio?.[0];

  if (body.text.length < 5 && !photo && !audio) {
    throw new HttpError(400, 'Please describe the problem (at least 5 characters), or attach a photo or voice note');
  }
  if (!isInChennai(body.lat, body.lng)) {
    throw new HttpError(400, 'Location must be within Chennai');
  }

  const result = await submitComplaint({
    ...body,
    photo: photo && { mimeType: photo.mimetype, data: photo.buffer },
    audio: audio && { mimeType: audio.mimetype, data: audio.buffer },
  });

  res.status(201).json({
    complaint: serializeComplaint(result.complaint),
    issue: result.issue ? serializeIssue(result.issue) : null,
    duplicate: result.duplicate
      ? { similarity: result.duplicate.similarity, distanceM: result.duplicate.distanceM, method: result.duplicate.method }
      : null,
  });
}

export async function trackComplaint(req: Request, res: Response): Promise<void> {
  const code = String(req.params.code ?? '').trim().toUpperCase();
  const normalized = code.startsWith('CP-') ? code : `CP-${code}`;
  const complaint = await Complaint.findOne({ trackingCode: normalized }).lean();
  if (!complaint) throw new HttpError(404, 'No complaint found with that tracking code');
  const issue = complaint.issue ? await Issue.findById(complaint.issue).lean() : null;
  res.json({ complaint: serializeComplaint(complaint), issue: issue ? serializeIssue(issue) : null });
}
