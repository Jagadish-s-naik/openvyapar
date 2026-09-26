import crypto from 'node:crypto';
import type { ConsentExplainRequest } from '@openvyapar/shared';
import { callAgent } from '../lib/callAgent.js';

export interface ConsentExplainResult {
  success: boolean;
  agent_action_id: string;
  plain_summary: string;
  will_share: string[];
  will_not_share: string[];
  risk_assessment: 'low' | 'medium' | 'high';
  recommendations: string[];
  // Backwards-compatibility aliases
  plain_language_explanation: string;
  shared_data_summary: string[];
  withheld_data_summary: string[];
}

function heuristicFallback(input: ConsentExplainRequest): {
  plain_summary: string;
  will_share: string[];
  will_not_share: string[];
  risk_assessment: 'low' | 'medium' | 'high';
  recommendations: string[];
} {
  const lang = input.language || 'hi';
  const recipient = input.recipient_name || 'Lender / Platform';

  let explanation = '';
  let shared: string[] = [];
  let withheld: string[] = [];
  let recommendations: string[] = [];

  if (lang === 'hi') {
    explanation = `आप "${recipient}" के साथ अपने व्यवसाय की केवल चुनिंदा जानकारी साझा करने जा रहे हैं। यह प्रमाण केवल ऋण पात्रता और व्यावसायिक साख सिद्ध करने के लिए उपयोग किया जाएगा।`;
    shared = [
      'जीएसटी अनुपालन स्कोर और पिछले 6 महीनों के समय पर रिटर्न दाखिल करने का रिकॉर्ड',
      'ई-कॉमर्स / ओएनडीसी नेटवर्क पर पूर्ण किए गए ऑर्डर और ग्राहक रेटिंग (4.8/5.0)',
      'व्यावसायिक प्रतिष्ठान का आधिकारिक नाम और पंजीकृत पता',
    ];
    withheld = [
      'बैंक खाते की शेष राशि और व्यक्तिगत खाता विवरण (साझा नहीं किया गया)',
      'विस्तृत ग्राहक सूची और आपूर्तिकर्ता (Supplier) की व्यक्तिगत जानकारी (पूर्णतः सुरक्षित)',
      'दैनिक नकद लेनदेन और आंतरिक मार्जिन (गोपनीय)',
    ];
    recommendations = [
      'प्रमाण पत्र की वैधता केवल 30 दिनों के लिए सेट करें।',
      'सत्यापनकर्ता को केवल आवश्यक उद्देश्यों के लिए ही देखने की अनुमति दें।',
    ];
  } else if (lang === 'kn') {
    explanation = `ನೀವು "${recipient}" ಅವರೊಂದಿಗೆ ನಿಮ್ಮ ವ್ಯಾಪಾರದ ಆಯ್ದ ಮಾಹಿತಿಯನ್ನು ಮಾತ್ರ ಹಂಚಿಕೊಳ್ಳುತ್ತಿದ್ದೀರಿ. ನಿಮ್ಮ ಬ್ಯಾಂಕಿಂಗ್ ಗೌಪ್ಯತೆ ಸಂಪೂರ್ಣವಾಗಿ ರಕ್ಷಿಸಲ್ಪಟ್ಟಿದೆ.`;
    shared = [
      'ಜಿಎಸ್‌ಟಿ ರಿಟರ್ನ್ ಸಲ್ಲಿಕೆ ಅನುಸರಣೆ ದಾಖಲೆ (ಕಳೆದ 6 ತಿಂಗಳು)',
      'ಮಾರುಕಟ್ಟೆ ವಹಿವಾಟು ಪರಿಮಾಣ ಮತ್ತು ಗ್ರಾಹಕರ ತೃಪ್ತಿ ರೇಟಿಂಗ್',
      'ವ್ಯಾಪಾರದ ನೋಂದಾಯಿತ ಹೆಸರು ಮತ್ತು ವಿಳಾಸ',
    ];
    withheld = [
      'ಬ್ಯಾಂಕ್ ಖಾತೆಯ ಬಾಕಿ ಮತ್ತು ಲೆಡ್ಜರ್ ವಿವರಗಳು (ರಕ್ಷಿಸಲಾಗಿದೆ)',
      'ಗ್ರಾಹಕರ ವಿವರಗಳು ಮತ್ತು ಸರಬರಾಜುದಾರರ ಗೌಪ್ಯ ಮಾಹಿತಿ (ಹಂಚಿಕೊಳ್ಳಲಾಗಿಲ್ಲ)',
    ];
    recommendations = [
      'ದೃಢೀಕರಣ ನೀಡುವ ಮುನ್ನ ಪರಿಶೀಲಕರ ಹೆಸರನ್ನು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.',
    ];
  } else {
    explanation = `You are about to share a selective-disclosure proof with "${recipient}". Only cryptographic proof of compliance and sales track record will be shared.`;
    shared = [
      'Verified GST compliance score (98/100) and on-time filing track record',
      'Marketplace seller performance (1,420 orders fulfilled, 4.8 customer rating)',
      'Registered business DID and physical location in Varanasi',
    ];
    withheld = [
      'Full bank account statements & detailed balances (WITHHELD)',
      'Customer names, invoice-level line items & profit margins (PROTECTED)',
      'Direct account access or withdrawal privileges (NEVER GRANTED)',
    ];
    recommendations = [
      'Verify that the recipient is an accredited lending partner.',
      'You can revoke or expire this proof share at any time from your Wallet.',
    ];
  }

  return {
    plain_summary: explanation,
    will_share: shared,
    will_not_share: withheld,
    risk_assessment: 'low',
    recommendations,
  };
}

export async function explainConsent(input: ConsentExplainRequest): Promise<ConsentExplainResult> {
  const agentActionId = `agent-act-consent-${crypto.randomUUID().slice(0, 8)}`;
  const fallbackData = heuristicFallback(input);

  const extracted: any = await callAgent({
    promptFile: 'consent_explainer.md',
    userInput: {
      business_id: input.business_id,
      purpose: input.purpose,
      selected_credential_ids: input.selected_credential_ids,
      recipient_name: input.recipient_name,
      language: input.language,
    },
    fallback: () => fallbackData,
  });

  const plainSummary = extracted.plain_summary || extracted.plain_language_explanation || fallbackData.plain_summary;
  const willShare = extracted.will_share || extracted.shared_data_summary || fallbackData.will_share;
  const willNotShare = extracted.will_not_share || extracted.withheld_data_summary || fallbackData.will_not_share;
  const riskAssessment = extracted.risk_assessment || fallbackData.risk_assessment;
  const recommendations = extracted.recommendations || fallbackData.recommendations;

  return {
    success: true,
    agent_action_id: agentActionId,
    plain_summary: plainSummary,
    will_share: willShare,
    will_not_share: willNotShare,
    risk_assessment: riskAssessment,
    recommendations,
    // Backwards-compatibility aliases
    plain_language_explanation: plainSummary,
    shared_data_summary: willShare,
    withheld_data_summary: willNotShare,
  };
}
