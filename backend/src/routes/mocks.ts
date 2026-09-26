import { Router, type Request, type Response } from 'express';
import type {
  IssueMockBatchRequest,
  IssueMockBatchResponse,
  MockBatchTemplate,
} from '@openvyapar/shared';
import { db } from '../db/connection.js';
import { issueMockGstCredential } from '../mocks/gst_issuer.js';
import { issueMockBankCredential } from '../mocks/bank_issuer.js';
import { issueMockMarketplaceCredential } from '../mocks/marketplace_issuer.js';
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
  (req: Request<{ business_id: string }, any, IssueMockBatchRequest, { template?: string }>, res: Response) => {
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
    } catch (err: any) {
      sendError(res, 500, err.message || 'Internal server error');
    }
  }
);
