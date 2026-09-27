import { Schema, model, type Model } from 'mongoose';
import type { Person } from '@openvyapar/shared';

const personSchema = new Schema<Person>(
  {
    person_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    contact: {
      phone: { type: String, required: true },
      email: { type: String },
    },
    auth_ref: {
      type: String,
      required: true,
    },
  },
  {
    versionKey: false,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret._id;
        return ret;
      },
    },
    toObject: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret._id;
        return ret;
      },
    },
  }
);

export const PersonModel: Model<Person> = model<Person>('Person', personSchema);
