import { Router, type Request, type Response } from 'express';
import crypto from 'node:crypto';
import type {
  Business,
  BusinessRole,
  CreateBusinessRequest,
  CreateBusinessResponse,
  AssignRoleRequest,
  AssignRoleResponse,
  GetBusinessResponse,
  GetBusinessRolesResponse,
} from '@openvyapar/shared';
import { db } from '../db/connection.js';
import { recordAuditLog } from '../utils/audit.js';
import { sendError } from '../utils/errors.js';

export const businessRouter = Router();

/**
 * POST /business
 * Create a new business identity (did:biz:...) and assign initial owner role
 */
businessRouter.post('/', (req: Request<{}, {}, CreateBusinessRequest>, res: Response) => {
  try {
    const { name, primary_language = 'hi', metadata = {}, owner_person_id, agent_action_id } = req.body;

    if (!name || !owner_person_id) {
      return sendError(res, 400, 'Missing required fields: name, owner_person_id');
    }

    const businessId = `did:biz:${crypto.randomBytes(4).toString('hex')}`;
    const createdAt = new Date().toISOString();

    const newBusiness: Business = {
      business_id: businessId,
      name,
      status: 'active',
      created_at: createdAt,
      primary_language,
      metadata: {
        sector: metadata.sector || 'Retail',
        location: metadata.location || 'India',
        ...metadata,
      },
    };

    db.setBusiness(newBusiness);

    // Create Owner Role
    const ownerRole: BusinessRole = {
      role_id: `role-${crypto.randomUUID()}`,
      business_id: businessId,
      person_id: owner_person_id,
      role_type: 'owner',
      status: 'active',
      granted_at: createdAt,
      revoked_at: null,
    };

    db.setBusinessRole(ownerRole);

    // If originated from agent onboarding proposal, update agent_action status
    if (agent_action_id) {
      const agentAction = db.getAgentAction(agent_action_id);
      if (agentAction) {
        agentAction.human_decision = 'confirmed';
        agentAction.decided_at = createdAt;
        agentAction.target_action_ref = businessId;
        db.setAgentAction(agentAction);
      }
    }

    // Record Immutable Audit Log
    recordAuditLog(
      businessId,
      'owner',
      owner_person_id,
      'create_business',
      true,
      { name, business_id: businessId, agent_action_id }
    );

    const responsePayload: CreateBusinessResponse = {
      success: true,
      business: newBusiness,
      owner_role: ownerRole,
    };

    res.status(201).json(responsePayload);
  } catch (err: any) {
    sendError(res, 500, err.message || 'Internal server error');
  }
});

/**
 * GET /business
 * List all registered businesses (helpful for demo context switching)
 */
businessRouter.get('/', (_req: Request, res: Response) => {
  const businesses = db.getAllBusinesses();
  res.json({ success: true, count: businesses.length, businesses });
});

/**
 * GET /business/:id
 * Fetch business profile and active roles
 */
businessRouter.get('/:id', (req: Request<{ id: string }>, res: Response) => {
  const business = db.getBusiness(req.params.id);
  if (!business) {
    return sendError(res, 404, `Business with id ${req.params.id} not found`);
  }

  const roles = db.getRolesForBusiness(req.params.id);
  const responsePayload: GetBusinessResponse = {
    success: true,
    business,
    roles,
  };

  res.json(responsePayload);
});

/**
 * POST /business/:id/roles
 * Grant or transfer a role (owner, partner, successor, delegate)
 */
businessRouter.post('/:id/roles', (req: Request<{ id: string }, {}, AssignRoleRequest>, res: Response) => {
  try {
    const businessId = req.params.id;
    const { person_id, role_type, granted_by } = req.body;

    const business = db.getBusiness(businessId);
    if (!business) {
      return sendError(res, 404, `Business with id ${businessId} not found`);
    }

    if (!person_id || !role_type || !granted_by) {
      return sendError(res, 400, 'Missing required fields: person_id, role_type, granted_by');
    }

    // If transferring primary ownership (Beat 5 narrative), demote existing owner to former
    if (role_type === 'owner') {
      const existingRoles = db.getRolesForBusiness(businessId);
      for (const role of existingRoles) {
        if (role.role_type === 'owner') {
          role.status = 'former';
          role.revoked_at = new Date().toISOString();
          db.setBusinessRole(role);
        }
      }
    }

    const newRole: BusinessRole = {
      role_id: `role-${crypto.randomUUID()}`,
      business_id: businessId,
      person_id,
      role_type,
      status: 'active',
      granted_at: new Date().toISOString(),
      revoked_at: null,
    };

    db.setBusinessRole(newRole);

    recordAuditLog(
      businessId,
      'owner',
      granted_by,
      role_type === 'owner' ? 'transfer_ownership' : `grant_role_${role_type}`,
      true,
      { new_role_id: newRole.role_id, person_id, role_type }
    );

    const responsePayload: AssignRoleResponse = {
      success: true,
      role: newRole,
    };

    res.status(201).json(responsePayload);
  } catch (err: any) {
    sendError(res, 500, err.message || 'Internal server error');
  }
});

/**
 * GET /business/:id/roles
 * Get all role holders with hydrated person info
 */
businessRouter.get('/:id/roles', (req: Request<{ id: string }>, res: Response) => {
  const businessId = req.params.id;
  const business = db.getBusiness(businessId);
  if (!business) {
    return sendError(res, 404, `Business with id ${businessId} not found`);
  }

  const rawRoles = db.getAllRolesForBusiness(businessId);
  const rolesWithPerson = rawRoles.map((r) => ({
    ...r,
    person: db.getPerson(r.person_id) || undefined,
  }));

  const responsePayload: GetBusinessRolesResponse = {
    success: true,
    business_id: businessId,
    roles: rolesWithPerson,
  };

  res.json(responsePayload);
});
