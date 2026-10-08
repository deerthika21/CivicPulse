import type { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { HttpError } from '../middleware/errorHandler.js';
import { Media } from '../models/Media.js';

export async function getMedia(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  if (!isValidObjectId(id)) throw new HttpError(404, 'Media not found');
  // Not lean(): a hydrated doc gives a real Buffer (lean returns a BSON Binary).
  const media = await Media.findById(id).select('+data');
  if (!media) throw new HttpError(404, 'Media not found');
  res.writeHead(200, {
    'Content-Type': media.mimeType,
    'Content-Length': media.data.length,
    'Cache-Control': 'public, max-age=86400, immutable',
  });
  res.end(media.data);
}
