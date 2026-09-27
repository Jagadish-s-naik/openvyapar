import { Schema, model, type Model } from 'mongoose';
import type { DelegationToken } from '@openvyapar/shared';

const delegationTokenSchema = new Schema<DelegationToken>(
  {
    token_id: {
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
    delegate_person_id: {
      type: String,
      required: true,
      index: true,
    },
    scopes: {
      type: [String],
      required: true,
      default: [],
    },
    granted_by: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'revoked'],
      default: 'active',
      required: true,
    },
    created_at: {
      type: String,
      required: true,
    },
    expires_at: {
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

delegationTokenSchema.index({ business_id: 1, delegate_person_id: 1, status: 1 });

export const DelegationTokenModel: Model<DelegationToken> = model<DelegationToken>(
  'DelegationToken',
  delegationTokenSchema
);
