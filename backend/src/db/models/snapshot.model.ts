import { Schema, model, type Model } from 'mongoose';
import type { DatabaseState, SnapshotMetadata } from '../connection.js';

export interface StoredMongoSnapshot extends SnapshotMetadata {
  state: DatabaseState;
}

const snapshotSchema = new Schema<StoredMongoSnapshot>(
  {
    snapshot_id: {
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
    description: {
      type: String,
    },
    created_at: {
      type: String,
      required: true,
      index: true,
    },
    record_counts: {
      type: Schema.Types.Mixed,
      required: true,
    },
    state: {
      type: Schema.Types.Mixed,
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

snapshotSchema.index({ created_at: -1 });

export const SnapshotModel: Model<StoredMongoSnapshot> = model<StoredMongoSnapshot>(
  'Snapshot',
  snapshotSchema
);
