import { Schema, model, type Model } from 'mongoose';
import type { Credential } from '@openvyapar/shared';

const credentialSchema = new Schema<Credential>(
  {
    credential_id: {
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
    issuer: {
      type: String,
      enum: ['gst_mock', 'bank_mock', 'marketplace_mock', 'agent_witnessed'],
      required: true,
    },
    type: {
      type: String,
      enum: [
        'gst_compliant',
        'filing_history',
        'income_bracket',
        'order_history',
        'self_attested',
      ],
      required: true,
    },
    claim: {
      type: Schema.Types.Mixed,
      required: true,
    },
    issued_at: {
      type: String,
      required: true,
    },
    expires_at: {
      type: String,
      default: null,
    },
    signature: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['valid', 'revoked'],
      default: 'valid',
      required: true,
    },
    redacted_fields: {
      type: [String],
      default: undefined,
    },
    attribute_hashes: {
      type: Schema.Types.Mixed,
      default: undefined,
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

credentialSchema.index({ business_id: 1, status: 1 });
credentialSchema.index({ business_id: 1, issuer: 1, type: 1 });

export const CredentialModel: Model<Credential> = model<Credential>(
  'Credential',
  credentialSchema
);
