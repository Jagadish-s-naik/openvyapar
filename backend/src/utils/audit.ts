import crypto from 'node:crypto';
import type { AuditActorType, AuditLog } from '@openvyapar/shared';
import { db } from '../db/connection.js';

export function recordAuditLog(
  businessId: string,
  actorType: AuditActorType,
  actorId: string,
  action: string,
  confirmedByHuman: boolean,
  metadata?: Record<string, unknown>
): AuditLog {
  const logEntry: AuditLog = {
    log_id: `log-${crypto.randomUUID()}`,
    business_id: businessId,
    actor_type: actorType,
    actor_id: actorId,
    action: action,
    confirmed_by_human: confirmedByHuman,
    timestamp: new Date().toISOString(),
    metadata: metadata || {},
  };

  db.addAuditLog(logEntry);
  return logEntry;
}
