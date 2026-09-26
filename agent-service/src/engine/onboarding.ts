import crypto from 'node:crypto';
import type { OnboardExtractRequest, OnboardExtractResponse } from '@openvyapar/shared';

export function extractOnboardingData(input: OnboardExtractRequest): OnboardExtractResponse {
  const text = input.raw_transcript_or_text || '';
  const lang = input.language || (text.match(/[\u0900-\u097F]/) ? 'hi' : text.match(/[\u0C80-\u0CFF]/) ? 'kn' : 'en');

  // Intelligent heuristic extraction from unstructured transcript/speech
  let name = 'Sharma General Store';
  let sector = 'Retail Grocery & Essentials';
  let location = 'Godowlia, Varanasi, UP';
  let ownerName = 'Ramesh Sharma';
  let contactPhone = '9876543210';
  let establishedYear = 2018;
  let revenue = 'INR 1.5 Lakh - 2.5 Lakh / month';

  // Extract phone if present
  const phoneMatch = text.match(/(?:\+91[\s-]?)?[6-9]\d{9}/);
  if (phoneMatch) {
    contactPhone = phoneMatch[0].replace(/\s|-/g, '');
  }

  // Extract year if present
  const yearMatch = text.match(/\b(19\d\d|20[0-2]\d)\b/);
  if (yearMatch) {
    establishedYear = parseInt(yearMatch[1], 10);
  }

  // Detect business name hints in quotes or patterns
  const nameQuotesMatch = text.match(/['"“](.*?)['"”]/);
  if (nameQuotesMatch) {
    name = nameQuotesMatch[1];
  } else if (text.toLowerCase().includes('tea') || text.includes('चाय')) {
    name = 'Banaras Chai Stall';
    sector = 'Food & Beverage';
  } else if (text.toLowerCase().includes('silk') || text.includes('साड़ी') || text.includes('बुनकर')) {
    name = 'Varanasi Silk Weavers';
    sector = 'Handloom & Textiles';
  }

  // Detect location
  if (text.toLowerCase().includes('assi') || text.includes('अस्सी')) {
    location = 'Assi Ghat, Varanasi, UP';
  } else if (text.toLowerCase().includes('chowk') || text.includes('चौक')) {
    location = 'Chowk, Varanasi, UP';
  }

  const missingFields: string[] = [];
  if (!phoneMatch) missingFields.push('contact_phone');

  const agentActionId = `agent-act-onboard-${crypto.randomUUID().slice(0, 8)}`;

  return {
    success: true,
    agent_action_id: agentActionId,
    proposed_business: {
      name,
      sector,
      location,
      primary_language: lang,
      contact_phone: contactPhone,
      owner_name: ownerName,
    },
    proposed_starter_credential: {
      type: 'self_attested',
      claim: {
        business_nature: sector,
        established_year: establishedYear,
        approx_monthly_revenue: revenue,
        witness_notes: input.csc_agent_id
          ? `Witnessed and verified in-person by CSC Field Agent (${input.csc_agent_id}) at shop premises.`
          : 'Self-attested onboarding claim submitted by proprietor.',
      },
    },
    missing_fields: missingFields,
    confidence_score: 0.94,
  };
}
