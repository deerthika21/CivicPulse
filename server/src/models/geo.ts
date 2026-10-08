import { Schema } from 'mongoose';

/** GeoJSON Point, coordinates are [lng, lat]. */
export const pointSchema = new Schema(
  {
    type: { type: String, enum: ['Point'], required: true, default: 'Point' },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: (v: number[]) => v.length === 2 && Math.abs(v[0]) <= 180 && Math.abs(v[1]) <= 90,
        message: 'coordinates must be [lng, lat]',
      },
    },
  },
  { _id: false },
);
