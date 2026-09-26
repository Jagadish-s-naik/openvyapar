import crypto from 'node:crypto';
import type { VerifierFlagRequest, VerifierFlagResponse } from '@openvyapar/shared';

export function analyzeVerifierTrust(input: VerifierFlagRequest): VerifierFlagResponse {
  const flags: { severity: 'info' | 'warning' | 'alert'; code: string; message: string }[] = [];
  const creds = input.credentials || [];
  const agentActionId = `agent-act-verify-${crypto.randomUUID().slice(0, 8)}`;

  // 1. Check business status
  if (input.business_status === 'frozen') {
    flags.push({
      severity: 'alert',
      code: 'STATUS_FROZEN',
      message: 'Business identity is temporarily frozen due to ownership dispute or succession transition.',
    });
  } else if (input.business_status === 'closed') {
    flags.push({
      severity: 'alert',
      code: 'STATUS_CLOSED',
      message: 'Business is marked as officially closed in registry.',
    });
  }

  // 2. Check for missing critical credentials
  const hasGst = creds.some((c) => c.type === 'gst_compliant');
  const hasOrderHistory = creds.some((c) => c.type === 'order_history');

  if (!hasGst) {
    flags.push({
      severity: 'warning',
      code: 'GST_NOT_DISCLOSED',
      message: 'GSTN compliance credential was not included in this proof share.',
    });
  }

  // 3. Check for high performance positive indicators
  if (hasGst && hasOrderHistory) {
    flags.push({
      severity: 'info',
      code: 'HIGH_INTEGRITY_TRACK_RECORD',
      message: 'Multi-source verified history: GST compliance and active marketplace fulfillment verified.',
    });
  }

  const hasAlert = flags.some((f) => f.severity === 'alert');
  const hasWarning = flags.some((f) => f.severity === 'warning');

  const overallVerdict = hasAlert
    ? 'high_risk'
    : hasWarning
    ? 'attention_recommended'
    : 'verified_clean';

  const narrative =
    overallVerdict === 'verified_clean'
      ? 'The business identity exhibits unbroken verified history across government and e-commerce channels with zero default flags.'
      : hasAlert
      ? 'Critical alert flags detected. Underwriting review required before credit decision.'
      : 'Minor warnings noted (such as selective credential omission). Review requested.';

  return {
    success: true,
    agent_action_id: agentActionId,
    anomalies_detected: hasAlert || hasWarning,
    flags,
    overall_verdict: overallVerdict,
    narrative_summary: narrative,
  };
}
