import { Schema, model, type Model } from 'mongoose';
import type { Business } from '@openvyapar/shared';

const businessSchema = new Schema<Business>(
  {
    business_id: {
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
    status: {
      type: String,
      enum: ['active', 'frozen', 'closed'],
      default: 'active',
      required: true,
    },
    created_at: {
      type: String,
      required: true,
    },
    primary_language: {
      type: String,
      default: 'hi',
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
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

export const BusinessModel: Model<Business> = model<Business>('Business', businessSchema);
