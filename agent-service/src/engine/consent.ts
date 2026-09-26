import crypto from 'node:crypto';
import type { ConsentExplainRequest, ConsentExplainResponse } from '@openvyapar/shared';

export function explainConsent(input: ConsentExplainRequest): ConsentExplainResponse {
  const lang = input.language || 'hi';
  const recipient = input.recipient_name || 'Lender / Platform';
  const creds = input.selected_credential_ids || [];

  const agentActionId = `agent-act-consent-${crypto.randomUUID().slice(0, 8)}`;

  // Multilingual explanations
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
    success: true,
    agent_action_id: agentActionId,
    plain_language_explanation: explanation,
    shared_data_summary: shared,
    withheld_data_summary: withheld,
    risk_assessment: 'low',
    recommendations,
  };
}
