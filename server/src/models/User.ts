import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import { DEPARTMENTS, ROLES } from '../constants/taxonomy.js';

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true, default: 'officer' },
    department: { type: String, enum: DEPARTMENTS },
  },
  { timestamps: true },
);

export type UserAttrs = InferSchemaType<typeof userSchema>;
export type UserDoc = HydratedDocument<UserAttrs>;
export const User = model('User', userSchema);
