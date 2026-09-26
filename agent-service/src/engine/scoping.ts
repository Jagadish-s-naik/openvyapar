import crypto from 'node:crypto';
import {
  FIXED_DELEGATION_SCOPES,
  type FixedDelegationScope,
  type DelegationScope,
  type ScopeSuggestRequest,
} from '@openvyapar/shared';
import { callAgent } from '../lib/callAgent.js';

export { FIXED_DELEGATION_SCOPES, type FixedDelegationScope };

export interface ScopingResult {
  success: boolean;
  agent_action_id: string;
  proposed_scopes: DelegationScope[];
  plain_summary: string;
  excluded_and_why: string;
  // Backwards-compatibility aliases for frontend-wallet / demo scripts
  explanation: string;
  least_privilege_notes: string;
}

/**
 * Unconditional runtime filter against FIXED_DELEGATION_SCOPES from @openvyapar/shared.
 * Drops any scope not in the fixed enum and logs a warning.
 */
export function filterValidScopes(rawScopes: string[]): DelegationScope[] {
  if (!Array.isArray(rawScopes)) {
    return [];
  }

  return rawScopes.filter((scope: string): scope is FixedDelegationScope => {
    const isValid = (FIXED_DELEGATION_SCOPES as readonly string[]).includes(scope);
    if (!isValid) {
      console.warn(
        `[scoping] Dropped invalid scope "${scope}" not in FIXED_DELEGATION_SCOPES. Raw model output:`,
        JSON.stringify(rawScopes)
      );
    }
    return isValid;
  });
}

function heuristicFallback(input: ScopeSuggestRequest): {
  proposed_scopes: DelegationScope[];
  plain_summary: string;
  excluded_and_why: string;
} {
  const prompt = (input.natural_language_prompt || '').toLowerCase();
  const lang = input.language || 'hi';
  const delegateName = input.delegate_info?.name || 'प्रतिनिधि / CA';

  let scopes: DelegationScope[] = [];
  let plainSummary = '';
  let excludedAndWhy = '';

  if (
    prompt.includes('tax') ||
    prompt.includes('gst') ||
    prompt.includes('रिटर्न') ||
    prompt.includes('टैक्स') ||
    prompt.includes('ca') ||
    prompt.includes('ತೆರಿಗೆ')
  ) {
    scopes = ['file_returns'];

    if (lang === 'hi') {
      plainSummary = `आपके अनुरोध के आधार पर, आपके सीए (${delegateName}) को केवल जीएसटी/टैक्स रिटर्न तैयार करने और दाखिल करने की अनुमति दी जाएगी।`;
      excludedAndWhy = 'न्यूनतम विशेषाधिकार सुरक्षा: बैंक विवरण देखने, प्रमाण पत्र बनाने या स्वामित्व बदलने की कोई अनुमति नहीं दी गई है।';
    } else if (lang === 'kn') {
      plainSummary = `ನಿಮ್ಮ ಮನವಿಯಂತೆ, ನಿಮ್ಮ ಸಿಎ ಅವರಿಗೆ ಕೇವಲ ತೆರಿಗೆ ರಿಟರ್ನ್ಸ್ ಸಲ್ಲಿಸಲು ಮಾತ್ರ ಅಧಿಕಾರ ನೀಡಲಾಗುತ್ತದೆ.`;
      excludedAndWhy = 'ಕನಿಷ್ಠ ಸವಲತ್ತು ಭದ್ರತೆ: ಬ್ಯಾಂಕ್ ಖಾತೆ ಅಥವಾ ಸಾಲದ ಹಕ್ಕುಗಳನ್ನು ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ.';
    } else {
      plainSummary = `Based on your request, only tax preparation and filing scope ('file_returns') will be granted to ${delegateName}.`;
      excludedAndWhy = 'Least-Privilege Guard: Banking, proof generation, and profile ownership permissions are withheld.';
    }
  } else if (
    prompt.includes('view') ||
    prompt.includes('credential') ||
    prompt.includes('प्रमाण') ||
    prompt.includes('दस्तावेज़')
  ) {
    scopes = ['view_credentials'];
    plainSummary = `Representative is granted read-only access to view verified business credentials.`;
    excludedAndWhy = 'Tax filing, delegation management, and ownership transfer are strictly excluded.';
  } else if (
    prompt.includes('proof') ||
    prompt.includes('loan') ||
    prompt.includes('साझा')
  ) {
    scopes = ['generate_proof'];
    plainSummary = `Representative is authorized to generate selective-disclosure proofs for specified recipients.`;
    excludedAndWhy = 'Tax filing and ownership modification permissions are withheld.';
  } else if (
    prompt.includes('transfer') ||
    prompt.includes('succession') ||
    prompt.includes('हस्तांतरण')
  ) {
    scopes = ['transfer_ownership'];
    plainSummary = `Ownership transfer permission granted for succession.`;
    excludedAndWhy = 'All standard operational actions excluded.';
  } else {
    scopes = ['view_credentials'];
    plainSummary = 'Minimal read-only access proposed.';
    excludedAndWhy = 'All state-modifying scopes withheld.';
  }

  return {
    proposed_scopes: scopes,
    plain_summary: plainSummary,
    excluded_and_why: excludedAndWhy,
  };
}

export async function suggestDelegationScope(input: ScopeSuggestRequest): Promise<ScopingResult> {
  const agentActionId = `agent-act-scope-${crypto.randomUUID().slice(0, 8)}`;
  const fallbackData = heuristicFallback(input);

  const extracted: any = await callAgent({
    promptFile: 'scope_suggester.md',
    userInput: {
      business_id: input.business_id,
      natural_language_prompt: input.natural_language_prompt,
      delegate_info: input.delegate_info,
      language: input.language,
    },
    fallback: () => fallbackData,
  });

  const rawScopes: string[] = Array.isArray(extracted.proposed_scopes)
    ? extracted.proposed_scopes
    : fallbackData.proposed_scopes;

  // Unconditional runtime filtering against FIXED_DELEGATION_SCOPES from @openvyapar/shared
  const validatedScopes = filterValidScopes(rawScopes);

  const finalScopes: DelegationScope[] = validatedScopes.length > 0
    ? validatedScopes
    : fallbackData.proposed_scopes;

  const plainSummary = extracted.plain_summary || extracted.explanation || fallbackData.plain_summary;
  const excludedAndWhy = extracted.excluded_and_why || extracted.least_privilege_notes || fallbackData.excluded_and_why;

  return {
    success: true,
    agent_action_id: agentActionId,
    proposed_scopes: finalScopes,
    plain_summary: plainSummary,
    excluded_and_why: excludedAndWhy,
    explanation: plainSummary,
    least_privilege_notes: excludedAndWhy,
  };
}
