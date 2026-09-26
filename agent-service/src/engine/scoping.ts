import crypto from 'node:crypto';
import type { DelegationScope, ScopeSuggestRequest, ScopeSuggestResponse } from '@openvyapar/shared';

export function suggestDelegationScope(input: ScopeSuggestRequest): ScopeSuggestResponse {
  const prompt = (input.natural_language_prompt || '').toLowerCase();
  const lang = input.language || 'hi';
  const delegateName = input.delegate_info?.name || 'प्रतिनिधि / CA';

  const agentActionId = `agent-act-scope-${crypto.randomUUID().slice(0, 8)}`;
  let scopes: DelegationScope[] = [];
  let explanation = '';
  let leastPrivilegeNotes = '';

  // Principle of least privilege matching
  if (
    prompt.includes('tax') ||
    prompt.includes('gst') ||
    prompt.includes('रिटर्न') ||
    prompt.includes('टैक्स') ||
    prompt.includes('ca') ||
    prompt.includes('ತೆರಿಗೆ')
  ) {
    scopes = ['file_returns', 'view_compliance'];

    if (lang === 'hi') {
      explanation = `आपके अनुरोध के आधार पर, आपके सीए (${delegateName}) को केवल जीएसटी/टैक्स रिटर्न तैयार करने और दाखिल करने की अनुमति दी जाएगी।`;
      leastPrivilegeNotes = 'न्यूनतम विशेषाधिकार सुरक्षा: बैंक विवरण देखने, ऋण आवेदन करने या व्यावसायिक प्रोफ़ाइल बदलने की कोई अनुमति नहीं दी गई है।';
    } else if (lang === 'kn') {
      explanation = `ನಿಮ್ಮ ಮನವಿಯಂತೆ, ನಿಮ್ಮ ಸಿಎ ಅವರಿಗೆ ಕೇವಲ ತೆರಿಗೆ ರಿಟರ್ನ್ಸ್ ಸಲ್ಲಿಸಲು ಮಾತ್ರ ಅಧಿಕಾರ ನೀಡಲಾಗುತ್ತದೆ.`;
      leastPrivilegeNotes = 'ಕನಿಷ್ಠ ಸವಲತ್ತು ಭದ್ರತೆ: ಬ್ಯಾಂಕ್ ಖಾತೆ ಅಥವಾ ಸಾಲದ ಹಕ್ಕುಗಳನ್ನು ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ.';
    } else {
      explanation = `Based on your request, only tax preparation and filing scopes ('file_returns', 'view_compliance') will be granted to ${delegateName}.`;
      leastPrivilegeNotes = 'Least-Privilege Guard: Sensitive banking, loan application, and profile ownership permissions are withheld.';
    }
  } else if (
    prompt.includes('order') ||
    prompt.includes('sales') ||
    prompt.includes('बिक्री') ||
    prompt.includes('ऑर्डर') ||
    prompt.includes('ಮಾರಾಟ')
  ) {
    scopes = ['view_order_history'];

    if (lang === 'hi') {
      explanation = `प्रतिनिधि को केवल दैनिक ऑर्डर और बिक्री इतिहास देखने की अनुमति दी जाएगी।`;
      leastPrivilegeNotes = 'टैक्स फाइलिंग और बैंक खाते की जानकारी सुरक्षित रखी गई है।';
    } else {
      scopes = ['view_order_history'];
      explanation = `Representative is granted read-only access to view order and shipment history.`;
      leastPrivilegeNotes = 'Tax filing and business ownership modifications are strictly excluded.';
    }
  } else {
    // Default fallback to read-only compliance check
    scopes = ['view_compliance'];
    explanation = 'Minimal read-only access proposed.';
    leastPrivilegeNotes = 'All modifying scopes withheld.';
  }

  return {
    success: true,
    agent_action_id: agentActionId,
    proposed_scopes: scopes,
    explanation,
    least_privilege_notes: leastPrivilegeNotes,
  };
}
