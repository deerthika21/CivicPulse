import multer from 'multer';
import { HttpError } from './errorHandler.js';

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const PHOTO_TYPES = /^image\/(jpeg|png|webp|heic|heif)$/;
const AUDIO_TYPES = /^audio\/(webm|ogg|mpeg|mp3|mp4|aac|wav|x-wav|x-m4a|m4a|flac)(;.*)?$/;

export const complaintUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES, files: 2, fields: 10 },
  fileFilter: (_req, file, cb) => {
    const ok = file.fieldname === 'photo' ? PHOTO_TYPES.test(file.mimetype) : file.fieldname === 'audio' ? AUDIO_TYPES.test(file.mimetype) : false;
    if (ok) cb(null, true);
    else cb(new HttpError(400, `Unsupported ${file.fieldname} type: ${file.mimetype}`));
  },
}).fields([
  { name: 'photo', maxCount: 1 },
  { name: 'audio', maxCount: 1 },
]);
