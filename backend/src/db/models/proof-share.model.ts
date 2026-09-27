import { Schema, model, type Model } from 'mongoose';
import type { ProofShare } from '@openvyapar/shared';

const proofShareSchema = new Schema<ProofShare>(
  {
    proof_id: {
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
    purpose: {
      type: String,
      required: true,
    },
    disclosed_credential_ids: {
      type: [String],
      required: true,
    },
    disclosed_credentials: {
      type: [Schema.Types.Mixed],
      default: undefined,
    },
    shared_with: {
      type: String,
      required: true,
    },
    generated_at: {
      type: String,
      required: true,
    },
    link_or_qr: {
      type: String,
      required: true,
    },
    verification_status: {
      type: String,
      enum: ['valid', 'tampered', 'expired', 'max_uses_exceeded'],
      default: 'valid',
      required: true,
    },
    expires_at: {
      type: String,
      default: null,
    },
    max_uses: {
      type: Number,
      default: null,
    },
    use_count: {
      type: Number,
      default: 0,
    },
    disclosed_attributes: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
    redaction_manifest: {
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

export const ProofShareModel: Model<ProofShare> = model<ProofShare>(
  'ProofShare',
  proofShareSchema
);
