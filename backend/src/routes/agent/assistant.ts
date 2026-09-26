import { Router, type Request, type Response } from 'express';

export const assistantRouter = Router();

/**
 * POST /agent/assist
 * Processes multi-lingual user query and returns routing intent + contextual actions
 */
assistantRouter.post('/assist', (req: Request, res: Response) => {
  try {
    const { query = '', language = 'en', business_id = 'OV-4471' } = req.body;
    const q = query.toLowerCase().trim();

    let targetPath = '/';
    let targetName = 'Dashboard';
    let intent = 'dashboard_overview';
    let explanation = 'Navigating to business summary and key identity metrics.';

    if (
      q.includes('consent') ||
      q.includes('सहमति') ||
      q.includes('ಸಮ್ಮತಿ') ||
      q.includes('approve') ||
      q.includes('ondc') ||
      q.includes('deny') ||
      q.includes('revoke') ||
      q.includes('pending')
    ) {
      targetPath = '/consents';
      targetName = 'Consent & Delegation';
      intent = 'review_consents';
      explanation = 'Review and authorize or revoke data access permissions.';
    } else if (
      q.includes('audit') ||
      q.includes('ऑडिट') ||
      q.includes('ಆಡಿಟ್') ||
      q.includes('access') ||
      q.includes('log') ||
      q.includes('history')
    ) {
      targetPath = '/audit';
      targetName = 'Immutable Audit Log';
      intent = 'view_audit_ledger';
      explanation = 'Inspect cryptographic records of external verifier accesses.';
    } else if (
      q.includes('credential') ||
      q.includes('प्रमाण') ||
      q.includes('ಪ್ರಮಾಣಪತ್ರ') ||
      q.includes('udyam') ||
      q.includes('gst') ||
      q.includes('share') ||
      q.includes('proof')
    ) {
      targetPath = '/credentials';
      targetName = 'Verifiable Credentials';
      intent = 'manage_credentials';
      explanation = 'Access and generate cryptographic proof tokens for registered credentials.';
    } else if (
      q.includes('id') ||
      q.includes('qr') ||
      q.includes('identity') ||
      q.includes('पहचान') ||
      q.includes('ಗುರುತು')
    ) {
      targetPath = '/identity';
      targetName = 'Sovereign Business ID';
      intent = 'view_identity';
      explanation = 'View sovereign business credentials, QR Pass, and registry attestations.';
    } else if (
      q.includes('service') ||
      q.includes('सेवा') ||
      q.includes('ಸೇವೆ') ||
      q.includes('bank') ||
      q.includes('connect')
    ) {
      targetPath = '/services';
      targetName = 'Connected Services';
      intent = 'manage_services';
      explanation = 'Manage interoperability connections with DPI network participants.';
    }

    res.json({
      success: true,
      query,
      language,
      business_id,
      handoff: {
        targetPath,
        targetName,
        intent,
        explanation,
      },
      zero_custody: true,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});
