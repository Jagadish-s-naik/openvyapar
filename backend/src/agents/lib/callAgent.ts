import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface CallAgentOptions<T> {
  promptFile: string;
  userInput: unknown;
  fallback: () => T;
}

/**
 * Shared helper to load system prompt from prompts/ directory.
 */
export function loadPrompt(filename: string): string {
  try {
    // Look up prompts relative to dist/ or src/
    const possiblePaths = [
      path.resolve(__dirname, '../../../prompts', filename),
      path.resolve(__dirname, '../../prompts', filename),
      path.resolve(__dirname, '../prompts', filename),
      path.resolve(process.cwd(), 'prompts', filename),
      path.resolve(process.cwd(), 'backend/prompts', filename),
      path.resolve(process.cwd(), 'agent-service/prompts', filename),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        return fs.readFileSync(p, 'utf-8');
      }
    }
  } catch (err) {
    console.warn(`[callAgent] Could not read prompt file ${filename} from disk:`, err);
  }
  return '';
}

/**
 * Shared LLM Caller (Supports Groq & OpenAI natively)
 * - Groq Endpoint: https://api.groq.com/openai/v1/chat/completions
 * - OpenAI Endpoint: https://api.openai.com/v1/chat/completions
 * - Sets response_format: { type: "json_object" }
 * - Uses process.env.GROQ_MODEL || process.env.OPENAI_MODEL || "openai/gpt-oss-120b"
 * - Gracefully falls back to deterministic heuristic logic if no API key or if API call fails
 */
export async function callAgent<T>(options: CallAgentOptions<T>): Promise<T> {
  const groqKey = process.env.GROQ_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  const isGroq = Boolean(groqKey || (openAiKey && openAiKey.startsWith('gsk_')));
  const apiKey = groqKey || openAiKey;

  const defaultModel = isGroq ? 'openai/gpt-oss-120b' : 'gpt-4o-mini';
  const model = process.env.GROQ_MODEL || process.env.OPENAI_MODEL || defaultModel;
  const baseUrl = process.env.OPENAI_BASE_URL || (isGroq ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions');

  if (!apiKey) {
    // Offline / demo fallback mode
    return options.fallback();
  }

  const systemPrompt = loadPrompt(options.promptFile);

  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: systemPrompt || 'You are an AI assistant in OpenVyapar. Return your output strictly as a JSON object.',
          },
          {
            role: 'user',
            content: typeof options.userInput === 'string'
              ? options.userInput
              : JSON.stringify(options.userInput, null, 2),
          },
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      const provider = isGroq ? 'Groq' : 'OpenAI';
      console.warn(`[callAgent] ${provider} API request failed (${response.status}): ${errText}. Falling back to deterministic engine.`);
      return options.fallback();
    }

    interface OpenAIChatCompletion {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    }

    const data = (await response.json()) as OpenAIChatCompletion;
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      console.warn('[callAgent] Empty response content from LLM. Falling back to deterministic engine.');
      return options.fallback();
    }

    const parsed = JSON.parse(content);
    return parsed as T;
  } catch (err) {
    console.warn('[callAgent] Error calling LLM API. Falling back to deterministic engine:', err);
    return options.fallback();
  }
}
