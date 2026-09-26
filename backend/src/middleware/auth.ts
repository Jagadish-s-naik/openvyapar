import type { Request, Response, NextFunction } from 'express';
import type { Person, BusinessRole, RoleType } from '@openvyapar/shared';
import { db } from '../db/connection.js';
import { sendError } from '../utils/errors.js';

export interface ActorContext {
  actorId?: string;
  person?: Person | null;
  roles: BusinessRole[];
  isOwner: (businessId: string) => boolean;
  hasRole: (businessId: string, allowedRoles: RoleType[]) => boolean;
  getRole: (businessId: string) => BusinessRole | undefined;
}

declare global {
  namespace Express {
    interface Request {
      actor?: ActorContext;
    }
  }
}

/**
 * Extracts simulation actor from headers (x-openvyapar-actor-id), query parameters, or body.
 * Auto-hydrates person and role metadata.
 */
export function authContextMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const headerActorId = (req.headers['x-openvyapar-actor-id'] as string) || undefined;
  const queryActorId = (req.query.actor_id as string) || undefined;
  const bodyActorId = (req.body?.granted_by ||
    req.body?.owner_person_id ||
    req.body?.revoked_by ||
    req.body?.generated_by) as string | undefined;

  const actorId = headerActorId || queryActorId || bodyActorId;

  let person: Person | null = null;
  let roles: BusinessRole[] = [];

  if (actorId) {
    person = db.getPerson(actorId);
    roles = db.getRolesForPerson(actorId);
  }

  req.actor = {
    actorId,
    person,
    roles,
    isOwner: (businessId: string) => {
      if (!actorId) return false;
      return roles.some(
        (r) => r.business_id === businessId && r.role_type === 'owner' && r.status === 'active'
      );
    },
    hasRole: (businessId: string, allowedRoles: RoleType[]) => {
      if (!actorId) return false;
      return roles.some(
        (r) =>
          r.business_id === businessId &&
          allowedRoles.includes(r.role_type) &&
          r.status === 'active'
      );
    },
    getRole: (businessId: string) => {
      if (!actorId) return undefined;
      return roles.find((r) => r.business_id === businessId && r.status === 'active');
    },
  };

  next();
}

/**
 * Route guard that requires the actor to be an active owner of the target business.
 * If x-openvyapar-actor-id is provided and the actor is NOT an owner, rejects with 403 Forbidden.
 */
export function requireOwner(getBusinessId: (req: Request<any, any, any, any>) => string | string[] | undefined | null) {
  return (req: Request, res: Response, next: NextFunction) => {
    const rawId = getBusinessId(req);
    const businessId = Array.isArray(rawId) ? rawId[0] : rawId || undefined;
    if (!businessId) {
      return next();
    }

    const headerActorId = req.headers['x-openvyapar-actor-id'] as string;
    // If strict actor header is provided, enforce permission
    if (headerActorId) {
      if (!req.actor?.isOwner(businessId)) {
        return sendError(
          res,
          403,
          `Forbidden: Actor '${headerActorId}' is not an active owner of business '${businessId}'.`
        );
      }
    }

    next();
  };
}

/**
 * Route guard that requires the actor to have at least one of the specified active roles on the business.
 */
export function requireRole(
  allowedRoles: RoleType[],
  getBusinessId: (req: Request<any, any, any, any>) => string | string[] | undefined | null
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const rawId = getBusinessId(req);
    const businessId = Array.isArray(rawId) ? rawId[0] : rawId || undefined;
    if (!businessId) {
      return next();
    }

    const headerActorId = req.headers['x-openvyapar-actor-id'] as string;
    if (headerActorId) {
      if (!req.actor?.hasRole(businessId, allowedRoles)) {
        return sendError(
          res,
          403,
          `Forbidden: Actor '${headerActorId}' does not have required role [${allowedRoles.join(
            ', '
          )}] on business '${businessId}'.`
        );
      }
    }

    next();
  };
}
