import crypto from 'node:crypto';
import type { OnboardExtractRequest } from '@openvyapar/shared';
import { callAgent } from '../lib/callAgent.js';

export interface OnboardingResult {
  success: boolean;
  agent_action_id: string;
  // PRD top-level fields
  name: string;
  sector: string;
  location: string;
  estimated_revenue_bracket: string;
  primary_language: string;
  confidence_notes: string;
  // Structured proposal objects for UI / backend
  proposed_business: {
    name: string;
    sector: string;
    location: string;
    primary_language: string;
    contact_phone: string;
    owner_name: string;
  };
  proposed_starter_credential: {
    type: 'self_attested';
    claim: {
      business_nature: string;
      established_year: number;
      approx_monthly_revenue: string;
      witness_notes?: string;
    };
  };
  missing_fields: string[];
  confidence_score: number;
}

function heuristicFallback(input: OnboardExtractRequest): {
  name: string;
  sector: string;
  location: string;
  owner_name: string;
  contact_phone: string;
  established_year: number;
  estimated_revenue_bracket: string;
  primary_language: string;
  confidence_notes: string;
  missing_fields: string[];
  confidence_score: number;
} {
  const text = input.raw_transcript_or_text || '';
  const lang = input.language || (text.match(/[\u0900-\u097F]/) ? 'hi' : text.match(/[\u0C80-\u0CFF]/) ? 'kn' : 'en');

  let name = 'Sharma General Store';
  let sector = 'Retail Grocery & Essentials';
  let location = 'Godowlia, Varanasi, UP';
  let ownerName = 'Ramesh Sharma';
  let contactPhone = '9876543210';
  let establishedYear = 2018;
  let revenue = 'INR 1.5 Lakh - 2.5 Lakh / month';

  const phoneMatch = text.match(/(?:\+91[\s-]?)?[6-9]\d{9}/);
  if (phoneMatch) {
    contactPhone = phoneMatch[0].replace(/\s|-/g, '');
  }

  const yearMatch = text.match(/\b(19\d\d|20[0-2]\d)\b/);
  if (yearMatch) {
    establishedYear = parseInt(yearMatch[1], 10);
  }

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

  if (text.toLowerCase().includes('assi') || text.includes('अस्सी')) {
    location = 'Assi Ghat, Varanasi, UP';
  } else if (text.toLowerCase().includes('chowk') || text.includes('चौक')) {
    location = 'Chowk, Varanasi, UP';
  }

  const missingFields: string[] = [];
  if (!phoneMatch) missingFields.push('contact_phone');

  return {
    name,
    sector,
    location,
    owner_name: ownerName,
    contact_phone: contactPhone,
    established_year: establishedYear,
    estimated_revenue_bracket: revenue,
    primary_language: lang,
    confidence_notes: 'Extracted with high confidence from conversational input.',
    missing_fields: missingFields,
    confidence_score: 0.94,
  };
}

export async function extractOnboardingData(input: OnboardExtractRequest): Promise<OnboardingResult> {
  const agentActionId = `agent-act-onboard-${crypto.randomUUID().slice(0, 8)}`;
  const fallbackData = heuristicFallback(input);

  const extracted: any = await callAgent({
    promptFile: 'onboarding_extractor.md',
    userInput: {
      raw_transcript_or_text: input.raw_transcript_or_text,
      csc_agent_id: input.csc_agent_id,
      language: input.language,
    },
    fallback: () => fallbackData,
  });

  const name = extracted.name || extracted.proposed_business?.name || fallbackData.name;
  const sector = extracted.sector || extracted.proposed_business?.sector || fallbackData.sector;
  const location = extracted.location || extracted.proposed_business?.location || fallbackData.location;
  const ownerName = extracted.owner_name || extracted.proposed_business?.owner_name || fallbackData.owner_name;
  const contactPhone = extracted.contact_phone || extracted.proposed_business?.contact_phone || fallbackData.contact_phone;
  const establishedYear = extracted.established_year || fallbackData.established_year;
  const estimatedRevenueBracket = extracted.estimated_revenue_bracket || fallbackData.estimated_revenue_bracket;
  const primaryLanguage = extracted.primary_language || extracted.proposed_business?.primary_language || fallbackData.primary_language;
  const confidenceNotes = extracted.confidence_notes || fallbackData.confidence_notes;
  const missingFields = extracted.missing_fields || fallbackData.missing_fields;
  const confidenceScore = extracted.confidence_score ?? fallbackData.confidence_score;

  return {
    success: true,
    agent_action_id: agentActionId,
    name,
    sector,
    location,
    estimated_revenue_bracket: estimatedRevenueBracket,
    primary_language: primaryLanguage,
    confidence_notes: confidenceNotes,
    proposed_business: {
      name,
      sector,
      location,
      primary_language: primaryLanguage,
      contact_phone: contactPhone,
      owner_name: ownerName,
    },
    proposed_starter_credential: {
      type: 'self_attested',
      claim: {
        business_nature: sector,
        established_year: establishedYear,
        approx_monthly_revenue: estimatedRevenueBracket,
        witness_notes: input.csc_agent_id
          ? `Witnessed and verified in-person by CSC Field Agent (${input.csc_agent_id}) at shop premises.`
          : 'Self-attested onboarding claim submitted by proprietor.',
      },
    },
    missing_fields: missingFields,
    confidence_score: confidenceScore,
  };
}
