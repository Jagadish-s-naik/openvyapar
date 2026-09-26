import { Router, type Request, type Response } from 'express';
import type {
  IssueMockBatchRequest,
  IssueMockBatchResponse,
  IssueCscWitnessRequest,
  IssueCscWitnessResponse,
  MockBatchTemplate,
  SelfAttestedClaimPayload,
} from '@openvyapar/shared';
import { db } from '../db/connection.js';
import { issueMockGstCredential } from '../mocks/gst_issuer.js';
import { issueMockBankCredential } from '../mocks/bank_issuer.js';
import { issueMockMarketplaceCredential } from '../mocks/marketplace_issuer.js';
import { issueMockCscWitnessCredential } from '../mocks/csc_issuer.js';
import { MOCK_BATCH_TEMPLATES } from '../mocks/templates.js';
import { recordAuditLog } from '../utils/audit.js';
import { sendError } from '../utils/errors.js';

export const mocksRouter = Router();

/**
 * POST /mocks/issue-batch/:business_id
 * Simulates Beat 2 Time-skip: GST, Bank, and Marketplace issuers each issue
 * signed credentials to the specified business based on selected profile template.
 *
 * Supported templates:
 * - standard_healthy (default): 100% compliance, high orders, tier 1 balance
 * - gst_defaulter: Missed returns, active compliance score 42, tier 3 balance
 * - high_growth_merchant: >5,000 orders on ONDC, 4.9 rating, 100% compliance
 */
mocksRouter.post(
  '/issue-batch/:business_id',
  (req: Request<{ business_id: string }, IssueMockBatchResponse | { success: false }, IssueMockBatchRequest, { template?: string }>, res: Response) => {
    try {
      const businessId = req.params.business_id;
      const business = db.getBusiness(businessId);

      if (!business) {
        return sendError(res, 404, `Business with id ${businessId} not found`);
      }

      const templateParam = (req.body.template || req.query.template || 'standard_healthy') as MockBatchTemplate;
      const templateConfig = MOCK_BATCH_TEMPLATES[templateParam];

      if (!templateConfig) {
        return sendError(
          res,
          400,
          `Invalid template '${templateParam}'. Supported templates: ${Object.keys(MOCK_BATCH_TEMPLATES).join(', ')}`
        );
      }

      const overrides = req.body.overrides || {};
      const gstOverrides = { ...templateConfig.gst, ...(overrides.gst || {}) };
      const bankOverrides = { ...templateConfig.bank, ...(overrides.bank || {}) };
      const mktOverrides = { ...templateConfig.marketplace, ...(overrides.marketplace || {}) };

      const gstCred = issueMockGstCredential(businessId, business.name, gstOverrides);
      const bankCred = issueMockBankCredential(businessId, bankOverrides);
      const mktCred = issueMockMarketplaceCredential(businessId, mktOverrides);

      db.setCredential(gstCred);
      db.setCredential(bankCred);
      db.setCredential(mktCred);

      recordAuditLog(businessId, 'issuer', 'gst_mock', 'issue_credential', true, {
        credential_id: gstCred.credential_id,
        template: templateParam,
      });
      recordAuditLog(businessId, 'issuer', 'bank_mock', 'issue_credential', true, {
        credential_id: bankCred.credential_id,
        template: templateParam,
      });
      recordAuditLog(businessId, 'issuer', 'marketplace_mock', 'issue_credential', true, {
        credential_id: mktCred.credential_id,
        template: templateParam,
      });

      const response: IssueMockBatchResponse = {
        success: true,
        business_id: businessId,
        template: templateParam,
        message: `Successfully issued batch credentials for profile template '${templateParam}'.`,
        credentials: [gstCred, bankCred, mktCred],
      };

      res.status(201).json(response);
    } catch (err: unknown) {
      sendError(res, 500, (err as Error).message || 'Internal server error');
    }
  }
);

/**
 * POST /mocks/csc-witness
 * Simulates CSC Field Agent Physical Witnessing:
 * Geo-tags physical shop coordinates, generates photo verification hash,
 * and issues an authentic HMAC-signed self_attested credential for Beat 1 zero-footprint onboarding.
 */
mocksRouter.post(
  '/csc-witness',
  (req: Request<Record<string, string>, IssueCscWitnessResponse | { success: false }, IssueCscWitnessRequest>, res: Response) => {
    try {
      const {
        business_id,
        csc_agent_id,
        agent_name,
        csc_center_id,
        coordinates,
        claim_overrides,
        agent_action_id,
      } = req.body;

      if (!business_id) {
        return sendError(res, 400, 'Missing required field: business_id');
      }

      const business = db.getBusiness(business_id);
      if (!business) {
        return sendError(res, 404, `Business with id ${business_id} not found`);
      }

      const cscCred = issueMockCscWitnessCredential(business_id, {
        csc_agent_id,
        agent_name,
        csc_center_id,
        coordinates,
        claim_overrides,
        agent_action_id,
      });

      db.setCredential(cscCred);

      if (agent_action_id) {
        const action = db.getAgentAction(agent_action_id);
        if (action && action.human_decision === 'pending') {
          action.human_decision = 'confirmed';
          db.setAgentAction(action);
        }
      }

      const claim = cscCred.claim as SelfAttestedClaimPayload;
      recordAuditLog(business_id, 'field_agent', claim.witnessed_by_csc_agent_id || 'did:person:csc001', 'issue_credential', true, {
        credential_id: cscCred.credential_id,
        type: 'self_attested',
        csc_center_id: claim.csc_center_id,
        location_coordinates: claim.location_coordinates,
        photo_verification_hash: claim.photo_verification_hash,
      });

      const response: IssueCscWitnessResponse = {
        success: true,
        business_id,
        credential: cscCred,
        witness_summary: {
          agent_id: claim.witnessed_by_csc_agent_id || 'did:person:csc001',
          agent_name: claim.witness_agent_name || 'Aarav Patel (CSC VLE)',
          csc_center_id: claim.csc_center_id || 'CSC-UP-VAR-049',
          location_coordinates: claim.location_coordinates || { lat: 25.3176, lng: 82.9739 },
          photo_verification_hash: claim.photo_verification_hash || 'hash_mock_photo_attest',
          verified_at: cscCred.issued_at,
        },
        message: 'Physical premises verified and HMAC-signed CSC witness credential issued successfully.',
      };

      res.status(201).json(response);
    } catch (err: unknown) {
      sendError(res, 500, (err as Error).message || 'Internal server error');
    }
  }
);
