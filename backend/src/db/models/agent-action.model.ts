import { Schema, model, type Model } from 'mongoose';
import type { AgentAction } from '@openvyapar/shared';

const agentActionSchema = new Schema<AgentAction>(
  {
    agent_action_id: {
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
    agent_type: {
      type: String,
      enum: [
        'onboarding',
        'consent_explainer',
        'delegation_scoping',
        'compliance_nudge',
        'verifier_trust',
      ],
      required: true,
    },
    input_summary: {
      type: String,
      required: true,
    },
    proposed_action: {
      type: Schema.Types.Mixed,
      required: true,
    },
    human_decision: {
      type: String,
      enum: ['confirmed', 'edited', 'rejected', 'pending'],
      default: 'pending',
      required: true,
    },
    created_at: {
      type: String,
      required: true,
      index: true,
    },
    decided_at: {
      type: String,
      default: null,
    },
    target_action_ref: {
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

agentActionSchema.index({ business_id: 1, created_at: -1 });

export const AgentActionModel: Model<AgentAction> = model<AgentAction>(
  'AgentAction',
  agentActionSchema
);
