/**
 * Standardized Delegation Scopes & Display Metadata
 */

export interface DelegationScopeDefinition {
  id: string;
  label_en: string;
  label_hi: string;
  label_kn: string;
  description_en: string;
  description_hi: string;
  description_kn: string;
  category: 'tax' | 'banking' | 'marketplace' | 'general';
  risk_level: 'low' | 'medium' | 'high';
}

export const DELEGATION_SCOPES: Record<string, DelegationScopeDefinition> = {
  file_returns: {
    id: 'file_returns',
    label_en: 'File Tax & GST Returns',
    label_hi: 'टैक्स और जीएसटी रिटर्न दाखिल करें',
    label_kn: 'ತೆರಿಗೆ ಮತ್ತು ಜಿಎಸ್‌ಟಿ ರಿಟರ್ನ್ಸ್ ಸಲ್ಲಿಸಿ',
    description_en: 'Allows drafting and submitting GSTR-1 and GSTR-3B filings on behalf of business.',
    description_hi: 'व्यापार की ओर से जीएसटी रिटर्न दाखिल करने की अनुमति देता है।',
    description_kn: 'ವ್ಯಾಪಾರದ ಪರವಾಗಿ ಜಿಎಸ್‌ಟಿ ರಿಟರ್ನ್ಸ್‌ಗಳನ್ನು ಸಲ್ಲಿಸಲು ಅನುಮತಿಸುತ್ತದೆ.',
    category: 'tax',
    risk_level: 'medium',
  },
  view_compliance: {
    id: 'view_compliance',
    label_en: 'View Compliance Status',
    label_hi: 'अनुपालन स्थिति देखें',
    label_kn: 'ಅನುಸರಣೆ ಸ್ಥಿತಿಯನ್ನು ವೀಕ್ಷಿಸಿ',
    description_en: 'Allows read-only access to view filing receipts and status history.',
    description_hi: 'फाइलिंग रसीदें और अनुपालन स्थिति देखने की अनुमति देता है।',
    description_kn: 'ಫೈಲಿಂಗ್ ರಸೀದಿಗಳು ಮತ್ತು ಸ್ಥಿತಿಯನ್ನು ಮಾತ್ರ ವೀಕ್ಷಿಸಲು ಅನುಮತಿಸುತ್ತದೆ.',
    category: 'tax',
    risk_level: 'low',
  },
  view_order_history: {
    id: 'view_order_history',
    label_en: 'View Orders & Sales History',
    label_hi: 'ऑर्डर और बिक्री इतिहास देखें',
    label_kn: 'ಆದೇಶಗಳು ಮತ್ತು ಮಾರಾಟ ಇತಿಹಾಸವನ್ನು ವೀಕ್ಷಿಸಿ',
    description_en: 'Allows viewing marketplace transaction volumes and delivery ratings.',
    description_hi: 'मार्केटप्लेस लेनदेन और डिलीवरी रेटिंग देखने की अनुमति।',
    description_kn: 'ಮಾರುಕಟ್ಟೆ ವಹಿವಾಟುಗಳು ಮತ್ತು ವಿತರಣಾ ರೇಟಿಂಗ್‌ಗಳನ್ನು ವೀಕ್ಷಿಸಲು ಅನುಮತಿಸುತ್ತದೆ.',
    category: 'marketplace',
    risk_level: 'low',
  },
  update_profile: {
    id: 'update_profile',
    label_en: 'Update Business Profile',
    label_hi: 'व्यापार प्रोफ़ाइल अपडेट करें',
    label_kn: 'ವ್ಯಾಪಾರ ಪ್ರೊಫೈಲ್ ನವೀಕರಿಸಿ',
    description_en: 'Allows editing business contact info, address, and operating categories.',
    description_hi: 'व्यापार संपर्क जानकारी और पता अपडेट करने की अनुमति।',
    description_kn: 'ವ್ಯಾಪಾರ ಸಂಪರ್ಕ ವಿವರಗಳನ್ನು ನವೀಕರಿಸಲು ಅನುಮತಿಸುತ್ತದೆ.',
    category: 'general',
    risk_level: 'medium',
  },
  submit_loan_application: {
    id: 'submit_loan_application',
    label_en: 'Submit Loan Application',
    label_hi: 'ऋण आवेदन जमा करें',
    label_kn: 'ಸಾಲ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ',
    description_en: 'Allows initiating MSME credit proof requests to accredited lenders.',
    description_hi: 'मान्यता प्राप्त उधारदाताओं को ऋण आवेदन प्रमाण भेजने की अनुमति।',
    description_kn: 'ಮಾನ್ಯತೆ ಪಡೆದ ಸಾಲದಾತರಿಗೆ ಸಾಲದ ಅರ್ಜಿಯನ್ನು ಸಲ್ಲಿಸಲು ಅನುಮತಿಸುತ್ತದೆ.',
    category: 'banking',
    risk_level: 'high',
  },
};
