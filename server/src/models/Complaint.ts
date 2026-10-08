import { Schema, Types, model, type HydratedDocument, type InferSchemaType } from 'mongoose';
import { CATEGORIES, DEPARTMENTS, LANGUAGES, SENTIMENTS } from '../constants/taxonomy.js';
import { pointSchema } from './geo.js';

/** One citizen report. Several complaints can point at the same Issue (duplicates). */
const complaintSchema = new Schema(
  {
    trackingCode: { type: String, required: true, unique: true },
    text: { type: String, default: '' },
    photo: { type: Types.ObjectId, ref: 'Media' },
    audio: { type: Types.ObjectId, ref: 'Media' },
    location: { type: pointSchema, required: true },
    address: { type: String, default: '' },
    citizen: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
    },

    // --- AI triage ---
    language: { type: String, enum: LANGUAGES, default: 'Other' },
    transcript: { type: String, default: '' },
    translation: { type: String, default: '' },
    category: { type: String, enum: CATEGORIES, required: true },
    department: { type: String, enum: DEPARTMENTS, required: true },
    priority: { type: Number, min: 1, max: 5, required: true },
    priorityReason: { type: String, default: '' },
    summary: { type: String, default: '' },
    locationHint: { type: String, default: '' },
    sentiment: { type: String, enum: SENTIMENTS, default: 'neutral' },
    isSpam: { type: Boolean, default: false },
    spamReason: { type: String, default: '' },
    slaHours: { type: Number, required: true },
    confidence: { type: Number, min: 0, max: 1, default: 0 },
    aiModel: { type: String, default: '' },
    aiFallback: { type: Boolean, default: false },
    aiLatencyMs: { type: Number, default: 0 },

    // --- duplicates ---
    embedding: { type: [Number], select: false },
    embeddingModel: { type: String, default: '' },
    issue: { type: Types.ObjectId, ref: 'Issue', index: true },
    mergedAsDuplicate: { type: Boolean, default: false },
    duplicateSimilarity: { type: Number },
    duplicateDistanceM: { type: Number },
    duplicateMethod: { type: String, enum: ['vector_search', 'cosine_fallback', null], default: null },
  },
  { timestamps: true },
);

complaintSchema.index({ location: '2dsphere' });
complaintSchema.index({ createdAt: -1 });

export type ComplaintAttrs = InferSchemaType<typeof complaintSchema>;
export type ComplaintDoc = HydratedDocument<ComplaintAttrs>;
export const Complaint = model('Complaint', complaintSchema);
