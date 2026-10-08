import { Schema, model, type InferSchemaType } from 'mongoose';

/** AI-generated weekly summary for admins. */
const insightSchema = new Schema(
  {
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    headline: { type: String, required: true },
    highlights: [
      {
        _id: false,
        title: { type: String, required: true },
        detail: { type: String, required: true },
        severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
      },
    ],
    hotspots: [{ _id: false, area: String, category: String, count: Number }],
    recommendations: [{ type: String }],
    stats: { type: Schema.Types.Mixed },
    aiModel: { type: String, default: '' },
    aiFallback: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type InsightAttrs = InferSchemaType<typeof insightSchema>;
export const Insight = model('Insight', insightSchema);
