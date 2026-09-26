import crypto from 'node:crypto';
import type { Request } from 'express';
import type { AuditActorType, AuditLog } from '@openvyapar/shared';
import { db } from '../db/connection.js';

export interface AuditLogOptions {
  req?: Request;
  ipAddress?: string;
  origin?: string;
  actorRole?: string;
  diff?: Record<string, { before: unknown; after: unknown }>;
  metadata?: Record<string, unknown>;
}

export function recordAuditLog(
  businessId: string,
  actorType: AuditActorType,
  actorId: string,
  action: string,
  confirmedByHuman: boolean,
  optionsOrMetadata?: AuditLogOptions | Record<string, unknown>
): AuditLog {
  let ipAddress: string | undefined;
  let origin: string | undefined;
  let actorRole: string | undefined;
  let diff: Record<string, { before: unknown; after: unknown }> | undefined;
  let metadata: Record<string, unknown> = {};

  if (optionsOrMetadata) {
    if (
      'req' in optionsOrMetadata ||
      'ipAddress' in optionsOrMetadata ||
      'diff' in optionsOrMetadata ||
      'actorRole' in optionsOrMetadata
    ) {
      const opts = optionsOrMetadata as AuditLogOptions;
      if (opts.req) {
        ipAddress =
          (opts.req.headers['x-forwarded-for'] as string) ||
          opts.req.socket.remoteAddress ||
          '127.0.0.1';
        origin =
          (opts.req.headers['origin'] as string) ||
          (opts.req.headers['referer'] as string) ||
          'https://openvyapar.in';
        actorRole = (opts.req.headers['x-openvyapar-actor-role'] as string) || opts.actorRole;
      }
      ipAddress = opts.ipAddress || ipAddress;
      origin = opts.origin || origin;
      actorRole = opts.actorRole || actorRole;
      diff = opts.diff;
      metadata = opts.metadata || {};
    } else {
      metadata = optionsOrMetadata as Record<string, unknown>;
    }
  }

  // Auto-resolve actorRole if not explicitly provided
  if (!actorRole && actorId) {
    if (actorType === 'owner') actorRole = 'Business Owner';
    else if (actorType === 'delegate') actorRole = 'Authorized Delegate / CA';
    else if (actorType === 'issuer') actorRole = 'Institutional Issuer';
    else if (actorType === 'agent_suggestion') actorRole = 'AI Co-pilot';
    else actorRole = 'System';
  }

  const logEntry: AuditLog = {
    log_id: `log-${crypto.randomUUID()}`,
    business_id: businessId,
    actor_type: actorType,
    actor_id: actorId,
    action: action,
    confirmed_by_human: confirmedByHuman,
    timestamp: new Date().toISOString(),
    ip_address: ipAddress || '127.0.0.1',
    origin: origin || 'https://openvyapar.in',
    actor_role: actorRole,
    diff: diff,
    metadata: metadata,
  };

  db.addAuditLog(logEntry);
  return logEntry;
}
