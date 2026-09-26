import { Router, type Request, type Response } from 'express';
import { db } from '../db/connection.js';
import { issueMockGstCredential } from '../mocks/gst_issuer.js';
import { issueMockBankCredential } from '../mocks/bank_issuer.js';
import { issueMockMarketplaceCredential } from '../mocks/marketplace_issuer.js';
import { recordAuditLog } from '../utils/audit.js';
import { sendError } from '../utils/errors.js';

export const mocksRouter = Router();

/**
 * POST /mocks/issue-batch/:business_id
 * Simulates Beat 2 Time-skip: GST, Bank, and Marketplace issuers each issue
 * signed credentials to the specified business.
 */
mocksRouter.post('/issue-batch/:business_id', (req: Request<{ business_id: string }>, res: Response) => {
  try {
    const businessId = req.params.business_id;
    const business = db.getBusiness(businessId);

    if (!business) {
      return sendError(res, 404, `Business with id ${businessId} not found`);
    }

    const gstCred = issueMockGstCredential(businessId, business.name);
    const bankCred = issueMockBankCredential(businessId);
    const mktCred = issueMockMarketplaceCredential(businessId);

    db.setCredential(gstCred);
    db.setCredential(bankCred);
    db.setCredential(mktCred);

    recordAuditLog(businessId, 'issuer', 'gst_mock', 'issue_credential', true, { credential_id: gstCred.credential_id });
    recordAuditLog(businessId, 'issuer', 'bank_mock', 'issue_credential', true, { credential_id: bankCred.credential_id });
    recordAuditLog(businessId, 'issuer', 'marketplace_mock', 'issue_credential', true, { credential_id: mktCred.credential_id });

    res.status(201).json({
      success: true,
      business_id: businessId,
      message: 'Successfully issued batch credentials from GSTN, Bank, and Marketplace issuers for Beat 2 demo.',
      credentials: [gstCred, bankCred, mktCred],
    });
  } catch (err: any) {
    sendError(res, 500, err.message || 'Internal server error');
  }
});
