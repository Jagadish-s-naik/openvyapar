/**
 * Supported Languages and UI Translations Keys
 */

export interface LanguageOption {
  code: string;
  name: string;
  native_name: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'hi', name: 'Hindi', native_name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', native_name: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'en', name: 'English', native_name: 'English', flag: '🌐' },
];

export const UI_STRINGS: Record<string, Record<string, string>> = {
  hi: {
    app_title: 'ओपन व्यापार - एकीकृत व्यावसायिक पहचान',
    tagline: 'भारत के व्यापार मालिकों के लिए डिजिटल सार्वजनिक अवसंरचना (DPI)',
    credentials: 'सत्यापित साख पत्र (Credentials)',
    delegations: 'प्रतिनिधि अधिकार (Delegations)',
    generate_proof: 'चुनिंदा प्रमाण बनाएं (Selective Proof)',
    verifier_portal: 'सत्यापनकर्ता पोर्टल',
    onboarding_title: 'सरल व्यापार ऑनबोर्डिंग',
    agent_proposed: 'एआई एजेंट द्वारा अनुशंसित',
    human_confirm_required: 'व्यापार मालिक की पुष्टि आवश्यक',
    confirm: 'स्वीकार करें',
    reject: 'अस्वीकार करें',
    status_active: 'सक्रिय',
    status_valid: 'सत्यापित एवं मान्य',
  },
  kn: {
    app_title: 'ಓಪನ್ ವ್ಯಾಪಾರ್ - ಏಕೀಕೃತ ವ್ಯಾಪಾರ ಗುರುತು',
    tagline: 'ಭಾರತೀಯ ವ್ಯಾಪಾರ ಮಾಲೀಕರಿಗಾಗಿ ಡಿಜಿಟಲ್ ಸಾರ್ವಜನಿಕ ಮೂಲಸೌಕರ್ಯ (DPI)',
    credentials: 'ದೃಢೀಕೃತ ಪ್ರಮಾಣಪತ್ರಗಳು',
    delegations: 'ನಿಯೋಜಿತ ಹಕ್ಕುಗಳು',
    generate_proof: 'ಆಯ್ದ ಪುರಾವೆ ರಚಿಸಿ',
    verifier_portal: 'ಪರಿಶೀಲಕರ ಪೋರ್ಟಲ್',
    onboarding_title: 'ಸುಲಭ ವ್ಯಾಪಾರ ನೋಂದಣಿ',
    agent_proposed: 'ಎಐ ಏಜೆಂಟ್ ಶಿಫಾರಸು ಮಾಡಿದೆ',
    human_confirm_required: 'ವ್ಯಾಪಾರ ಮಾಲೀಕರ ದೃಢೀಕರಣ ಅಗತ್ಯವಿದೆ',
    confirm: 'ದೃಢೀಕರಿಸಿ',
    reject: 'ತಿರಸ್ಕರಿಸಿ',
    status_active: 'ಸಕ್ರಿಯ',
    status_valid: 'ಮಾನ್ಯ ಮತ್ತು ದೃಢೀಕೃತ',
  },
  en: {
    app_title: 'OpenVyapar - Unified Business Identity',
    tagline: 'Reimagined Digital Public Infrastructure for India’s Business Owners',
    credentials: 'Verified Credentials',
    delegations: 'Delegations & Scopes',
    generate_proof: 'Generate Selective Proof',
    verifier_portal: 'Verifier Portal',
    onboarding_title: 'Zero-Footprint Onboarding',
    agent_proposed: 'Proposed by AI Agent',
    human_confirm_required: 'Owner Confirmation Required',
    confirm: 'Confirm & Sign',
    reject: 'Reject',
    status_active: 'Active',
    status_valid: 'Valid & Verified',
  },
};
