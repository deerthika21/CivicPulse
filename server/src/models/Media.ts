import { Schema, model } from 'mongoose';

/**
 * Uploaded photos / voice notes. Stored in Mongo (not disk) because Render's
 * filesystem is ephemeral; uploads are capped well under the 16 MB doc limit.
 */
const mediaSchema = new Schema(
  {
    kind: { type: String, enum: ['photo', 'audio'], required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true, select: false },
  },
  { timestamps: true },
);

export const Media = model('Media', mediaSchema);
