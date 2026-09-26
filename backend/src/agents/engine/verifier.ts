import crypto from 'node:crypto';
import type { VerifierFlagRequest } from '@openvyapar/shared';
import { callAgent } from '../lib/callAgent.js';

export interface VerifierFlagResult {
  success: boolean;
  agent_action_id: string;
  // PRD top-level fields
  anomaly_detected: boolean;
  flag_summary: string;
  severity: 'info' | 'warning' | 'alert';
  // Detailed structure for frontend-verifier & audit
  anomalies_detected: boolean;
  narrative_summary: string;
  overall_verdict: 'verified_clean' | 'attention_recommended' | 'high_risk';
  flags: {
    severity: 'info' | 'warning' | 'alert';
    code: string;
    message: string;
  }[];
}

function heuristicFallback(input: VerifierFlagRequest): {
  anomaly_detected: boolean;
  flag_summary: string;
  severity: 'info' | 'warning' | 'alert';
  flags: { severity: 'info' | 'warning' | 'alert'; code: string; message: string }[];
  overall_verdict: 'verified_clean' | 'attention_recommended' | 'high_risk';
} {
  const flags: { severity: 'info' | 'warning' | 'alert'; code: string; message: string }[] = [];
  const creds = input.credentials || [];

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

  const overallVerdict: 'verified_clean' | 'attention_recommended' | 'high_risk' = hasAlert
    ? 'high_risk'
    : hasWarning
    ? 'attention_recommended'
    : 'verified_clean';

  const severity: 'info' | 'warning' | 'alert' = hasAlert ? 'alert' : hasWarning ? 'warning' : 'info';

  const flagSummary =
    overallVerdict === 'verified_clean'
      ? 'The business identity exhibits unbroken verified history across government and e-commerce channels with zero default flags.'
      : hasAlert
      ? 'Critical alert flags detected. Underwriting review required before credit decision.'
      : 'Minor warnings noted (such as selective credential omission). Review requested.';

  return {
    anomaly_detected: hasAlert || hasWarning,
    flag_summary: flagSummary,
    severity,
    flags,
    overall_verdict: overallVerdict,
  };
}

export async function analyzeVerifierTrust(input: VerifierFlagRequest): Promise<VerifierFlagResult> {
  const agentActionId = `agent-act-verify-${crypto.randomUUID().slice(0, 8)}`;
  const fallbackData = heuristicFallback(input);

  const extracted = await callAgent<Partial<VerifierFlagResult>>({
    promptFile: 'verifier_flagger.md',
    userInput: {
      proof_id: input.proof_id,
      business_id: input.business_id,
      business_status: input.business_status,
      credentials_summary: input.credentials?.map((c) => ({
        type: c.type,
        issuer: c.issuer,
        issued_at: c.issued_at,
        status: c.status,
      })),
    },
    fallback: () => fallbackData,
  });

  const anomalyDetected = extracted.anomaly_detected ?? extracted.anomalies_detected ?? fallbackData.anomaly_detected;
  const flagSummary = extracted.flag_summary || extracted.narrative_summary || fallbackData.flag_summary;
  const severity = extracted.severity || fallbackData.severity;
  const flags = extracted.flags || fallbackData.flags;
  const overallVerdict = extracted.overall_verdict || fallbackData.overall_verdict;

  return {
    success: true,
    agent_action_id: agentActionId,
    anomaly_detected: anomalyDetected,
    flag_summary: flagSummary,
    severity,
    anomalies_detected: anomalyDetected,
    narrative_summary: flagSummary,
    overall_verdict: overallVerdict,
    flags,
  };
}
