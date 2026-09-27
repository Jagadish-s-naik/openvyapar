import { Schema, model, type Model } from 'mongoose';
import type { BusinessRole } from '@openvyapar/shared';

const businessRoleSchema = new Schema<BusinessRole>(
  {
    role_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    business_id: {
      type: String,
      required: true,
      index: true,
    },
    person_id: {
      type: String,
      required: true,
      index: true,
    },
    role_type: {
      type: String,
      enum: ['owner', 'partner', 'successor', 'delegate'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'revoked', 'former'],
      default: 'active',
      required: true,
    },
    granted_at: {
      type: String,
      required: true,
    },
    revoked_at: {
      type: String,
      default: null,
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

businessRoleSchema.index({ business_id: 1, status: 1 });
businessRoleSchema.index({ person_id: 1, status: 1 });

export const BusinessRoleModel: Model<BusinessRole> = model<BusinessRole>(
  'BusinessRole',
  businessRoleSchema
);
