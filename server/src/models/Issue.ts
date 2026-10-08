import { Schema, Types, model, type HydratedDocument, type InferSchemaType } from 'mongoose';
import { CATEGORIES, DEPARTMENTS, ISSUE_STATUSES, SLA_STATES } from '../constants/taxonomy.js';
import { pointSchema } from './geo.js';

const overrideSchema = new Schema(
  {
    field: { type: String, enum: ['category', 'department', 'priority'], required: true },
    from: { type: Schema.Types.Mixed },
    to: { type: Schema.Types.Mixed },
    reason: { type: String, required: true },
    by: { type: Types.ObjectId, ref: 'User' },
    byName: { type: String, default: '' },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const timelineSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['created', 'duplicate_merged', 'status_changed', 'override', 'note', 'sla_breached', 'priority_escalated'],
      required: true,
    },
    message: { type: String, required: true },
    byName: { type: String, default: 'System' },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

/** A real-world problem. Duplicate complaints merge into one Issue (reportCount). */
const issueSchema = new Schema(
  {
    category: { type: String, enum: CATEGORIES, required: true },
    department: { type: String, enum: DEPARTMENTS, required: true },
    priority: { type: Number, min: 1, max: 5, required: true },
    priorityReason: { type: String, default: '' },
    summary: { type: String, default: '' },
    locationHint: { type: String, default: '' },
    location: { type: pointSchema, required: true },
    status: { type: String, enum: ISSUE_STATUSES, default: 'open' },
    reportCount: { type: Number, default: 1 },
    complaints: [{ type: Types.ObjectId, ref: 'Complaint' }],
    confidence: { type: Number, default: 0 },
    aiFallback: { type: Boolean, default: false },

    slaHours: { type: Number, required: true },
    slaDueAt: { type: Date, required: true },
    slaState: { type: String, enum: SLA_STATES, default: 'on_track' },
    resolvedAt: { type: Date },
    resolutionNote: { type: String, default: '' },

    lockedFields: [{ type: String }], // fields an officer overrode; AI merges won't change them
    overrides: [overrideSchema],
    timeline: [timelineSchema],

    // Embedding of the first complaint; used for duplicate search (Atlas Vector Search index on this path).
    embedding: { type: [Number], select: false },
    embeddingModel: { type: String, default: '' },
    lastReportedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

issueSchema.index({ location: '2dsphere' });
issueSchema.index({ department: 1, status: 1, priority: -1 });
issueSchema.index({ category: 1, status: 1 });
issueSchema.index({ slaDueAt: 1 });

export type IssueAttrs = InferSchemaType<typeof issueSchema>;
export type IssueDoc = HydratedDocument<IssueAttrs>;
export const Issue = model('Issue', issueSchema);
