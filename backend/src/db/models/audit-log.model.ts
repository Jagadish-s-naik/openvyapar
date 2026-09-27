import { Schema, model, type Model } from 'mongoose';
import type { AuditLog } from '@openvyapar/shared';

const auditLogSchema = new Schema<AuditLog>(
  {
    log_id: {
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
    actor_type: {
      type: String,
      enum: ['owner', 'delegate', 'agent_suggestion', 'issuer', 'field_agent', 'admin'],
      required: true,
    },
    actor_id: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    confirmed_by_human: {
      type: Boolean,
      required: true,
    },
    timestamp: {
      type: String,
      required: true,
      index: true,
    },
    ip_address: {
      type: String,
      default: undefined,
    },
    origin: {
      type: String,
      default: undefined,
    },
    actor_role: {
      type: String,
      default: undefined,
    },
    diff: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
    metadata: {
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

auditLogSchema.index({ business_id: 1, timestamp: -1 });

export const AuditLogModel: Model<AuditLog> = model<AuditLog>(
  'AuditLog',
  auditLogSchema
);
